import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { checkRateLimit } from '@/lib/rate-limit'
import { getProvider } from '@/lib/ai-providers'
import { isTavilyConfigured, tavilySearch } from '@/lib/tools/tavily-search'
import { logError } from '@/lib/log-error'
import {
  DEFAULT_DAILY_SPEND_CAP_BDT,
  DEFAULT_FREE_DAILY_MESSAGES,
  actualCostBdt,
  decideBilling,
  estimateCostBdt,
  round2,
  startOfDayDhakaIso,
  usageWithFallback,
} from '@/lib/pricing'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0004_shared_wallet_and_virtual_cards.sql.'

// Neutral, non-UnReal AI-branded system prompt — this is a "pick your
// model" tool, not the free branded assistant.
const SYSTEM_PROMPT = 'You are a helpful AI assistant. Answer clearly and practically.'

const chatSchema = z.object({
  modelId: z.string().trim().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1)
    .max(30),
  // Optional — defaults to false so this stays a no-op for existing callers
  // (this route is live in production). When true and Tavily is configured,
  // the latest user message is used to search the web and ground the reply.
  useSearch: z.boolean().optional().default(false),
})







async function requireUserId() {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return { error: NextResponse.json({ message: 'Authentication required.' }, { status: 401 }) }

  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }

  try {
    const userId = await resolveUserIdByEmail(email)
    if (!userId) {
      return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
    }
    return { userId }
  } catch {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }
}

