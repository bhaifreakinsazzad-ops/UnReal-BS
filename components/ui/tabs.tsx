'use client'

import { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  active: string
  setActive: (value: string) => void
}

const TabsContext = createContext<TabsContextValue>({ active: '', setActive: () => {} })

interface TabsProps {
  defaultValue: string
  children: React.ReactNode
  className?: string
  onChange?: (value: string) => void
}

export function Tabs({ defaultValue, children, className, onChange }: TabsProps) {
  const [active, setActiveInternal] = useState(defaultValue)

  const setActive = (value: string) => {
    setActiveInternal(value)
    onChange?.(value)
  }

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn('', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
  variant?: 'underline' | 'pill'
}

export function TabsList({ children, className, variant = 'underline' }: TabsListProps) {
  return (
    <div
      className={cn(
        'flex',
        variant === 'underline' && 'border-b border-gray-200 gap-1',
        variant === 'pill' && 'bg-gray-100 p-1 rounded-xl gap-1',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  variant?: 'underline' | 'pill'
  badge?: string
}

export function TabsTrigger({ value, children, className, variant = 'underline', badge }: TabsTriggerProps) {
  const { active, setActive } = useContext(TabsContext)
  const isActive = active === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActive(value)}
      className={cn(
        'flex items-center gap-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none',
        variant === 'underline' && [
          'px-3 py-2.5 border-b-2 -mb-px',
          isActive
            ? 'border-[#7C3AED] text-[#7C3AED]'
            : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
        ],
        variant === 'pill' && [
          'px-4 py-2 rounded-lg',
          isActive
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
        ],
        className
      )}
    >
      {children}
      {badge && (
        <span className={cn(
          'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
          isActive ? 'bg-[#7C3AED] text-white' : 'bg-gray-200 text-gray-600'
        )}>
          {badge}
        </span>
      )}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { active } = useContext(TabsContext)
  if (active !== value) return null
  return <div className={cn('', className)}>{children}</div>
}
