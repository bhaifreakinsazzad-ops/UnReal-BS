'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { X, Settings } from 'lucide-react'
import { navItems } from './nav-items'
import { cn } from '@/lib/utils'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  locale?: 'bn' | 'en'
}

export function MobileDrawer({ open, onClose, locale = 'en' }: MobileDrawerProps) {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          'md:hidden fixed top-0 left-0 bottom-0 w-72 bg-[#0D0D1A] z-50 flex flex-col transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="UnReal BS" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-bold text-white text-lg tracking-tight">
              UnReal <span className="text-[#7C3AED]">BS</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative',
                  active
                    ? 'bg-[#7C3AED]/15 text-[#A78BFA]'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#7C3AED] rounded-r-full" />
                )}
                <Icon className={cn('w-5 h-5', active ? 'text-[#7C3AED]' : 'text-white/50')} />
                <span className="text-sm font-medium flex-1">
                  {locale === 'bn' ? item.labelBn : item.labelEn}
                </span>
                {item.badge && (
                  <span className="bg-[#7C3AED] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {item.comingSoon && (
                  <span className="text-[10px] text-[#00C875] font-semibold uppercase tracking-wide">
                    {locale === 'bn' ? 'শীঘ্রই' : 'Soon'}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-white/5">
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">
              {locale === 'bn' ? 'সেটিংস' : 'Settings'}
            </span>
          </Link>
        </div>
      </div>
    </>
  )
}
