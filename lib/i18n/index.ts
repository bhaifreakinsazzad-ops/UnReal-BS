'use client'

import bn from './bn.json'
import en from './en.json'

export type Locale = 'bn' | 'en'
export type TranslationKeys = typeof bn

const translations: Record<Locale, TranslationKeys> = { bn, en }

export function getTranslations(locale: Locale = 'en'): TranslationKeys {
  return translations[locale] ?? translations.en
}

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem('unrealbs-locale') as Locale | null
  return stored === 'bn' ? 'bn' : 'en'
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
  return new Date(dateStr).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
