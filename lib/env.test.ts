import { afterEach, describe, expect, it } from 'vitest'
import { validateServerEnvironment } from './env'

const originalEnvironment = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnvironment }
})

describe('Meta environment validation', () => {
  it('allows consent-gated browser Pixel without a CAPI token', () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '1035455475771760'
    delete process.env.META_CAPI_ACCESS_TOKEN

    expect(validateServerEnvironment().issueCodes).not.toContain('meta_incomplete')
  })

  it('rejects a CAPI token without its destination Pixel ID', () => {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID
    process.env.META_CAPI_ACCESS_TOKEN = 'server-secret'

    expect(validateServerEnvironment().issueCodes).toContain('meta_incomplete')
  })
})
