import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { generateAccessToken, hashAccessToken } from './access-token'

describe('buyer access tokens', () => {
  it('returns a bearer once and stores only its SHA-256 hash', () => {
    const token = generateAccessToken()
    expect(token.raw).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(token.hash).toMatch(/^[a-f0-9]{64}$/)
    expect(token.hash).not.toContain(token.raw)
    expect(hashAccessToken(token.raw)).toBe(token.hash)
  })
})
