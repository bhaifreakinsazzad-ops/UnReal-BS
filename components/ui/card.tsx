import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ className, children, hover, padding = 'md' }: CardProps) {
  const paddingClasses = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-100 shadow-sm',
        hover && 'card-hover cursor-pointer',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h3 className={cn('text-base font-semibold text-gray-900', className)}>
      {children}
    </h3>
  )
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('', className)}>{children}</div>
}
