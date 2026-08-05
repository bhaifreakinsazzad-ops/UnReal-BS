'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { captureAttribution, CONSENT_STORAGE_KEY, currentConsentVersion, hasMarketingConsent, trackMetaEvent } from '@/lib/meta/client-events'

function installPixel(pixelId: string) {
  if (window.fbq) return
  type Fbq = ((...args: unknown[]) => void) & {
    callMethod?: (...args: unknown[]) => void
    queue?: unknown[]
    loaded?: boolean
    version?: string
  }
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue?.push(args)
  } as Fbq
  fbq.queue = []
  fbq.loaded = true
  fbq.version = '2.0'
  window.fbq = fbq
  window.fbq('init', pixelId)
  window.dispatchEvent(new Event('unreal-meta-ready'))
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
}

export function MarketingConsent() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const pathname = usePathname()
  const [showChoices, setShowChoices] = useState(false)
  const storedConsent = useSyncExternalStore(
    (onChange) => {
      window.addEventListener('storage', onChange)
      window.addEventListener('unreal-consent-change', onChange)
      return () => {
        window.removeEventListener('storage', onChange)
        window.removeEventListener('unreal-consent-change', onChange)
      }
    },
    () => localStorage.getItem(CONSENT_STORAGE_KEY),
    () => null
  )
  const decided = storedConsent !== null
  const granted = hasMarketingConsent()

  useEffect(() => {
    captureAttribution()
    if (granted && pixelId) {
      installPixel(pixelId)
      trackMetaEvent('PageView')
    }
  }, [granted, pathname, pixelId])

  function choose(next: boolean) {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ granted: next, version: currentConsentVersion(), updatedAt: new Date().toISOString() }))
    window.dispatchEvent(new Event('unreal-consent-change'))
    setShowChoices(false)
    captureAttribution()
    if (!next) {
      for (const name of ['_fbp', '_fbc']) {
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`
      }
    }
  }

  return (
    <>
      {(!decided || showChoices) && (
        <section className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-white/15 bg-slate-950/95 p-4 text-sm text-slate-100 shadow-2xl backdrop-blur" role="dialog" aria-label="Marketing privacy choices">
          <p className="font-semibold">Your privacy choice</p>
          <p className="mt-1 text-slate-300">We use Meta measurement only with your permission. Core site and application submission work without marketing cookies.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950" onClick={() => choose(true)}>Allow marketing measurement</button>
            <button className="rounded-lg border border-white/20 px-4 py-2 font-semibold" onClick={() => choose(false)}>Decline</button>
            <a className="px-2 py-2 underline" href="/privacy">Privacy details</a>
          </div>
        </section>
      )}
      {decided && !showChoices && (
        <button className="fixed bottom-2 left-2 z-[90] rounded-md bg-slate-950/80 px-2 py-1 text-xs text-slate-300 opacity-70 hover:opacity-100 focus:opacity-100" onClick={() => setShowChoices(true)} aria-label="Review privacy choices">
          {granted ? 'Marketing: allowed' : 'Privacy choices'}
        </button>
      )}
    </>
  )
}
