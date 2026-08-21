import type { RaceResultRow } from '../lib/types'
import { display, driverCode, driverFullName, formatPoints, isLapped, posTwo, resultMark, roundLabel } from '../lib/format'
import { teamColor } from '../lib/teamColors'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from './Skeleton'
import { ErrorState } from './ErrorState'
import { DriverNumber } from './DriverNumber'

function headClass(extra = '') {
  return cn(
    'h-auto border-b border-line bg-surface px-2 py-2.5 text-xs font-semibold tracking-[0.18em] text-muted',
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
  upcoming,
  onRetry,
  onPrev,
  onNext,
  canPrev,
  canNext,
  maxRows,
  variant = 'race',
}: {
  raceName: string | null
  round: number | null
  rows: RaceResultRow[]
  loading: boolean
  error: Error | null
  hasData: boolean
  upcoming?: boolean
  onRetry: () => void
  onPrev?: () => void
  onNext?: () => void
  canPrev?: boolean
  canNext?: boolean
  maxRows?: number
  variant?: 'race' | 'sprint'
}) {
  if (loading && !hasData) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <TableSkeleton rows={8} cols={5} />
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
  if (upcoming && !hasData) {
    return (
      <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-4 py-6">
        <p className="label text-text">{variant === 'sprint' ? 'Sprint Results' : 'Race Results'}</p>
        <p className="text-xs text-muted">
          {variant === 'sprint'
            ? 'Sprint results have not been published yet.'
            : 'Race results have not been published yet.'}
        </p>
      </div>
    )
  }
  const fullTiming = maxRows != null
  const shown = rows.slice(0, maxRows ?? 12)
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
          <p className="label text-[11px] text-muted/70">{fullTiming ? 'Full Timing' : 'Top 12 · Timing'}</p>
        </div>
      </div>
      <Table className="min-w-[30rem] border-separate border-spacing-0 text-sm">
        <TableHeader>
          <TableRow className="border-0">
            <TableHead className={cn(headClass(), 'pl-4')}>POS</TableHead>
            <TableHead className={headClass()}>DRIVER</TableHead>
            <TableHead className={cn(headClass(), 'text-right')}>GRID</TableHead>
            <TableHead
              className="h-auto border-b border-line bg-surface px-2 py-2.5 text-right text-xs font-semibold tracking-normal text-muted"
              aria-label="Grid to flag change"
            >
              GAIN/LOST
            </TableHead>
            <TableHead className={cn(headClass(), 'text-right')}>TIME / GAP</TableHead>
            <TableHead className={cn(headClass(), 'pr-4 text-right')}>PTS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((row) => {
            const gapOrTime = row.position === 1 ? row.time : row.gap
            const isP1 = row.position === 1
            const podium = row.position <= 3
            const mark = resultMark(row.status)
            return (
              <TableRow
                key={`${row.driver.driverId}-${row.position}`}
                className={cn(
                  'border-0 hover:bg-surface-hover',
                  mark ? 'bg-surface-2/60' : '',
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
                    {mark ?? posTwo(row.positionText)}
                  </span>
                </TableCell>
                <TableCell className="min-w-0 border-b border-line/60 px-2 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden="true"
                      className="h-4 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: teamColor(row.constructor.constructorId) }}
                    />
                    <span className="mono-num hidden w-8 shrink-0 text-xs font-bold tracking-widest text-muted sm:inline">
                      {driverCode(row.driver)}
                    </span>
                    <DriverNumber driver={row.driver} className="text-xs font-bold" />
                    <span className="min-w-0">
                      <span className="block max-w-[9.5rem] truncate font-medium text-text sm:max-w-none">
                        {driverFullName(row.driver)}
                      </span>
                      <span
                        className="block truncate text-xs"
                        style={{ color: teamColor(row.constructor.constructorId) }}
                      >
                        {display(row.constructor.name)}
                      </span>
                    </span>
                    {row.fastestLap?.rank === 1 ? (
                      <Badge
                        className="h-auto shrink-0 rounded bg-accent/15 px-1 py-px text-[10px] font-bold tracking-widest text-accent"
                        variant="outline"
                      >
                        FL
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-2 py-2.5 text-right text-muted">
                  {display(row.grid)}
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-2 py-2.5 text-right text-sm">
                  {row.grid === null ? (
                    <span className="text-muted">--</span>
                  ) : (
                    (() => {
                      const delta = row.grid - row.position
                      const sign = delta > 0 ? '+' : delta < 0 ? '-' : ''
                      const cls = delta > 0 ? 'text-good' : delta < 0 ? 'text-error' : 'text-muted'
                      return (
                        <span
                          className={cn('font-semibold', cls)}
                          title={`Started P${row.grid} · Finished P${row.position}`}
                        >
                          {sign}
                          {delta}
                        </span>
                      )
                    })()
                  )}
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-2 py-2.5 text-right text-sm">
                  {isLapped(row.gap) ? (
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <Badge
                        className="h-auto shrink-0 rounded bg-warn/15 px-1 py-px text-[10px] font-bold tracking-widest text-warn"
                        variant="outline"
                      >
                        LAPPED
                      </Badge>
                      <span className="font-semibold text-warn">{display(gapOrTime)}</span>
                    </span>
                  ) : (
                    <span className="text-text">{display(gapOrTime)}</span>
                  )}
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
