'use client'

import type { Attribution } from '@/lib/meta/attribution'

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string }
  }
}

export const CONSENT_STORAGE_KEY = 'unreal_bs_marketing_consent'
export const ATTRIBUTION_STORAGE_KEY = 'unreal_bs_attribution_v1'

export function currentConsentVersion(): string {
  return process.env.NEXT_PUBLIC_CONSENT_VERSION || '2026-08-05'
}

export function hasMarketingConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) || '{}') as { granted?: boolean; version?: string }
    return stored.granted === true && stored.version === currentConsentVersion()
  } catch {
    return false
  }
}

export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') return { marketingConsent: false }
  const params = new URLSearchParams(window.location.search)
  const fresh: Attribution = {
    utmSource: params.get('utm_source')?.slice(0, 100) || null,
    utmMedium: params.get('utm_medium')?.slice(0, 100) || null,
    utmCampaign: params.get('utm_campaign')?.slice(0, 150) || null,
    utmContent: params.get('utm_content')?.slice(0, 150) || null,
    utmTerm: params.get('utm_term')?.slice(0, 150) || null,
    fbclid: params.get('fbclid')?.slice(0, 500) || null,
    landingPage: window.location.href.slice(0, 1000),
    referrer: document.referrer.slice(0, 1000) || null,
    marketingConsent: hasMarketingConsent(),
    consentVersion: currentConsentVersion(),
  }
  try {
    const previous = JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || '{}') as Attribution
    const merged: Attribution = {
      ...fresh,
      utmSource: fresh.utmSource || previous.utmSource || null,
      utmMedium: fresh.utmMedium || previous.utmMedium || null,
      utmCampaign: fresh.utmCampaign || previous.utmCampaign || null,
      utmContent: fresh.utmContent || previous.utmContent || null,
      utmTerm: fresh.utmTerm || previous.utmTerm || null,
      fbclid: fresh.fbclid || previous.fbclid || null,
      landingPage: previous.landingPage || fresh.landingPage,
      referrer: previous.referrer || fresh.referrer || null,
    }
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(merged))
    return merged
  } catch {
    return fresh
  }
}

export function createMetaEventId(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

export function trackMetaEvent(name: 'PageView' | 'ViewContent' | 'Lead' | 'InitiateCheckout' | 'Purchase', parameters: Record<string, unknown> = {}, eventId?: string): boolean {
  if (!hasMarketingConsent() || !window.fbq) return false
  window.fbq('track', name, parameters, eventId ? { eventID: eventId } : undefined)
  return true
}
