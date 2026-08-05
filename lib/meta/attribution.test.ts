import { describe, expect, it } from 'vitest'
import { attributionSchema } from './attribution'

describe('Meta attribution input', () => {
  it('accepts bounded consent and event fields', () => {
    expect(attributionSchema.parse({ marketingConsent: true, consentVersion: 'v1', eventId: 'event_123456' })).toMatchObject({ marketingConsent: true })
  })

  it('rejects unbounded or malformed values', () => {
    expect(attributionSchema.safeParse({ marketingConsent: true, fbclid: 'x'.repeat(501) }).success).toBe(false)
    expect(attributionSchema.safeParse({ marketingConsent: true, eventId: '<script>' }).success).toBe(false)
  })
})
