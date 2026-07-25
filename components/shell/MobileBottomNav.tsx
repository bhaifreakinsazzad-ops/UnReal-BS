'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Users, HandCoins, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  locale?: 'bn' | 'en'
}

const primaryItems = [
  { href: '/', labelBn: 'Control', labelEn: 'Control', icon: LayoutDashboard },
  { href: '/opportunities', labelBn: 'Opps', labelEn: 'Opps', icon: HandCoins, badge: true },
  { href: '/credit-center', labelBn: 'Credit', labelEn: 'Credit', icon: BookOpen },
  { href: '/conversations', labelBn: 'Inbox', labelEn: 'Inbox', icon: MessageSquare },
  { href: '/contacts', labelBn: 'Customers', labelEn: 'Customers', icon: Users },
]

export function MobileBottomNav({ locale = 'en' }: MobileBottomNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-40 safe-area-pb">
      <div className="flex items-center justify-around h-full px-2">
        {primaryItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 flex-1 py-2 rounded-lg transition-colors relative',
                active ? 'text-[#7C3AED]' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', active && 'text-[#7C3AED]')} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-[#7C3AED] rounded-full pulse-dot" />
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">
                {locale === 'bn' ? item.labelBn : item.labelEn}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#7C3AED] rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
