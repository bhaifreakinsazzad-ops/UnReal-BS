'use client'

import { createContext, useContext, useState } from 'react'
import Link from 'next/link'

// The storefront is seen by people who are NOT users of this platform — they
// clicked a link a shop owner posted on Facebook. They have no account, no
// settings, and no language toggle in a sidebar, so the storefront carries its
// own.
//
// Bangla is the default here, unlike the dashboard which defaults to English.
// The dashboard's audience is the business owner; the storefront's audience is
// their customer, and for a Bangladeshi shop that customer reads Bangla first.

type StoreLocale = 'bn' | 'en'

const StoreLocaleContext = createContext<StoreLocale>('bn')

export function useStoreLocale() {
  return useContext(StoreLocaleContext)
}

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<StoreLocale>('bn')

  return (
    <StoreLocaleContext.Provider value={locale}>
      <div className="min-h-full bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-sm font-bold text-gray-900 tracking-tight">
              UnReal <span className="text-[#7C3AED]">BS</span>
            </Link>
            <button
              type="button"
              onClick={() => setLocale((l) => (l === 'bn' ? 'en' : 'bn'))}
              className="text-xs font-semibold text-gray-500 hover:text-[#7C3AED] border border-gray-200 rounded-full px-3 py-1"
            >
              {locale === 'bn' ? 'English' : 'বাংলা'}
            </button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10">{children}</main>

        <footer className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-xs text-gray-400">
            {locale === 'bn'
              ? 'UnReal BS দিয়ে বিক্রি হচ্ছে'
              : 'Sold through UnReal BS'}
          </p>
        </footer>
      </div>
    </StoreLocaleContext.Provider>
  )
}
