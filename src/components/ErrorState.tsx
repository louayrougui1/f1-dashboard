import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ErrorState({
  message = 'Unable to retrieve Formula 1 data.',
  detail,
  onRetry,
  compact = false,
}: {
  message?: string
  detail?: string
  onRetry: () => void
  compact?: boolean
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 px-4 py-6 text-center ${compact ? 'min-h-0' : 'min-h-[12rem]'}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-error/30 bg-error/10">
        <AlertTriangle className="h-5 w-5 text-error" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[11px] font-semibold tracking-[0.18em] text-error uppercase">
          Data Connection Error
        </p>
        <p className="mt-1 text-sm text-text/80">{message}</p>
        {detail ? <p className="mt-0.5 text-xs text-muted">{detail}</p> : null}
      </div>
      <Button variant="outline" onClick={onRetry} className="h-8 gap-2 border-line bg-surface-hover px-3.5 text-text hover:border-accent hover:bg-surface-hover hover:text-text">
        <RefreshCw className="size-3.5" aria-hidden="true" />
        Retry
      </Button>
    </div>
  )
}