export async function POST(request: Request) {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  try {
    const rateLimit = await checkRateLimit('ai-chat', userId, { max: 30, windowSeconds: 60 })
    if (!rateLimit.allowed) {
      return NextResponse.json({ message: 'Too many requests. Please slow down.' }, { status: 429 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
    }

    const parsed = chatSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid request payload.', errors: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { modelId, messages, useSearch } = parsed.data

    const supabase = getSupabaseAdmin()

    // Explicit column list rather than select('*') so that schema drift fails
    // loudly here instead of silently disabling a money guard. The previous
    // `rate.active_until` check below read a column that has never existed, so
    // it was always undefined and the model-retirement guard never once fired.
    const { data: rate, error: rateError } = await supabase
      .from('unreal_bs_ai_model_rates')
      .select('id, provider, model_id, display_name, input_rate_bdt_per_1k, output_rate_bdt_per_1k, markup_multiplier, free_tier_eligible')
      .eq('model_id', modelId)
      .eq('is_active', true)
      .maybeSingle()

    if (rateError) {
      await logError('ai-subscriptions-chat-rate-lookup', rateError, { userId, modelId })
      return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    }
    if (!rate) return NextResponse.json({ message: 'Unknown or inactive model.' }, { status: 400 })

    const [{ data: wallet, error: walletError }, { data: userRow }] = await Promise.all([
      supabase.from('unreal_bs_wallets').select('balance_bdt').eq('user_id', userId).maybeSingle(),
      supabase
        .from('unreal_bs_users')
        .select('daily_spend_cap_bdt, free_daily_messages')
        .eq('id', userId)
        .maybeSingle(),
    ])

    if (walletError) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    const balanceBdt = wallet ? Number(wallet.balance_bdt) : 0

    // Per-user overrides fall back to the platform defaults. Null means "use
    // the default"; 0 is a real value that freezes the behaviour outright.
    const dailyCapBdt =
      userRow?.daily_spend_cap_bdt != null ? Number(userRow.daily_spend_cap_bdt) : DEFAULT_DAILY_SPEND_CAP_BDT
    const freeDailyLimit =
      userRow?.free_daily_messages != null ? Number(userRow.free_daily_messages) : DEFAULT_FREE_DAILY_MESSAGES

    // Today's usage, read from the ledger itself rather than a denormalised
    // counter so it cannot drift out of sync with what was actually charged.
    const since = startOfDayDhakaIso()
    const { data: todayRows } = await supabase
      .from('unreal_bs_ai_usage_ledger')
      .select('cost_bdt, is_free')
      .eq('user_id', userId)
      .gte('created_at', since)

    const spentTodayBdt = (todayRows ?? [])
      .filter((r) => !r.is_free)
      .reduce((sum, r) => sum + Number(r.cost_bdt), 0)
    const freeUsedToday = (todayRows ?? []).filter((r) => r.is_free).length

    // Optional web-search grounding. Best-effort only: any failure here
    // (Tavily unconfigured or the call itself erroring) is logged and
    // swallowed so a search hiccup never fails the whole chat request.
    let searchContextMessage: { role: 'system'; content: string } | null = null
    if (useSearch) {
      if (!isTavilyConfigured()) {
        await logError('ai-subscriptions-chat-tavily-unavailable', new Error('Tavily not configured'), {
          userId,
          modelId,
        })
      } else {
        try {
          const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
          if (lastUserMessage) {
            const { results } = await tavilySearch(lastUserMessage.content)
            const top = results.slice(0, 3)
            if (top.length > 0) {
              const summary = top
                .map((r, i) => `[${i + 1}] ${r.title} (${r.url})\n${r.content}`)
                .join('\n\n')
              searchContextMessage = {
                role: 'system',
                content: `Web search results for context (use if relevant, cite sources by URL when you do):\n\n${summary}`,
              }
            }
          }
        } catch (err) {
          await logError('ai-subscriptions-chat-tavily-search-failed', err, { userId, modelId })
        }
      }
    }

    // ── Affordability gate ────────────────────────────────────────────────
    // Nothing above this point has cost money. Estimate the worst-case charge
    // for THIS request (including the system prompt and any search context we
    // just built) and refuse unless the wallet covers it. Without this, a
    // request that cannot be paid for still reaches a paid provider and we
    // absorb the bill.
    const promptChars =
      SYSTEM_PROMPT.length +
      (searchContextMessage?.content.length ?? 0) +
      messages.reduce((n, m) => n + m.content.length, 0)
    const estimatedCostBdt = estimateCostBdt(promptChars, rate)

    // Decide how this message is paid for, in priority order:
    //   1. wallet — if the balance covers it AND it stays inside today's cap
    //   2. free allowance — registered users get a few messages/day on the
    //      cheapest model, so a new signup can genuinely try the product
    //   3. refuse, with a message that says which limit was hit
    // Decision lives in lib/pricing.ts so it is unit-tested — see
    // lib/pricing.test.ts, which covers the cap boundary, the free-tier
    // fallback, and the "0 means freeze, not unlimited" cases.
    const { mode: billingMode, refusal, freeRemaining } = decideBilling({
      estimatedCostBdt,
      balanceBdt,
      spentTodayBdt,
      dailyCapBdt,
      freeUsedToday,
      freeDailyLimit,
      modelIsFreeEligible: rate.free_tier_eligible === true,
    })

    if (billingMode === null) {
      // Distinguish the reasons — "top up" is useless advice to someone who
      // has money but has hit the daily cap.
      if (refusal === 'daily_cap') {
        return NextResponse.json(
          {
            message: `You have reached today's spending limit of ৳${dailyCapBdt.toFixed(0)}. This resets at midnight. Your balance is safe — contact support if you need a higher limit.`,
            code: 'DAILY_CAP_REACHED',
            dailyCapBdt,
            spentTodayBdt: round2(spentTodayBdt),
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          message:
            freeDailyLimit > 0 && rate.free_tier_eligible
              ? `You have used all ${freeDailyLimit} free messages for today, and your balance is ৳${balanceBdt.toFixed(2)}. Top up to keep going, or come back tomorrow.`
              : `This message could cost up to ৳${estimatedCostBdt.toFixed(2)} and your balance is ৳${balanceBdt.toFixed(2)}. Please top up, or send a shorter message.`,
          code: 'INSUFFICIENT_BALANCE',
        },
        { status: 402 }
      )
    }

    let providerResponse
    try {
      const provider = getProvider(rate.provider)
      providerResponse = await provider.chat({
        model: rate.model_id,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...(searchContextMessage ? [searchContextMessage] : []),
          ...messages,
        ],
        maxTokens: 1024,
      })
    } catch (err) {
      await logError('ai-subscriptions-chat-provider-call', err, { userId, provider: rate.provider, modelId })
      return NextResponse.json(
        { message: 'The AI provider is temporarily unavailable. Please try again.' },
        { status: 502 }
      )
    }

    // Eight of the nine provider adapters coerce a missing usage object to
    // `?? 0`, and HuggingFace/Cohere type it as optional. A 0/0 usage with real
    // content meant cost rounded to ৳0.00, the charge "succeeded" against any
    // balance, and a ledger row was written claiming zero tokens — we paid the
    // provider, billed the customer nothing, and recorded a falsified entry in
    // the table the migration calls the source of truth for disputes.
    // Estimating here covers every adapter, present and future, in one place.
    const { usage, estimated } = usageWithFallback(
      providerResponse.usage,
      promptChars,
      providerResponse.content.trim().length
    )
    if (estimated) {
      await logError(
        'ai-usage-estimated-provider-reported-none',
        new Error('Provider returned no usage data; billed on character estimate'),
        { userId, modelId, provider: rate.provider, estimated: usage }
      )
    }

    const costBdt = actualCostBdt(usage, rate)

    // A free message is logged to the same ledger with is_free = true and zero
    // cost, so free and paid usage report together and can never be confused.
    if (billingMode === 'free') {
      const { data: freeLedger, error: freeError } = await supabase.rpc('unreal_bs_ai_log_free_usage', {
        p_user_id: userId,
        p_model_rate_id: rate.id,
        p_provider: rate.provider,
        p_model_id: rate.model_id,
        p_input_tokens: usage.inputTokens,
        p_output_tokens: usage.outputTokens,
      })

      if (freeError) {
        // The reply is already paid for upstream; failing to record it would
        // hand out an unlimited free tier, so surface it rather than swallow.
        await logError('ai-subscriptions-chat-free-log-failed', freeError, { userId, modelId })
      }

      return NextResponse.json({
        reply: providerResponse.content,
        cost: 0,
        balanceAfter: Number(freeLedger?.balance_after_bdt ?? balanceBdt),
        billedAs: 'free',
        freeRemainingToday: Math.max(0, freeRemaining - 1),
      })
    }

    const { data: ledger, error: debitError } = await supabase.rpc('unreal_bs_ai_debit_wallet', {
      p_user_id: userId,
      p_model_rate_id: rate.id,
      p_provider: rate.provider,
      p_model_id: rate.model_id,
      p_input_tokens: usage.inputTokens,
      p_output_tokens: usage.outputTokens,
      p_cost_bdt: costBdt,
    })

    if (debitError) {
      // The provider has ALREADY billed us at this point and the user's balance
      // is unchanged, so this is real money leaving the business. The
      // pre-flight estimate above should make it rare, but it is still possible
      // (concurrent spend between the estimate and the debit, or an actual
      // response far larger than estimated). Logged as UNBILLED-LEAK so it can
      // be grepped and reconciled against the provider invoice.
      //
      await logError(
        'ai-subscriptions-chat-UNBILLED-LEAK',
        debitError,
        { userId, modelId, provider: rate.provider, costBdt, estimatedCostBdt, balanceBeforeBdt: balanceBdt, spentTodayBdt }
      )
      return NextResponse.json(
        { message: 'Insufficient balance for this response. Please top up.' },
        { status: 402 }
      )
    }

    return NextResponse.json({
      reply: providerResponse.content,
      cost: costBdt,
      balanceAfter: Number(ledger?.balance_after_bdt),
    })
  } catch (err) {
    await logError('ai-subscriptions-chat-route-post', err, { userId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
