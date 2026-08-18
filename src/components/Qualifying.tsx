import type { QualifyingRow } from '../lib/types'
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

function qTime(value: string | null): string {
  return value ? value : '—'
}

export function Qualifying({
  raceName,
  round,
  rows,
  loading,
  error,
  hasData,
  upcoming,
  onRetry,
}: {
  raceName: string | null
  round: number | null
  rows: QualifyingRow[]
  loading: boolean
  error: Error | null
  hasData: boolean
  upcoming?: boolean
  onRetry: () => void
}) {
  if (loading && !hasData) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <TableSkeleton rows={10} cols={5} />
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
  if (!hasData) {
    return (
      <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-4 py-6">
        <p className="label text-text">Qualifying</p>
        <p className="text-xs text-muted">
          {upcoming
            ? 'Qualifying has not taken place yet for this round.'
            : 'Qualifying data is not available for this round.'}
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
        <p className="label text-[10px] text-muted/70">Q1 · Q2 · Q3</p>
      </div>
      <Table className="min-w-[34rem] border-separate border-spacing-0 text-sm">
        <TableHeader>
          <TableRow className="border-0">
            <TableHead className={cn(headClass(), 'pl-4')}>POS</TableHead>
            <TableHead className={headClass()}>DRIVER</TableHead>
            <TableHead className={cn(headClass(), 'hidden sm:table-cell')}>TEAM</TableHead>
            <TableHead className={cn(headClass(), 'text-right')}>Q1</TableHead>
            <TableHead className={cn(headClass(), 'text-right')}>Q2</TableHead>
            <TableHead className={cn(headClass(), 'pr-4 text-right')}>Q3</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isP1 = row.position === 1
            const podium = row.position <= 3
            const tone =
              isP1 ? 'text-gold' : row.position === 2 ? 'text-silver' : row.position === 3 ? 'text-bronze' : 'text-muted'
            return (
              <TableRow
                key={row.driver.driverId}
                className={cn('border-0 hover:bg-surface-hover', isP1 ? 'bg-accent/[0.05]' : podium ? 'bg-surface-2/40' : '')}
              >
                <TableCell
                  className={cn(
                    'border-b border-line/60 py-2.5',
                    isP1 ? 'border-l-2 border-l-accent pl-3.5' : 'pl-4',
                  )}
                >
                  <span className={cn('mono-num text-sm font-bold', tone)}>{posTwo(row.position)}</span>
                </TableCell>
                <TableCell className="min-w-0 border-b border-line/60 px-2 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden="true"
                      className="h-4 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: teamColor(row.constructor.constructorId) }}
                    />
                    <span className="mono-num w-8 shrink-0 text-[11px] font-bold tracking-widest text-muted">
                      {driverCode(row.driver)}
                    </span>
                    <DriverNumber driver={row.driver} className="text-[11px] font-bold" />
                    <span
                      className="max-w-[9.5rem] truncate font-medium sm:max-w-none"
                      style={{ color: teamColor(row.constructor.constructorId) }}
                    >
                      {driverFullName(row.driver)}
                    </span>
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
                <TableCell className="mono-num border-b border-line/60 px-2 py-2.5 text-right text-xs text-text">
                  {qTime(row.q1)}
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-2 py-2.5 text-right text-xs text-text">
                  {qTime(row.q2)}
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-4 py-2.5 text-right text-xs font-semibold text-text">
                  {qTime(row.q3)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}