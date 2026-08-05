import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { verifyTurnstile } from './turnstile'

const originalEnvironment = { ...process.env }

describe('Turnstile verification', () => {
  beforeEach(() => {
    process.env.TURNSTILE_ENABLED = 'true'
    process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret'
  })

  afterEach(() => {
    process.env = { ...originalEnvironment }
    vi.restoreAllMocks()
  })

  it('fails closed when a token is missing', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    await expect(verifyTurnstile('')).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails closed when Cloudflare rejects or is unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network unavailable'))
    await expect(verifyTurnstile('test-token', '203.0.113.10')).resolves.toBe(false)
  })

  it('accepts only an explicit successful verification', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify({ success: true, action: 'apply', hostname: 'www.unreal-bs.shop' }), { status: 200 })
    )
    await expect(verifyTurnstile('test-token', '203.0.113.10', 'www.unreal-bs.shop')).resolves.toBe(true)
    await expect(verifyTurnstile('test-token', '203.0.113.10', 'evil.example')).resolves.toBe(false)
  })
})
