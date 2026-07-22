'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  side?: 'left' | 'right'
  width?: string
}

export function Sheet({ open, onClose, title, children, side = 'right', width = 'w-96' }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 bottom-0 z-50 bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out',
          width,
          side === 'right' ? 'right-0' : 'left-0',
          open
            ? 'translate-x-0'
            : side === 'right'
            ? 'translate-x-full'
            : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  )
}
