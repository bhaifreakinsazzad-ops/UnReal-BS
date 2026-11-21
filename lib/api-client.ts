/**
 * Shared browser-side helper for calling the app's own `/api/*` route handlers.
 *
 * `fetch()` does not reject on 4xx/5xx responses, so every call site used to
 * repeat the same dance: check `res.ok`, parse the body defensively (error
 * payloads are not always valid JSON), and prefer the server-provided
 * `message` over a generic fallback. This module centralizes that pattern.
 *
 * Server authorization is unchanged — this only standardizes how the client
 * interprets responses.
 */

/** An HTTP error carrying the status code and the best available message. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function withJsonContentType(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers)
  if (init?.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return { ...init, headers }
}

/**
 * Parses a response body as JSON, tolerating empty or non-JSON bodies.
 * Returns `fallback` when parsing fails.
 */
export async function safeJson<T = Record<string, unknown>>(
  res: Response,
  fallback: T = {} as T,
): Promise<T> {
  try {
    return (await res.json()) as T
  } catch {
    return fallback
  }
}

/** Extracts the most specific server error message from a parsed body. */
export function apiErrorMessage(body: unknown): string | null {
  if (body && typeof body === 'object') {
    const message = (body as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return null
}

/**
 * Performs a request and returns the parsed JSON body.
 * Throws {@link ApiError} for non-2xx responses, using the server's `message`
 * field when present, otherwise `fallbackMessage`.
 */
export async function apiJson<T = Record<string, unknown>>(
  url: string,
  init?: RequestInit,
  fallbackMessage = 'Request failed.',
): Promise<T> {
  const res = await fetch(url, withJsonContentType(init))
  const body = await safeJson(res)
  if (!res.ok) {
    throw new ApiError(res.status, apiErrorMessage(body) ?? fallbackMessage)
  }
  return body as T
}

/**
 * Runs a step-up-authenticated action with a caller-supplied request factory
 * (use when custom headers such as `Idempotency-Key` are required). Performs
 * `request`, and when the server answers 428 (session present but step-up
 * cookie missing/expired), prompts for the password, verifies it via
 * `/api/auth/reverify`, and retries the original request once. Resolves with
 * the final `Response`; the caller checks `res.ok` and parses the body.
 */
export async function stepUpFetch(options: {
  request: () => Promise<Response>
  reverifyMessage: string
  cancelledMessage?: string
  badPasswordMessage?: string
}): Promise<Response> {
  const res = await options.request()
  if (res.status !== 428) return res
  const { requestPasswordReverification } = await import('@/lib/security/reverify-client')
  const password = await requestPasswordReverification(options.reverifyMessage)
  if (!password) throw new ApiError(428, options.cancelledMessage ?? 'Password re-verification was cancelled.')
  const verifiedRes = await fetch('/api/auth/reverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!verifiedRes.ok) {
    throw new ApiError(verifiedRes.status, options.badPasswordMessage ?? 'Password verification failed.')
  }
  return options.request()
}

/**
 * Like {@link apiJson}, but for step-up-protected endpoints: transparently
 * handles the 428 → password prompt → retry flow.
 */
export async function apiStepUpJson<T = Record<string, unknown>>(
  url: string,
  init: RequestInit | undefined,
  messages: {
    reverify: string
    failure: string
    cancelled?: string
    badPassword?: string
  },
): Promise<T> {
  const res = await stepUpFetch({
    request: () => fetch(url, withJsonContentType(init)),
    reverifyMessage: messages.reverify,
    cancelledMessage: messages.cancelled,
    badPasswordMessage: messages.badPassword,
  })
  const body = await safeJson(res)
  if (!res.ok) {
    throw new ApiError(res.status, apiErrorMessage(body) ?? messages.failure)
  }
  return body as T
}
