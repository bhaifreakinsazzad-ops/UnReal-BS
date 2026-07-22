import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton rounded-lg', className)} />
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-50">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-50">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === 0 ? 'w-32' : 'w-20 flex-1')} />
      ))}
    </div>
  )
}
