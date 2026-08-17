import type { Race } from '../lib/types'
import { display, formatDateShort, roundLabel } from '../lib/format'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { ErrorState } from './ErrorState'
import { RaceCardSkeleton } from './Skeleton'

function SeasonTimeline({
  calendar,
  lastRound,
  nextRound,
  selectedRound,
  onSelectRound,
}: {
  calendar: Race[]
  lastRound: number | null
  nextRound: number | null
  selectedRound: number | null
  onSelectRound: (round: number) => void
}) {
  return (
    <Card className="rounded-lg p-0 gap-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line bg-bg-secondary/50 px-5 py-2.5">
        <p className="label text-text">Season Calendar</p>
        <p className="label text-[9px] text-muted/70">
          {roundLabel(calendar[0]?.round ?? null)} – {roundLabel(calendar[calendar.length - 1]?.round ?? null)}
        </p>
      </div>
      <div className="px-5 py-5">
        <div className="relative overflow-x-auto pb-1">
          <ol className="flex min-w-[46rem] justify-between lg:min-w-0" aria-label="Season race calendar">
            {calendar.map((race, idx) => {
              const isPast = lastRound !== null && race.round <= lastRound
              const isNext = nextRound !== null && race.round === nextRound
              const isSelected = selectedRound !== null && race.round === selectedRound
              const isFirst = idx === 0
              const isLast = idx === calendar.length - 1
              const connector = isSelected || isNext ? 'bg-accent' : isPast ? 'bg-accent/30' : 'bg-line-strong'
              const dot = isSelected
                ? 'border-accent bg-accent ring-2 ring-accent/50 ring-offset-2 ring-offset-surface'
                : isNext
                  ? 'border-accent bg-accent'
                  : isPast
                    ? 'border-accent/40 bg-accent/25'
                    : 'border-line bg-bg-secondary'
              const numCls = isSelected || isNext ? 'text-accent' : isPast ? 'text-text/80' : 'text-muted'
              return (
                <li key={race.round} className="flex min-w-0 flex-1 flex-col items-center">
                  <button
                    type="button"
                    onClick={() => onSelectRound(race.round)}
                    aria-pressed={isSelected}
                    aria-label={`Round ${race.round}: ${display(race.raceName)} ${isSelected ? '(selected)' : isNext ? '(next)' : isPast ? '(completed)' : ''}`}
                    title={display(race.raceName)}
                    className="flex min-w-0 flex-col items-center rounded-md px-1 transition-colors hover:bg-surface/60"
                  >
                    <span className={`mono-num text-[10px] font-bold tracking-widest ${numCls}`}>
                      {roundLabel(race.round)}
                    </span>
                    <span className="mt-1.5 flex h-3 w-full items-center" aria-hidden="true">
                      <span className={cn('h-px flex-1', isFirst ? 'bg-transparent' : connector)} />
                      <span className={`h-3 w-3 shrink-0 rounded-full border ${dot}`} />
                      <span className={cn('h-px flex-1', isLast ? 'bg-transparent' : connector)} />
                    </span>
                    <span className="mono-num mt-1.5 text-[9px] text-muted">{formatDateShort(race.date)}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-accent/40 bg-accent/25" aria-hidden="true" />
            Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full border border-accent bg-accent"
              aria-hidden="true"
            />
            Next round
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-line bg-bg-secondary" aria-hidden="true" />
            Upcoming
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full border border-accent bg-accent ring-2 ring-accent/50 ring-offset-2 ring-offset-surface"
              aria-hidden="true"
            />
            Selected
          </span>
        </div>
      </div>
    </Card>
  )
}

export function Visualizations({
  calendar,
  lastRound,
  nextRound,
  selectedRound,
  onSelectRound,
  loading,
  error,
  onRetry,
}: {
  calendar: Race[]
  lastRound: number | null
  nextRound: number | null
  selectedRound: number | null
  onSelectRound: (round: number) => void
  loading: boolean
  error: Error | null
  onRetry: () => void
}) {
  if (loading && calendar.length === 0) {
    return (
      <Card className="rounded-lg">
        <RaceCardSkeleton />
      </Card>
    )
  }
  if (error && calendar.length === 0) {
    return (
      <Card className="rounded-lg">
        <ErrorState compact onRetry={onRetry} />
      </Card>
    )
  }
  return (
    <SeasonTimeline
      calendar={calendar}
      lastRound={lastRound}
      nextRound={nextRound}
      selectedRound={selectedRound}
      onSelectRound={onSelectRound}
    />
  )
}