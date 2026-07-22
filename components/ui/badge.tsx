import { cn } from '@/lib/utils'

type BadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'gray' | 'outline'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-[#EDE9FE] text-[#7C3AED]',
  accent: 'bg-[#D1FAE5] text-[#059669]',
  success: 'bg-[#D1FAE5] text-[#059669]',
  warning: 'bg-[#FEF3C7] text-[#D97706]',
  danger: 'bg-[#FEE2E2] text-[#DC2626]',
  gray: 'bg-gray-100 text-gray-600',
  outline: 'bg-white border border-gray-300 text-gray-600',
}

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-[#7C3AED]',
  accent: 'bg-[#059669]',
  success: 'bg-[#059669]',
  warning: 'bg-[#D97706]',
  danger: 'bg-[#DC2626]',
  gray: 'bg-gray-400',
  outline: 'bg-gray-400',
}

export function Badge({ variant = 'gray', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold',
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}

export function StatusBadge({ status, locale = 'bn' }: { status: 'active' | 'paused' | 'draft' | 'coming_soon', locale?: 'bn' | 'en' }) {
  const labels = {
    active: { bn: 'সক্রিয়', en: 'Active', variant: 'accent' as BadgeVariant },
    paused: { bn: 'বিরতি', en: 'Paused', variant: 'warning' as BadgeVariant },
    draft: { bn: 'ড্রাফট', en: 'Draft', variant: 'gray' as BadgeVariant },
    coming_soon: { bn: 'শীঘ্রই', en: 'Soon', variant: 'primary' as BadgeVariant },
  }

  const { bn, en, variant } = labels[status]
  return (
    <Badge variant={variant} dot>
      {locale === 'bn' ? bn : en}
    </Badge>
  )
}
