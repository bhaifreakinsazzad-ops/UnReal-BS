'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#7C3AED] text-white hover:bg-[#6D28D9] active:bg-[#5B21B6] shadow-sm',
  secondary: 'bg-[#EDE9FE] text-[#7C3AED] hover:bg-[#DDD6FE] active:bg-[#C4B5FD]',
  ghost: 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200',
  danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C] shadow-sm',
  accent: 'bg-[#00C875] text-white hover:bg-[#00A85F] active:bg-[#009A5B] shadow-sm',
  outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
  icon: 'h-9 w-9',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/50 disabled:opacity-50 disabled:cursor-not-allowed select-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'
