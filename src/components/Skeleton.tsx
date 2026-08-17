import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'

export function Skeleton({ className = '' }: { className?: string }) {
  return <UiSkeleton aria-hidden="true" className={className} />
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="px-4 py-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-line/60 py-2.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={c === 0 ? 'h-3.5 w-6 shrink-0' : c === 1 ? 'h-3.5 w-28 shrink-0' : 'h-3.5 flex-1'}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function PodiumSkeleton() {
  return (
    <div className="space-y-2 px-4 py-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-6 shrink-0" />
          <div className="flex-1">
            <Skeleton className="mb-1.5 h-3.5 w-28" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <Skeleton className="h-3 w-14 shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function RaceCardSkeleton() {
  return (
    <div className="space-y-3 px-4 py-4" aria-hidden="true">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-56" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-10 w-16" />
      </div>
    </div>
  )
}
