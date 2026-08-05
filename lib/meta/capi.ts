import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import { logError } from '@/lib/log-error'
import type { Attribution } from '@/lib/meta/attribution'

type MetaEventName = 'Lead' | 'CompleteRegistration' | 'InitiateCheckout' | 'Purchase'

type MetaApiAcknowledgement = {
  ok: boolean
  status: number
  eventsReceived: number
  traceId: string | null
  errorCode: number | null
  errorMessage: string | null
}

export type MetaDatasetValidation = MetaApiAcknowledgement & {
  configured: boolean
  eventId: string | null
  destination: string | null
  missing: Array<'access_token' | 'dataset_id' | 'test_event_code'>
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('880')) return digits
  if (digits.startsWith('0')) return `88${digits}`
  return digits
}

function datasetId(): string | null {
  return process.env.META_DATASET_ID?.trim() || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null
}

function graphUrl(destination: string, accessToken: string): string {
  const version = process.env.META_GRAPH_API_VERSION?.trim() || 'v25.0'
  return `https://graph.facebook.com/${version}/${encodeURIComponent(destination)}/events?access_token=${encodeURIComponent(accessToken)}`
}

function parseAcknowledgement(status: number, body: unknown): MetaApiAcknowledgement {
  const value = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const error = value.error && typeof value.error === 'object' ? value.error as Record<string, unknown> : {}
  const eventsReceived = typeof value.events_received === 'number' ? value.events_received : 0
  return {
    ok: status >= 200 && status < 300 && eventsReceived > 0,
    status,
    eventsReceived,
    traceId: typeof value.fbtrace_id === 'string' ? value.fbtrace_id.slice(0, 200) : null,
    errorCode: typeof error.code === 'number' ? error.code : null,
    errorMessage: typeof error.message === 'string' ? error.message.slice(0, 500) : null,
  }
}

async function executeEventRequest(input: {
  destination: string
  accessToken: string
  event: Record<string, unknown>
  testEventCode?: string
  attempts: number
}): Promise<MetaApiAcknowledgement> {
  let last: MetaApiAcknowledgement = {
    ok: false,
    status: 0,
    eventsReceived: 0,
    traceId: null,
    errorCode: null,
    errorMessage: 'Meta did not acknowledge the request.',
  }

  for (let attempt = 1; attempt <= input.attempts; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3500)
    try {
      const response = await fetch(graphUrl(input.destination, input.accessToken), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          data: [input.event],
          ...(input.testEventCode ? { test_event_code: input.testEventCode } : {}),
        }),
        signal: controller.signal,
        cache: 'no-store',
      })
      const body = await response.json().catch(() => null)
      last = parseAcknowledgement(response.status, body)
      if (last.ok) return last
      if (response.status < 500 && response.status !== 429) return last
    } catch (error) {
      last = {
        ...last,
        errorMessage: error instanceof Error && error.name === 'AbortError'
          ? 'Meta request timed out.'
          : 'Meta request failed.',
      }
    } finally {
      clearTimeout(timeout)
    }
  }
  return last
}

export async function sendMetaEvent(input: {
  eventName: MetaEventName
  eventId: string
  eventSourceUrl: string
  attribution: Attribution
  email?: string | null
  phone?: string | null
  externalId?: string | null
  clientIp?: string | null
  userAgent?: string | null
  valueBdt?: number
  orderId?: string
}): Promise<boolean> {
  const destination = datasetId()
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim()
  if (!input.attribution.marketingConsent || !destination || !accessToken) return false

  const userData: Record<string, string | string[]> = {}
  if (input.email) userData.em = [sha256(input.email.trim().toLowerCase())]
  if (input.phone) userData.ph = [sha256(normalizePhone(input.phone))]
  if (input.externalId) userData.external_id = [sha256(input.externalId.trim().toLowerCase())]
  if (input.clientIp && input.clientIp !== 'unknown') userData.client_ip_address = input.clientIp
  if (input.userAgent) userData.client_user_agent = input.userAgent.slice(0, 500)
  if (input.attribution.fbp) userData.fbp = input.attribution.fbp.slice(0, 500)
  if (input.attribution.fbc) {
    userData.fbc = input.attribution.fbc.slice(0, 500)
  } else if (input.attribution.fbclid) {
    userData.fbc = input.attribution.fbclid.startsWith('fb.')
      ? input.attribution.fbclid
      : `fb.1.${Date.now()}.${input.attribution.fbclid}`
  }

  const event: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: 'website',
    event_source_url: input.eventSourceUrl.slice(0, 1000),
    user_data: userData,
  }
  if (input.valueBdt != null && Number.isFinite(input.valueBdt) && input.valueBdt >= 0) {
    event.custom_data = {
      currency: 'BDT',
      value: input.valueBdt,
      ...(input.orderId ? { order_id: input.orderId } : {}),
    }
  }

  // Normal delivery must never inherit META_TEST_EVENT_CODE. Leaving a test
  // code on production events silently diverts real conversions into Meta's
  // Test Events view. Validation has a separate, admin-only path below.
  const result = await executeEventRequest({ destination, accessToken, event, attempts: 2 })
  if (result.ok) return true
  await logError('meta-capi', new Error(result.errorMessage || 'Meta event delivery failed'), {
    eventName: input.eventName,
    eventId: input.eventId,
    status: result.status,
    errorCode: result.errorCode,
    traceId: result.traceId,
  })
  return false
}

/**
 * Sends a synthetic event to Meta Test Events only. It never uses customer
 * data and cannot affect campaign reporting because a test code is mandatory.
 */
export async function validateMetaDatasetConnection(): Promise<MetaDatasetValidation> {
  const destination = datasetId()
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim() || null
  const testEventCode = process.env.META_TEST_EVENT_CODE?.trim() || null
  const missing: MetaDatasetValidation['missing'] = []
  if (!accessToken) missing.push('access_token')
  if (!destination) missing.push('dataset_id')
  if (!testEventCode) missing.push('test_event_code')
  if (!accessToken || !destination || !testEventCode) {
    return {
      configured: false,
      eventId: null,
      destination,
      missing,
      ok: false,
      status: 0,
      eventsReceived: 0,
      traceId: null,
      errorCode: null,
      errorMessage: null,
    }
  }

  const eventId = `dataset_test_${randomUUID().replace(/-/g, '')}`
  const event = {
    event_name: 'CompleteRegistration',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: 'website',
    event_source_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.unreal-bs.shop'}/signup`,
    user_data: {
      em: [sha256('meta-dataset-validation@unreal-bs.shop')],
      external_id: [sha256('unreal-bs-meta-dataset-validation')],
    },
  }
  const result = await executeEventRequest({
    destination,
    accessToken,
    event,
    testEventCode,
    attempts: 2,
  })
  return { configured: true, eventId, destination, missing, ...result }
}
