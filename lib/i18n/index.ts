'use client'

import bn from './bn.json'
import en from './en.json'

export type Locale = 'bn' | 'en'
export type TranslationKeys = typeof bn

const translations: Record<Locale, TranslationKeys> = { bn, en }

export function getTranslations(locale: Locale = 'bn'): TranslationKeys {
  return translations[locale] ?? translations.bn
}

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'bn'
  const stored = localStorage.getItem('unrealbs-locale') as Locale | null
  return stored === 'en' ? 'en' : 'bn'
}

export function setLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('unrealbs-locale', locale)
  window.location.reload()
}

export function formatNumber(n: number, locale: Locale): string {
  return locale === 'en' ? String(n) : n.toLocaleString('bn-BD')
}

export function formatDate(dateStr: string, locale: Locale): string {
  return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-GB' : 'bn-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
