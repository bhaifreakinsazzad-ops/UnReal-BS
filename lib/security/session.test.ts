import { describe, expect, it } from 'vitest'
import { ABSOLUTE_SESSION_EXPIRY_KEY, ABSOLUTE_SESSION_TTL_SECONDS, enforceAbsoluteSession } from './session'

describe('absolute authentication session', () => {
  it('sets one fixed eight-hour expiry at sign in', () => {
    const now = 1_000_000
    const token = enforceAbsoluteSession<Record<string, unknown>>({ sub: 'user' }, true, now)
    expect(token?.[ABSOLUTE_SESSION_EXPIRY_KEY]).toBe(now + ABSOLUTE_SESSION_TTL_SECONDS * 1000)
  })

  it('does not extend the absolute expiry when an active JWT is refreshed', () => {
    const expiresAt = 2_000_000
    const token = enforceAbsoluteSession({ sub: 'user', [ABSOLUTE_SESSION_EXPIRY_KEY]: expiresAt }, false, 1_500_000)
    expect(token?.[ABSOLUTE_SESSION_EXPIRY_KEY]).toBe(expiresAt)
  })

  it('invalidates the token at the absolute deadline', () => {
    const token = { sub: 'user', [ABSOLUTE_SESSION_EXPIRY_KEY]: 2_000_000 }
    expect(enforceAbsoluteSession(token, false, 2_000_000)).toBeNull()
  })
})
