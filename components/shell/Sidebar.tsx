'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { navItems } from './nav-items'
import { cn } from '@/lib/utils'

interface SidebarProps {
  locale?: 'bn' | 'en'
}

export function Sidebar({ locale = 'en' }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full transition-all duration-250 ease-in-out flex-shrink-0',
        'bg-[#0D0D1A] border-r border-white/5',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-white/5 flex-shrink-0',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <LogoIcon />
            <span className="font-bold text-white text-lg tracking-tight">
              UnReal <span className="text-[#7C3AED]">BS</span>
            </span>
          </div>
        )}
        {collapsed && <LogoIcon />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors',
            collapsed && 'mt-0'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                active
                  ? 'bg-[#7C3AED]/15 text-[#A78BFA]'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/5'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#7C3AED] rounded-r-full" />
              )}
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0',
                  active ? 'text-[#7C3AED]' : 'text-white/50 group-hover:text-white/80'
                )}
              />
              {!collapsed && (
                <span className="flex-1 text-sm font-medium leading-none">
                  {locale === 'bn' ? item.labelBn : item.labelEn}
                </span>
              )}
              {!collapsed && item.badge && (
                <span className="bg-[#7C3AED] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
              {!collapsed && item.comingSoon && (
                <span className="text-[10px] text-[#00C875] font-semibold uppercase tracking-wide">
                  {locale === 'bn' ? 'শীঘ্রই' : 'Soon'}
                </span>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#7C3AED] rounded-full" />
              )}
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg border border-white/10">
                  {locale === 'bn' ? item.labelBn : item.labelEn}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-white/5 space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">
              {locale === 'bn' ? 'সেটিংস' : 'Settings'}
            </span>
          )}
        </Link>
      </div>
    </aside>
  )
}

function LogoIcon() {
  return (
    <Image
      src="/logo.png"
      alt="UnReal BS"
      width={32}
      height={32}
      className="flex-shrink-0 rounded-lg"
      priority
    />
  )
}
