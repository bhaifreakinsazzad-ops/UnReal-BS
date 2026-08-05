import 'server-only'

export const ABSOLUTE_SESSION_TTL_SECONDS = 8 * 60 * 60
export const ABSOLUTE_SESSION_EXPIRY_KEY = 'unrealAbsoluteExpiresAt'

export function enforceAbsoluteSession<T extends Record<string, unknown>>(
  token: T,
  isNewSignIn: boolean,
  now = Date.now()
): T | null {
  const existing = token[ABSOLUTE_SESSION_EXPIRY_KEY]
  const expiresAt = isNewSignIn || typeof existing !== 'number'
    ? now + ABSOLUTE_SESSION_TTL_SECONDS * 1000
    : existing
  if (now >= expiresAt) return null
  return { ...token, [ABSOLUTE_SESSION_EXPIRY_KEY]: expiresAt }
}
