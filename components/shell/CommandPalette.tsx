'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { navItems } from './nav-items'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  locale: 'bn' | 'en'
}

// Lightweight ⌘K route jumper. Not a general command runner — just fast
// keyboard navigation across every module in the sidebar, matching the
// design handoff's search-or-jump-to affordance.
export function CommandPalette({ open, onClose, locale }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return navItems
    return navItems.filter((item) =>
      item.labelEn.toLowerCase().includes(q) || item.labelBn.includes(q)
    )
  }, [query])

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setHighlighted(0)
  }

  const go = (href: string) => {
    router.push(href)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-lg bg-[#12122A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlighted((i) => Math.min(i + 1, results.length - 1))
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlighted((i) => Math.max(i - 1, 0))
          }
          if (e.key === 'Enter' && results[highlighted]) {
            go(results[highlighted].href)
          }
        }}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-white/10">
          <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={locale === 'bn' ? 'খুঁজুন বা যান…' : 'Search or jump to…'}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
          />
          <kbd className="px-1.5 h-5 inline-flex items-center rounded-[5px] border border-white/15 bg-white/[0.06] text-[11px] font-semibold text-white/50">
            Esc
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-1.5">
          {results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-white/40">
              {locale === 'bn' ? 'কিছু পাওয়া যায়নি' : 'No matches'}
            </p>
          )}
          {results.map((item, i) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => go(item.href)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  i === highlighted ? 'bg-[#7C3AED]/20 text-white' : 'text-white/70'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-white/50" />
                <span className="flex-1">{locale === 'bn' ? item.labelBn : item.labelEn}</span>
                {item.comingSoon && (
                  <span className="text-[10px] text-[#00C875] font-semibold uppercase tracking-wide">
                    {locale === 'bn' ? 'শীঘ্রই' : 'Soon'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
