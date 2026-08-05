import 'server-only'
import { createHmac, createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import type { NextRequest, NextResponse } from 'next/server'

export const STEP_UP_COOKIE = '__Host-unreal_step_up'
export const STEP_UP_TTL_SECONDS = 10 * 60

function signingKey(): string | null {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || null
}
function subject(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('base64url')
}

function sign(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url')
}

export function createStepUpToken(email: string, now = Date.now()): string | null {
  const key = signingKey()
  if (!key) return null
  const payload = Buffer.from(
    JSON.stringify({ sub: subject(email), iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + STEP_UP_TTL_SECONDS, jti: randomUUID() })
  ).toString('base64url')
  return `${payload}.${sign(payload, key)}`
}

export function verifyStepUpToken(token: string | undefined, email: string, now = Date.now()): boolean {
  const key = signingKey()
  if (!key || !token) return false
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra) return false
  const expected = sign(payload, key)
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: string; iat?: number; exp?: number }
    const nowSeconds = Math.floor(now / 1000)
    return parsed.sub === subject(email) && Number.isInteger(parsed.iat) && Number.isInteger(parsed.exp) && parsed.iat! <= nowSeconds + 30 && parsed.exp! > nowSeconds && parsed.exp! - parsed.iat! <= STEP_UP_TTL_SECONDS
  } catch {
    return false
  }
}

export function hasFreshStepUp(request: NextRequest | Request, email: string): boolean {
  const cookie = 'cookies' in request
    ? request.cookies.get(STEP_UP_COOKIE)?.value
    : request.headers.get('cookie')?.split(';').map((v) => v.trim()).find((v) => v.startsWith(`${STEP_UP_COOKIE}=`))?.slice(STEP_UP_COOKIE.length + 1)
  return verifyStepUpToken(cookie, email)
}

export function setStepUpCookie(response: NextResponse, token: string): void {
  response.cookies.set(STEP_UP_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: STEP_UP_TTL_SECONDS,
    priority: 'high',
  })
}

export function clearStepUpCookie(response: NextResponse): void {
  response.cookies.set(STEP_UP_COOKIE, '', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 })
}
