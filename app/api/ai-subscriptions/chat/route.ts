import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { checkRateLimit } from '@/lib/rate-limit'
import { getProvider } from '@/lib/ai-providers'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0003_ai_subscriptions.sql.'

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
})

function round2(n: number): number {
  return Math.round(n * 100) / 100
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
    const { modelId, messages } = parsed.data

    const supabase = getSupabaseAdmin()

    const { data: rate, error: rateError } = await supabase
      .from('unreal_bs_ai_model_rates')
      .select('*')
      .eq('model_id', modelId)
      .eq('is_active', true)
      .maybeSingle()

    if (rateError) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    if (!rate) return NextResponse.json({ message: 'Unknown or inactive model.' }, { status: 400 })

    const { data: wallet, error: walletError } = await supabase
      .from('unreal_bs_ai_wallets')
      .select('balance_bdt')
      .eq('user_id', userId)
      .maybeSingle()

    if (walletError) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    if (!wallet || Number(wallet.balance_bdt) <= 0) {
      return NextResponse.json(
        { message: 'Insufficient balance. Please top up before chatting.' },
        { status: 402 }
      )
    }

    let providerResponse
    try {
      const provider = getProvider(rate.provider)
      providerResponse = await provider.chat({
        model: rate.model_id,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
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
      await logError('ai-subscriptions-chat-debit-race', debitError, { userId, costBdt })
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
