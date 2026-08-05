import { describe, expect, it } from 'vitest'
import { redactSensitive } from './redaction'

describe('log redaction', () => {
  it('removes direct and nested PII and credentials', () => {
    const output = JSON.stringify(redactSensitive({
      email: 'person@example.com',
      nested: { note: 'Call +8801712345678 with Bearer abc.def.ghi', paymentReference: 'ABC123' },
    }))
    expect(output).not.toContain('person@example.com')
    expect(output).not.toContain('01712345678')
    expect(output).not.toContain('abc.def.ghi')
    expect(output).not.toContain('ABC123')
  })
})
