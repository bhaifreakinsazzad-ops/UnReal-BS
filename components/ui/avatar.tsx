import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

interface AvatarProps {
  name?: string
  src?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  online?: boolean
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-14 h-14 text-lg',
}

const onlineDotClasses = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
  xl: 'w-3 h-3',
}

export function Avatar({ name, src, size = 'md', className, online }: AvatarProps) {
  return (
    <div className={cn('relative flex-shrink-0', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary CRM avatar origins are intentionally passed through unchanged.
        <img
          src={src}
          alt={name ?? 'Avatar'}
          className={cn('rounded-full object-cover', sizeClasses[size])}
        />
      ) : (
        <div
          className={cn(
            'rounded-full gradient-primary flex items-center justify-center text-white font-semibold',
            sizeClasses[size]
          )}
        >
          {name ? getInitials(name) : '?'}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            onlineDotClasses[size],
            online ? 'bg-[#00C875]' : 'bg-gray-400'
          )}
        />
      )}
    </div>
  )
}
