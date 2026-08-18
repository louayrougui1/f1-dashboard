import { useMemo } from 'react'
import type { PitStopRow, RaceResultRow } from '../lib/types'
import { display, driverCode, driverFullName, posTwo, roundLabel } from '../lib/format'
import { teamColor } from '../lib/teamColors'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSkeleton } from './Skeleton'
import { ErrorState } from './ErrorState'
import { DriverNumber } from './DriverNumber'

function headClass(extra = '') {
  return cn(
    'h-auto border-b border-line bg-surface px-2 py-2.5 text-[11px] font-semibold tracking-[0.18em] text-muted',
    extra,
  )
}

function fmtDuration(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(3)}s`
}

function fmtBreakdown(stops: PitStopRow[]): string {
  return stops
    .map((s) => `L${s.lap} ${s.duration !== null ? s.duration.toFixed(2) + 's' : '—'}`)
    .join(' · ')
}

export function PitStops({
  raceName,
  round,
  stops,
  resultRows,
  loading,
  error,
  hasData,
  upcoming,
  onRetry,
}: {
  raceName: string | null
  round: number | null
  stops: PitStopRow[]
  resultRows: RaceResultRow[]
  loading: boolean
  error: Error | null
  hasData: boolean
  upcoming?: boolean
  onRetry: () => void
}) {
  const byDriver = useMemo(() => {
    const map = new Map<string, PitStopRow[]>()
    for (const s of stops) {
      const arr = map.get(s.driverId) ?? []
      arr.push(s)
      map.set(s.driverId, arr)
    }
    return map
  }, [stops])

  const rows = useMemo(() => {
    return resultRows
      .map((r) => {
        const driverStops = byDriver.get(r.driver.driverId) ?? []
        const total = driverStops.reduce((acc, s) => acc + (s.duration ?? 0), 0)
        const fastest = driverStops.length > 0 ? Math.min(...driverStops.map((s) => s.duration ?? Infinity)) : null
        return { result: r, stops: driverStops, total, fastest }
      })
      .sort((a, b) => a.result.position - b.result.position)
  }, [resultRows, byDriver])

  if (loading && stops.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <TableSkeleton rows={8} cols={5} />
      </div>
    )
  }
  if (error && stops.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <ErrorState onRetry={onRetry} />
      </div>
    )
  }
  if (!hasData && rows.length === 0) {
    return (
      <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-4 py-6">
        <p className="label text-text">Pit Stop Data</p>
        <p className="text-xs text-muted">
          {upcoming
            ? 'Pit stop telemetry is not available until the race has run.'
            : 'Pit stop telemetry is not available for this round.'}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-bg-secondary/50 px-4 py-2.5 lg:px-5">
        <p className="label min-w-0 truncate text-text">
          {display(raceName)}
          {round !== null && round !== undefined ? <span className="text-muted"> · {display(roundLabel(round))}</span> : null}
        </p>
        <p className="label text-[10px] text-muted/70">Pit Stops · {stops.length}</p>
      </div>
      <Table className="min-w-[40rem] border-separate border-spacing-0 text-sm">
        <TableHeader>
          <TableRow className="border-0">
            <TableHead className={cn(headClass(), 'pl-4')}>POS</TableHead>
            <TableHead className={headClass()}>DRIVER</TableHead>
            <TableHead className={cn(headClass(), 'hidden md:table-cell')}>TEAM</TableHead>
            <TableHead className={cn(headClass(), 'text-right')}>STOPS</TableHead>
            <TableHead className={cn(headClass(), 'text-right')}>FASTEST</TableHead>
            <TableHead className={cn(headClass(), 'text-right')}>TOTAL</TableHead>
            <TableHead className={cn(headClass(), 'pr-4 text-right')}>STOP BREAKDOWN</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ result, stops: ds, fastest, total }) => {
            const isP1 = result.position === 1
            const podium = result.position <= 3
            const tone =
              isP1 ? 'text-gold' : result.position === 2 ? 'text-silver' : result.position === 3 ? 'text-bronze' : 'text-muted'
            return (
              <TableRow
                key={result.driver.driverId}
                className={cn('border-0 hover:bg-surface-hover', isP1 ? 'bg-accent/[0.05]' : podium ? 'bg-surface-2/40' : '')}
              >
                <TableCell
                  className={cn(
                    'border-b border-line/60 py-2.5',
                    isP1 ? 'border-l-2 border-l-accent pl-3.5' : 'pl-4',
                  )}
                >
                  <span className={cn('mono-num text-sm font-bold', tone)}>{posTwo(result.position)}</span>
                </TableCell>
                <TableCell className="min-w-0 border-b border-line/60 px-2 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden="true"
                      className="h-4 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: teamColor(result.constructor.constructorId) }}
                    />
                    <span className="mono-num w-8 shrink-0 text-[11px] font-bold tracking-widest text-muted">
                      {driverCode(result.driver)}
                    </span>
                    <DriverNumber driver={result.driver} className="text-[11px] font-bold" />
                    <span
                      className="max-w-[9.5rem] truncate font-medium sm:max-w-none"
                      style={{ color: teamColor(result.constructor.constructorId) }}
                    >
                      {driverFullName(result.driver)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden border-b border-line/60 px-2 py-2.5 text-xs md:table-cell">
                  <span style={{ color: teamColor(result.constructor.constructorId) }}>
                    {display(result.constructor.name)}
                  </span>
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-2 py-2.5 text-right text-xs text-text">
                  {ds.length}
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-2 py-2.5 text-right text-xs font-semibold text-text">
                  {fmtDuration(fastest)}
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-2 py-2.5 text-right text-xs text-text">
                  {total > 0 ? `${total.toFixed(2)}s` : '—'}
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-4 py-2.5 text-right text-[11px] text-muted">
                  {ds.length > 0 ? fmtBreakdown(ds) : '—'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}