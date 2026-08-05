import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { recordAuditEvent } from '@/lib/security/audit'
import { verifyPasswordForEmail } from '@/lib/security/admin'
import { createStepUpToken, setStepUpCookie } from '@/lib/security/step-up'
import { clientIp, opaqueRateKey, readJson } from '@/lib/security/request'

const schema = z.object({ password: z.string().min(1).max(200) })

export async function POST(request: Request) {
  const session = await auth()
  const email = session?.user?.email?.trim().toLowerCase()
  if (!email) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 })

  const parsed = await readJson(request, schema, { maxBytes: 4096 })
  if (parsed.error) return parsed.error

  const [userLimit, ipLimit] = await Promise.all([
    checkRateLimit('auth-reverify-user', opaqueRateKey(email), { max: 6, windowSeconds: 900, failClosed: true }),
    checkRateLimit('auth-reverify-ip', opaqueRateKey(clientIp(request)), { max: 20, windowSeconds: 900, failClosed: true }),
  ])
  if (!userLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json({ message: 'Too many verification attempts. Try again later.' }, { status: 429, headers: { 'x-request-id': parsed.requestId } })
  }

  const verified = await verifyPasswordForEmail(email, parsed.data.password)
  await recordAuditEvent({ eventType: verified ? 'auth.reverify.succeeded' : 'auth.reverify.failed', actorEmail: email, requestId: parsed.requestId })
  if (!verified) {
    return NextResponse.json({ message: 'Password verification failed.' }, { status: 401, headers: { 'x-request-id': parsed.requestId } })
  }

  const token = createStepUpToken(email)
  if (!token) return NextResponse.json({ message: 'Verification is temporarily unavailable.' }, { status: 503 })
  const response = NextResponse.json({ ok: true, expiresInSeconds: 600 }, { headers: { 'x-request-id': parsed.requestId } })
  setStepUpCookie(response, token)
  return response
}
