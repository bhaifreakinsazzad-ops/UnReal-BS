import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: vi.fn(),
  isSupabaseConfigured: () => false,
}))

import { checkRateLimit } from './rate-limit'

describe('rate-limit failure policy', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('fails closed in production when the limiter is unavailable', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    await expect(checkRateLimit('login-ip', 'opaque', {
      max: 1,
      windowSeconds: 60,
      failClosed: true,
    })).resolves.toEqual({ allowed: false })
  })

  it('allows local development without a configured database', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    await expect(checkRateLimit('login-ip', 'opaque', {
      max: 1,
      windowSeconds: 60,
      failClosed: true,
    })).resolves.toEqual({ allowed: true })
  })
})
