import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { getProvider, isProviderConfigured, AIProviderError } from '@/lib/ai-providers'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

// Free-tier server-side fallback for UnReal AI (the free product) — used
// when the client-side Puter.js session isn't ready/authenticated, so the
// assistant is never fully blocked. Unmetered, no wallet involved: this is
// deliberately separate from the paid AI Subscriptions route
// (app/api/ai-subscriptions/chat/route.ts), which bills real provider cost
// from a customer's wallet. Uses a genuinely free OpenRouter model
// (verified against openrouter.ai's live model list, not guessed).
const FREE_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'

const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string().min(1).max(8000) }))
    .min(1)
    .max(30),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 })
  }

  if (!isProviderConfigured('openrouter')) {
    return NextResponse.json(
      { message: 'The free AI fallback is not configured (missing OPENROUTER_API_KEY).' },
      { status: 503 }
    )
  }

  const rateLimit = await checkRateLimit('ask-ai-fallback', session.user.email, { max: 20, windowSeconds: 60 })
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

  try {
    const provider = getProvider('openrouter')
    const response = await provider.chat({
      model: FREE_MODEL,
      messages: parsed.data.messages,
      maxTokens: 1024,
    })

    return NextResponse.json({ reply: response.content })
  } catch (err) {
    const status = err instanceof AIProviderError ? err.status : 502
    await logError('ask-ai-fallback-chat', err, { email: session.user.email })
    return NextResponse.json(
      { message: 'The free AI fallback is temporarily unavailable. Please try again.' },
      { status: status >= 400 && status < 600 ? status : 502 }
    )
  }
}
