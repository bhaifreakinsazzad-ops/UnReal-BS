import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { createStepUpToken, STEP_UP_TTL_SECONDS, verifyStepUpToken } from './step-up'

describe('password re-verification token', () => {
  beforeEach(() => { process.env.AUTH_SECRET = 'test-secret-that-is-long-enough-for-hmac' })
  afterEach(() => { delete process.env.AUTH_SECRET })

  it('binds the token to the user and ten-minute lifetime', () => {
    const now = Date.UTC(2026, 7, 5)
    const token = createStepUpToken('Owner@Example.com', now)
    expect(token).toBeTruthy()
    expect(verifyStepUpToken(token!, 'owner@example.com', now + (STEP_UP_TTL_SECONDS - 1) * 1000)).toBe(true)
    expect(verifyStepUpToken(token!, 'someone@example.com', now)).toBe(false)
    expect(verifyStepUpToken(token!, 'owner@example.com', now + STEP_UP_TTL_SECONDS * 1000)).toBe(false)
  })

  it('rejects tampering', () => {
    const token = createStepUpToken('owner@example.com')!
    expect(verifyStepUpToken(`${token.slice(0, -1)}x`, 'owner@example.com')).toBe(false)
  })
})
