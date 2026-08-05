import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logError } from '@/lib/log-error'
import { checkRateLimit } from '@/lib/rate-limit'
import { clientIp, opaqueRateKey } from '@/lib/security/request'

// Client-side error reporting endpoint. `lib/log-error.ts` is `server-only`
// and cannot be imported directly from a Client Component (e.g. the
// dashboard error boundary), so this route is the bridge: client code
// fetches it, and the actual DB write happens here on the server.

const schema = z.object({
  source: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
  digest: z.string().trim().optional(),
})

export async function POST(request: Request) {
  // This endpoint is unauthenticated by necessity (it must work even when a
  // dashboard crash happens mid-session), so rate-limit by IP to stop it
  // being used to spam the error_logs table.
  const { allowed } = await checkRateLimit('log-error', opaqueRateKey(clientIp(request)), { max: 20, windowSeconds: 3600 })
  if (!allowed) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  await logError(parsed.data.source, new Error(parsed.data.message), {
    digest: parsed.data.digest,
  })

  return NextResponse.json({ ok: true })
}
