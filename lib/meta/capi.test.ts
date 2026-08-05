import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendMetaEvent } from './capi'

const originalEnvironment = { ...process.env }

describe('Meta Conversions API delivery', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '123456789'
    process.env.META_CAPI_ACCESS_TOKEN = 'server-secret'
    process.env.META_GRAPH_API_VERSION = 'v25.0'
  })

  afterEach(() => {
    process.env = { ...originalEnvironment }
    vi.restoreAllMocks()
  })

  it('does not contact Meta without marketing consent', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const sent = await sendMetaEvent({
      eventName: 'Lead',
      eventId: 'lead_event_123',
      eventSourceUrl: 'https://www.unreal-bs.shop/apply',
      attribution: { marketingConsent: false },
      email: 'buyer@example.com',
    })
    expect(sent).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('retries transient failures with the same event ID for deduplication', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockResolvedValueOnce(new Response('{"events_received":1}', { status: 200 }))

    const sent = await sendMetaEvent({
      eventName: 'Purchase',
      eventId: 'purchase_event_123',
      eventSourceUrl: 'https://www.unreal-bs.shop/checkout/example',
      attribution: { marketingConsent: true, fbclid: 'bounded-click-id' },
      email: ' Buyer@Example.com ',
      phone: '01712345678',
      valueBdt: 50,
      orderId: 'order-123',
    })

    expect(sent).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const bodies = fetchMock.mock.calls.map((call) => JSON.parse(String((call[1] as RequestInit).body)))
    expect(bodies[0].data[0].event_id).toBe('purchase_event_123')
    expect(bodies[1].data[0].event_id).toBe('purchase_event_123')
    expect(bodies[0].data[0].user_data.em[0]).not.toContain('buyer@example.com')
    expect(String(fetchMock.mock.calls[0][0])).toContain('access_token=server-secret')
  })

  it('sends a consented account creation as CompleteRegistration', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{"events_received":1}', { status: 200 }))

    const sent = await sendMetaEvent({
      eventName: 'CompleteRegistration',
      eventId: 'registration_event_123',
      eventSourceUrl: 'https://unreal-bs.shop/signup',
      attribution: { marketingConsent: true, consentVersion: '2026-08-05' },
      email: 'NewUser@Example.com',
    })

    expect(sent).toBe(true)
    const body = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))
    expect(body.data[0].event_name).toBe('CompleteRegistration')
    expect(body.data[0].event_id).toBe('registration_event_123')
    expect(body.data[0].event_source_url).toBe('https://unreal-bs.shop/signup')
    expect(body.data[0].user_data.em[0]).not.toContain('newuser@example.com')
  })
})
