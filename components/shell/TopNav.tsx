'use client'

import { Bell, Globe, Search, ChevronDown, Menu, Gift } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { signOutAction } from '@/app/actions/auth'
import { navItems } from './nav-items'
import { CommandPalette } from './CommandPalette'

interface TopNavProps {
  locale: 'bn' | 'en'
  onLocaleToggle: () => void
  onMenuToggle?: () => void
  pageTitle?: string
}

export function TopNav({ locale, onLocaleToggle, onMenuToggle, pageTitle }: TopNavProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteKey, setPaletteKey] = useState(0)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const pathname = usePathname()

  // Read the real signed-in identity rather than showing a hardcoded
  // "Business Operator / Admin" to every account — users need to be able to
  // confirm which account they are in before revealing card credentials.
  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((s) => {
        if (!cancelled && s?.user?.email) setUserEmail(s.user.email)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'UB'

  const openPalette = () => {
    setPaletteKey((k) => k + 1)
    setPaletteOpen(true)
  }

  const activeItem =
    navItems.find((item) => (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href))) ?? null
  const routeLabel = pageTitle ?? (activeItem ? (locale === 'bn' ? activeItem.labelBn : activeItem.labelEn) : '')

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openPalette()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header className="h-16 bg-[#0B0A1C] border-b border-white/[0.07] flex items-center gap-3 px-4 flex-shrink-0 z-10">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title (mobile only) */}
      {routeLabel && (
        <h1 className="md:hidden text-base font-semibold text-white flex-1 truncate">{routeLabel}</h1>
      )}

      {/* Route label + attribution badge (desktop) */}
      <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
        <span className="text-sm font-bold text-white">{routeLabel}</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold bg-white/[0.06] text-white/45">
          {locale === 'bn' ? 'HighLevel দ্বারা চালিত' : 'Powered by HighLevel'}
        </span>
      </div>

      {/* Command palette trigger (desktop) */}
      <button
        onClick={openPalette}
        className="hidden md:flex items-center gap-2.5 flex-1 max-w-[360px] mx-auto h-[38px] px-3 rounded-[10px] border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-[#7C3AED]/45 transition-colors"
      >
        <Search className="w-[15px] h-[15px] text-white/40 flex-shrink-0" />
        <span className="flex-1 text-left text-[13.5px] text-white/40">
          {locale === 'bn' ? 'খুঁজুন বা যান…' : 'Search or jump to…'}
        </span>
        <kbd className="hidden lg:inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-[5px] border border-white/[0.16] bg-white/[0.07] text-[11px] font-semibold text-white/65">
          ⌘
        </kbd>
        <kbd className="hidden lg:inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-[5px] border border-white/[0.16] bg-white/[0.07] text-[11px] font-semibold text-white/65">
          K
        </kbd>
      </button>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={openPalette}
          className="md:hidden flex items-center justify-center p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={locale === 'bn' ? 'খুঁজুন' : 'Search'}
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          className="hidden sm:flex items-center justify-center p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={locale === 'bn' ? 'নতুন আপডেট' : 'Product updates'}
        >
          <Gift className="w-5 h-5" />
        </button>

        {/* Language Toggle */}
        <button
          onClick={onLocaleToggle}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
          aria-label="Toggle language"
        >
          <Globe className="w-4 h-4" />
          <span className={locale === 'en' ? 'text-[#A78BFA] font-bold' : ''}>EN</span>
          <span className="text-white/20">/</span>
          <span className={locale === 'bn' ? 'text-[#A78BFA] font-bold' : ''}>বাংলা</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {/* Unread dot removed: it was unconditional, so every user was
                permanently told they had unread notifications. It comes back
                when there is a real unread count to drive it. */}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">
                  {locale === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
                </h3>
              </div>
              {/* No notification backend exists yet. This previously listed
                  fabricated events (a lead named "Ariful Islam", a workflow
                  that "ran successfully") on every page in the app. */}
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {locale === 'bn' ? 'এখনো কোনো নোটিফিকেশন নেই' : 'No notifications yet'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar / Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
            <div className="hidden md:block text-left max-w-[160px]">
              <p className="text-sm font-medium text-white leading-none truncate">
                {userEmail ?? (locale === 'bn' ? 'সাইন ইন করা আছে' : 'Signed in')}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                {locale === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-white/40 hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden py-1">
              {/* /settings/profile does not exist — linking to it 404'd. */}
              <a href="/settings" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                {locale === 'bn' ? 'সেটিংস' : 'Settings'}
              </a>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <form action={signOutAction}>
                  <button type="submit" className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    {locale === 'bn' ? 'লগআউট' : 'Logout'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for dropdowns */}
      {(notificationsOpen || profileOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setNotificationsOpen(false)
            setProfileOpen(false)
          }}
        />
      )}

      <CommandPalette key={paletteKey} open={paletteOpen} onClose={() => setPaletteOpen(false)} locale={locale} />
    </header>
  )
}

