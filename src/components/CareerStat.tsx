import { RefreshCw } from 'lucide-react'
import { Skeleton } from './Skeleton'
import type { CareerStatus } from '../lib/useCareer'

export function CareerStat({
  label,
  status,
  value,
  onRetry,
  skeletonClassName = 'h-7 w-8',
}: {
  label: string
  status: CareerStatus
  value: number | null
  onRetry: () => void
  skeletonClassName?: string
}) {
  return (
    <div className="flex flex-col items-start sm:items-end">
      {status === 'loading' ? (
        <Skeleton className={skeletonClassName} />
      ) : status === 'error' ? (
        <button
          type="button"
          onClick={onRetry}
          aria-label={`Retry ${label}`}
          className="flex h-7 w-8 items-center justify-center rounded border border-line bg-surface-hover text-muted transition-colors duration-150 hover:border-accent/50 hover:text-text"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
        </button>
      ) : (
        <p className="mono-num text-xl font-semibold text-text">{value ?? '—'}</p>
      )}
      <p className="label text-[11px] text-muted/70">{label}</p>
    </div>
  )
}