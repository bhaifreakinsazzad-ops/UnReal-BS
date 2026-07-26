'use client'

import { Bell, Globe, Search, ChevronDown, Menu, Gift } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()

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

      {/* Route label + GHL sync badge (desktop) */}
      <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
        <span className="text-sm font-bold text-white">{routeLabel}</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold bg-[#00C875]/[0.14] text-[#34D399]">
          <span className="w-[5px] h-[5px] rounded-full bg-[#00C875] pulse-dot" />
          {locale === 'bn' ? 'GHL সিঙ্ক' : 'GHL synced'}
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
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#7C3AED] rounded-full pulse-dot" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {locale === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
                </h3>
                <span className="text-xs text-[#7C3AED] font-medium cursor-pointer hover:underline">
                  {locale === 'bn' ? 'সব পড়া হয়েছে' : 'Mark all read'}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {mockNotifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <p className="text-sm text-gray-800">{locale === 'bn' ? n.textBn : n.textEn}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{locale === 'bn' ? n.timeBn : n.timeEn}</p>
                  </div>
                ))}
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
              UB
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white leading-none">
                {locale === 'bn' ? 'বিজনেস অপারেটর' : 'Business Operator'}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                {locale === 'bn' ? 'অ্যাডমিন' : 'Admin'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-white/40 hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden py-1">
              <a href="/settings/profile" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                {locale === 'bn' ? 'প্রোফাইল' : 'Profile'}
              </a>
              <a href="/settings" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                {locale === 'bn' ? 'সেটিংস' : 'Settings'}
              </a>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  {locale === 'bn' ? 'লগআউট' : 'Logout'}
                </button>
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

const mockNotifications = [
  { id: 1, textBn: 'নতুন লিড যোগ হয়েছে — আরিফুল ইসলাম', textEn: 'New lead added - Ariful Islam', timeBn: '২ মিনিট আগে', timeEn: '2 min ago' },
  { id: 2, textBn: 'ওয়ার্কফ্লো সফলভাবে চলেছে', textEn: 'Workflow ran successfully', timeBn: '১ ঘণ্টা আগে', timeEn: '1 hour ago' },
  { id: 3, textBn: '৩টি নতুন মেসেজ এসেছে', textEn: '3 new messages received', timeBn: 'আজ সকাল ১০টা', timeEn: 'Today 10 AM' },
]
