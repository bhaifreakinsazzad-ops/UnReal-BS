import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { checkRateLimit } from '@/lib/rate-limit'
import { getProvider } from '@/lib/ai-providers'
import { isTavilyConfigured, tavilySearch } from '@/lib/tools/tavily-search'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0004_shared_wallet_and_virtual_cards.sql.'

// Neutral, non-BhaiFreakin-branded system prompt — this is a "pick your
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

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

const MAX_OUTPUT_TOKENS = 1024

// Deliberately pessimistic. English averages ~4 characters per token; using 3
// over-estimates the input, so the pre-flight gate errs toward rejecting a
// request we might not be able to charge for, never toward letting an
// unaffordable one reach a paid provider.
const CHARS_PER_TOKEN_ESTIMATE = 3

interface ModelRate {
  input_rate_bdt_per_1k: number | string
  output_rate_bdt_per_1k: number | string
  markup_multiplier: number | string
}

// Worst-case cost of a request BEFORE it is sent upstream: all prompt
// characters as input, plus a full maxTokens response.
function estimateCostBdt(promptChars: number, rate: ModelRate): number {
  const estInputTokens = Math.ceil(promptChars / CHARS_PER_TOKEN_ESTIMATE)
  return round2(
    (estInputTokens / 1000) * Number(rate.input_rate_bdt_per_1k) * Number(rate.markup_multiplier) +
      (MAX_OUTPUT_TOKENS / 1000) * Number(rate.output_rate_bdt_per_1k) * Number(rate.markup_multiplier)
  )
}

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
      .select('id, provider, model_id, display_name, input_rate_bdt_per_1k, output_rate_bdt_per_1k, markup_multiplier')
      .eq('model_id', modelId)
      .eq('is_active', true)
      .maybeSingle()

    if (rateError) {
      await logError('ai-subscriptions-chat-rate-lookup', rateError, { userId, modelId })
      return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    }
    if (!rate) return NextResponse.json({ message: 'Unknown or inactive model.' }, { status: 400 })

    const { data: wallet, error: walletError } = await supabase
      .from('unreal_bs_wallets')
      .select('balance_bdt')
      .eq('user_id', userId)
      .maybeSingle()

    if (walletError) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    // Cheap early exit. The real affordability gate is the estimate below —
    // this check alone used to be the ONLY one, which meant a wallet holding
    // ৳0.01 could drive unlimited paid upstream calls, because the charge was
    // only attempted after the provider had already billed us and a failed
    // charge left the balance untouched.
    const balanceBdt = wallet ? Number(wallet.balance_bdt) : 0
    if (!wallet || balanceBdt <= 0) {
      return NextResponse.json(
        { message: 'Insufficient balance. Please top up before chatting.' },
        { status: 402 }
      )
    }

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

    if (balanceBdt < estimatedCostBdt) {
      return NextResponse.json(
        {
          message: `This message could cost up to ৳${estimatedCostBdt.toFixed(2)} and your balance is ৳${balanceBdt.toFixed(2)}. Please top up, or send a shorter message.`,
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

    const { usage } = providerResponse
    const costBdt = round2(
      (usage.inputTokens / 1000) * Number(rate.input_rate_bdt_per_1k) * Number(rate.markup_multiplier) +
        (usage.outputTokens / 1000) * Number(rate.output_rate_bdt_per_1k) * Number(rate.markup_multiplier)
    )

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
      // TODO: also write a status='failed' row to unreal_bs_ai_usage_ledger.
      // Blocked today because that table's NOT NULL wallet_id references the
      // legacy unreal_bs_ai_wallets, which migration 0004 superseded with
      // unreal_bs_wallets — see the duplicate unreal_bs_ai_debit_wallet
      // definitions in 0003 and 0004. Needs a migration to resolve first.
      await logError(
        'ai-subscriptions-chat-UNBILLED-LEAK',
        debitError,
        { userId, modelId, provider: rate.provider, costBdt, estimatedCostBdt, balanceBeforeBdt: balanceBdt }
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
