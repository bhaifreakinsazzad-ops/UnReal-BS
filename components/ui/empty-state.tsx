import { cn } from '@/lib/utils'
import { Button } from './button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#EDE9FE] flex items-center justify-center mb-4 text-[#7C3AED]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          <Button onClick={action.onClick} size="md">
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}
