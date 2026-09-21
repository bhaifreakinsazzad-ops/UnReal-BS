'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/shell/Sidebar'
import { TopNav } from '@/components/shell/TopNav'
import { MobileBottomNav } from '@/components/shell/MobileBottomNav'
import { BhaiFreakinFAB } from '@/components/shell/BhaiFreakinFAB'
import { MobileDrawer } from '@/components/shell/MobileDrawer'
import { LocaleProvider } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Deferred to after mount so the client's first render matches the server's (no localStorage on the server).
    const stored = localStorage.getItem('unrealbs-locale') as Locale | null
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === 'bn') setLocale('bn')
  }, [])

  const toggleLocale = () => {
    const next: Locale = locale === 'bn' ? 'en' : 'bn'
    setLocale(next)
    localStorage.setItem('unrealbs-locale', next)
  }

  return (
    <div className="flex h-full min-h-screen bg-[#F5F3FF]">
      {/* Desktop Sidebar */}
      <Sidebar locale={locale} />

      {/* Mobile Drawer */}
      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        locale={locale}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav
          locale={locale}
          onLocaleToggle={toggleLocale}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <LocaleProvider locale={locale}>{children}</LocaleProvider>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav locale={locale} />

      {/* UnReal AI FAB */}
      <BhaiFreakinFAB />
    </div>
  )
}
