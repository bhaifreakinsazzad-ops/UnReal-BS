const SENSITIVE_KEY = /(?:authorization|cookie|token|secret|password|email|phone|msisdn|payer[_-]?reference|payment[_-]?reference|provider[_-]?payload)/i
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const PHONE = /(?:\+?88)?01[3-9]\d{8}/g
const BEARER = /\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi

function redactString(value: string): string {
  return value.replace(EMAIL, '[REDACTED_EMAIL]').replace(PHONE, '[REDACTED_PHONE]').replace(BEARER, 'Bearer [REDACTED]')
}

export function redactSensitive(value: unknown, depth = 0): unknown {
  if (depth > 5) return '[REDACTED_DEPTH]'
  if (typeof value === 'string') return redactString(value).slice(0, 4000)
  if (value == null || typeof value !== 'object') return value
  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message), stack: redactString(value.stack ?? '').slice(0, 8000) }
  }
  if (Array.isArray(value)) return value.slice(0, 100).map((entry) => redactSensitive(entry, depth + 1))

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      SENSITIVE_KEY.test(key) ? '[REDACTED]' : redactSensitive(entry, depth + 1),
    ])
  )
}
