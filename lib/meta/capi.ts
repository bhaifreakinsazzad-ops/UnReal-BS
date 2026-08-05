import 'server-only'
import { createHash } from 'node:crypto'
import { logError } from '@/lib/log-error'
import type { Attribution } from '@/lib/meta/attribution'

type MetaEventName = 'Lead' | 'InitiateCheckout' | 'Purchase'

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('880')) return digits
  if (digits.startsWith('0')) return `88${digits}`
  return digits
}

export async function sendMetaEvent(input: {
  eventName: MetaEventName
  eventId: string
  eventSourceUrl: string
  attribution: Attribution
  email?: string | null
  phone?: string | null
  clientIp?: string | null
  userAgent?: string | null
  valueBdt?: number
  orderId?: string
}): Promise<boolean> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim()
  if (!input.attribution.marketingConsent || !pixelId || !accessToken) return false

  const userData: Record<string, string | string[]> = {}
  if (input.email) userData.em = [sha256(input.email.trim().toLowerCase())]
  if (input.phone) userData.ph = [sha256(normalizePhone(input.phone))]
  if (input.clientIp && input.clientIp !== 'unknown') userData.client_ip_address = input.clientIp
  if (input.userAgent) userData.client_user_agent = input.userAgent.slice(0, 500)
  if (input.attribution.fbclid) {
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
  if (input.valueBdt != null) {
    event.custom_data = {
      currency: 'BDT',
      value: input.valueBdt,
      order_id: input.orderId,
    }
  }

  const version = process.env.META_GRAPH_API_VERSION?.trim() || 'v25.0'
  const url = `https://graph.facebook.com/${version}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`

  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3500)
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: [event], test_event_code: process.env.META_TEST_EVENT_CODE || undefined }),
        signal: controller.signal,
        cache: 'no-store',
      })
      if (response.ok) return true
      if (response.status < 500 && response.status !== 429) break
    } catch (error) {
      if (attempt === 2) await logError('meta-capi', error, { eventName: input.eventName, eventId: input.eventId })
    } finally {
      clearTimeout(timeout)
    }
  }
  await logError('meta-capi', new Error('Meta event delivery failed'), { eventName: input.eventName, eventId: input.eventId })
  return false
}
