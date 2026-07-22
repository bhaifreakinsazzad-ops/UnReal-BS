'use client'

import { Bell, Globe, Search, ChevronDown, Menu } from 'lucide-react'
import { useState } from 'react'

interface TopNavProps {
  locale: 'bn' | 'en'
  onLocaleToggle: () => void
  onMenuToggle?: () => void
  pageTitle?: string
}

export function TopNav({ locale, onLocaleToggle, onMenuToggle, pageTitle }: TopNavProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0 z-10">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title (mobile only) */}
      {pageTitle && (
        <h1 className="md:hidden text-base font-semibold text-gray-900 flex-1">
          {pageTitle}
        </h1>
      )}

      {/* Search (desktop) */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={locale === 'bn' ? 'খুঁজুন...' : 'Search...'}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Language Toggle */}
        <button
          onClick={onLocaleToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-200"
          aria-label="Toggle language"
        >
          <Globe className="w-4 h-4" />
          <span>{locale === 'bn' ? 'বাং' : 'EN'}</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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
                    <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
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
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
              ব
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-none">
                {locale === 'bn' ? 'আপনার নাম' : 'Your Name'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {locale === 'bn' ? 'অ্যাডমিন' : 'Admin'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
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
    </header>
  )
}

const mockNotifications = [
  { id: 1, textBn: 'নতুন লিড যোগ হয়েছে — আরিফুল ইসলাম', textEn: 'New lead added — Ariful Islam', time: '২ মিনিট আগে' },
  { id: 2, textBn: 'ওয়ার্কফ্লো সফলভাবে চলেছে', textEn: 'Workflow ran successfully', time: '১ ঘণ্টা আগে' },
  { id: 3, textBn: '৩টি নতুন মেসেজ এসেছে', textEn: '3 new messages received', time: 'আজ সকাল ১০টা' },
]
