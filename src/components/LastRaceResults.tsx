import type { RaceResultRow } from '../lib/types'
import { display, driverCode, driverFullName, formatPoints, posTwo, roundLabel } from '../lib/format'
import { teamColor } from '../lib/teamColors'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from './Skeleton'
import { ErrorState } from './ErrorState'

function StatusBadge({ status }: { status: string }) {
  const s = display(status).toLowerCase()
  const isRetired = s.includes('retired') || s.includes('dnf') || s.includes('accident') || s.includes('damage')
  const isFinished = s === 'finished' || s === 'completed'
  const tone = isRetired
    ? 'border-error/30 bg-error/10 text-error'
    : isFinished
      ? 'border-good/30 bg-good/10 text-good'
      : 'border-line bg-bg text-muted'
  const icon = isRetired ? '●' : isFinished ? '' : '◐'
  return (
    <Badge
      variant="outline"
      className={cn(
        'h-auto gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wide whitespace-nowrap',
        tone,
      )}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {display(status).toUpperCase()}
    </Badge>
  )
}

function headClass(extra = '') {
  return cn(
    'h-auto border-b border-line bg-surface px-2 py-2.5 text-[10px] font-semibold tracking-[0.18em] text-muted',
    extra,
  )
}

export function LastRaceResults({
  raceName,
  round,
  rows,
  loading,
  error,
  hasData,
  onRetry,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: {
  raceName: string | null
  round: number | null
  rows: RaceResultRow[]
  loading: boolean
  error: Error | null
  hasData: boolean
  onRetry: () => void
  onPrev?: () => void
  onNext?: () => void
  canPrev?: boolean
  canNext?: boolean
}) {
  if (loading && !hasData) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <TableSkeleton rows={8} cols={6} />
      </div>
    )
  }
  if (error && !hasData) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <ErrorState onRetry={onRetry} />
      </div>
    )
  }
  const shown = rows.slice(0, 12)
  const headerBtns = onPrev || onNext ? (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={!canPrev}
        onClick={onPrev}
        aria-label="Previous round results"
        className="h-7 w-7 border-line bg-surface text-muted hover:border-accent hover:bg-surface hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="size-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={!canNext}
        onClick={onNext}
        aria-label="Next round results"
        className="h-7 w-7 border-line bg-surface text-muted hover:border-accent hover:bg-surface hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  ) : null
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-bg-secondary/50 px-4 py-2.5 lg:px-5">
        <p className="label min-w-0 truncate text-text">
          {display(raceName)}
          {round !== null && round !== undefined ? <span className="text-muted"> · {display(roundLabel(round))}</span> : null}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          {headerBtns}
          <p className="label text-[9px] text-muted/70">Top 12 · Timing</p>
        </div>
      </div>
      <Table className="min-w-[34rem] border-separate border-spacing-0 text-sm">
        <TableHeader>
          <TableRow className="border-0">
            <TableHead className={cn(headClass(), 'pl-4')}>POS</TableHead>
            <TableHead className={headClass()}>DRIVER</TableHead>
            <TableHead className={cn(headClass(), 'hidden sm:table-cell')}>TEAM</TableHead>
            <TableHead className={cn(headClass(), 'text-right')}>GRID</TableHead>
            <TableHead className={headClass()}>STATUS</TableHead>
            <TableHead className={cn(headClass(), 'text-right')}>TIME / GAP</TableHead>
            <TableHead className={cn(headClass(), 'pr-4 text-right')}>PTS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((row) => {
            const gapOrTime = row.position === 1 ? row.time : row.gap
            const isP1 = row.position === 1
            const podium = row.position <= 3
            return (
              <TableRow
                key={`${row.driver.driverId}-${row.position}`}
                className={cn(
                  'border-0 hover:bg-surface-hover',
                  isP1 ? 'bg-accent/[0.05]' : podium ? 'bg-surface-2/40' : '',
                )}
              >
                <TableCell
                  className={cn(
                    'border-b border-line/60 py-2.5',
                    isP1 ? 'border-l-2 border-l-accent pl-3.5' : 'pl-4',
                  )}
                >
                  <span
                    className={cn(
                      'mono-num text-sm font-bold',
                      row.position === 1
                        ? 'text-gold'
                        : row.position === 2
                          ? 'text-silver'
                          : row.position === 3
                            ? 'text-bronze'
                            : 'text-muted',
                    )}
                  >
                    {posTwo(row.positionText)}
                  </span>
                </TableCell>
                <TableCell className="min-w-0 border-b border-line/60 px-2 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden="true"
                      className="h-4 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: teamColor(row.constructor.constructorId) }}
                    />
                    <span className="mono-num w-8 shrink-0 text-[10px] font-bold tracking-widest text-muted">
                      {driverCode(row.driver)}
                    </span>
                    <span
                      className="max-w-[9.5rem] truncate font-medium sm:max-w-none"
                      style={{ color: teamColor(row.constructor.constructorId) }}
                    >
                      {driverFullName(row.driver)}
                    </span>
                    {row.fastestLap?.rank === 1 ? (
                      <Badge
                        className="h-auto shrink-0 rounded bg-accent/15 px-1 py-px text-[9px] font-bold tracking-widest text-accent"
                        variant="outline"
                      >
                        FL
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="hidden border-b border-line/60 px-2 py-2.5 text-xs sm:table-cell">
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: teamColor(row.constructor.constructorId) }}
                    />
                    <span style={{ color: teamColor(row.constructor.constructorId) }}>
                      {display(row.constructor.name)}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-2 py-2.5 text-right text-muted">
                  {display(row.grid)}
                </TableCell>
                <TableCell className="border-b border-line/60 px-2 py-2.5">
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-2 py-2.5 text-right text-xs text-text">
                  {display(gapOrTime)}
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-4 py-2.5 text-right text-sm font-semibold text-text">
                  {formatPoints(row.points)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
