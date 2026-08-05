import { z } from 'zod'

const bounded = (max: number) => z.string().trim().max(max).optional().nullable()

export const attributionSchema = z.object({
  utmSource: bounded(100),
  utmMedium: bounded(100),
  utmCampaign: bounded(150),
  utmContent: bounded(150),
  utmTerm: bounded(150),
  fbclid: bounded(500),
  fbc: bounded(500),
  fbp: bounded(500),
  landingPage: bounded(1000),
  referrer: bounded(1000),
  eventId: z.string().trim().min(8).max(100).regex(/^[A-Za-z0-9_-]+$/).optional().nullable(),
  marketingConsent: z.boolean().default(false),
  consentVersion: bounded(40),
})

export type Attribution = z.infer<typeof attributionSchema>

export function attributionColumns(value: Attribution) {
  return {
    utm_source: value.utmSource || null,
    utm_medium: value.utmMedium || null,
    utm_campaign: value.utmCampaign || null,
    utm_content: value.utmContent || null,
    utm_term: value.utmTerm || null,
    fbclid: value.fbclid || null,
    landing_page: value.landingPage || null,
    referrer: value.referrer || null,
    meta_event_id: value.eventId || null,
    marketing_consent: value.marketingConsent,
    consent_version: value.consentVersion || null,
  }
}
