import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import type { ZodType } from 'zod'

const REQUEST_ID = /^[A-Za-z0-9_-]{8,80}$/

export function getRequestId(request: Request): string {
  const supplied = request.headers.get('x-request-id')?.trim()
  return supplied && REQUEST_ID.test(supplied) ? supplied : randomUUID()
}
export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 64) || 'unknown'
}

export function opaqueRateKey(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return process.env.NODE_ENV !== 'production'
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

export async function readJson<T>(
  request: Request,
  schema: ZodType<T>,
  options: { maxBytes?: number; requireSameOrigin?: boolean } = {}
): Promise<{ data: T; requestId: string; error?: never } | { data?: never; requestId: string; error: NextResponse }> {
  const requestId = getRequestId(request)
  const headers = { 'x-request-id': requestId }
  const maxBytes = options.maxBytes ?? 64 * 1024

  if (options.requireSameOrigin !== false && !sameOrigin(request)) {
    return { requestId, error: NextResponse.json({ message: 'Request origin was rejected.' }, { status: 403, headers }) }
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return { requestId, error: NextResponse.json({ message: 'Content-Type must be application/json.' }, { status: 415, headers }) }
  }
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { requestId, error: NextResponse.json({ message: 'Request payload is too large.' }, { status: 413, headers }) }
  }

  let body: unknown
  try {
    const bytes = new Uint8Array(await request.arrayBuffer())
    if (bytes.byteLength > maxBytes) {
      return { requestId, error: NextResponse.json({ message: 'Request payload is too large.' }, { status: 413, headers }) }
    }
    body = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return { requestId, error: NextResponse.json({ message: 'Invalid JSON request payload.' }, { status: 400, headers }) }
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return {
      requestId,
      error: NextResponse.json(
        { message: 'Invalid request values.', errors: parsed.error.flatten().fieldErrors },
        { status: 400, headers }
      ),
    }
  }
  return { data: parsed.data, requestId }
}
