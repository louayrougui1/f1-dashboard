import type { ConstructorStandingRow, DriverStandingRow } from '../lib/types'
import { display, driverCode, driverFullName, formatPoints, posTwo } from '../lib/format'
import { teamColor } from '../lib/teamColors'
import { cn } from '@/lib/utils'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from './Skeleton'
import { ErrorState } from './ErrorState'
import { DriverNumber } from './DriverNumber'

function PositionMark({ position }: { position: number }) {
  const cls =
    position === 1
      ? 'text-gold'
      : position === 2
        ? 'text-silver'
        : position === 3
          ? 'text-bronze'
          : 'text-muted'
  return <span className={`mono-num text-sm font-bold ${cls}`}>{posTwo(position)}</span>
}

function headClass(extra = '') {
  return cn(
    'sticky top-14 z-10 h-auto border-b border-line bg-surface px-2 py-2.5 text-[11px] font-semibold tracking-[0.18em] text-muted',
    extra,
  )
}

export function DriverTable({
  rows,
  loading,
  error,
  onRetry,
  limit = 12,
  onSelectDriver,
}: {
  rows: DriverStandingRow[]
  loading: boolean
  error: Error | null
  onRetry: () => void
  limit?: number
  onSelectDriver?: (driverId: string) => void
}) {
  if (loading && rows.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <TableSkeleton rows={7} cols={4} />
      </div>
    )
  }
  if (error && rows.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <ErrorState compact onRetry={onRetry} />
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-line bg-surface">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <TableHeader>
          <TableRow className="border-b border-line bg-surface">
            <TableHead className={cn(headClass(), 'pl-2 sm:pl-4')}>POS</TableHead>
            <TableHead className={headClass()}>DRIVER</TableHead>
            <TableHead className={cn(headClass(), 'text-right')}>PTS</TableHead>
            <TableHead className={cn(headClass(), 'text-right', 'hidden sm:table-cell')}>GAP</TableHead>
            <TableHead className={cn(headClass(), 'pr-2 text-right sm:pr-4')}>WINS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, limit).map((row) => {
            const isP1 = row.position === 1
            const podium = row.position <= 3
            const leaderPts = rows[0]?.points ?? row.points
            const gap = leaderPts - row.points
            return (
              <TableRow
                key={row.driver.driverId}
                className={cn(
                  'border-line/60 hover:bg-surface-hover',
                  onSelectDriver ? 'cursor-pointer' : '',
                  isP1 ? 'bg-accent/[0.05]' : podium ? 'bg-surface-2/40' : '',
                )}
                role={onSelectDriver ? 'link' : undefined}
                tabIndex={onSelectDriver ? 0 : undefined}
                title={onSelectDriver ? `Open ${driverFullName(row.driver)}` : undefined}
                onClick={
                  onSelectDriver
                    ? () => onSelectDriver(row.driver.driverId)
                    : undefined
                }
                onKeyDown={
                  onSelectDriver
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelectDriver(row.driver.driverId)
                        }
                      }
                    : undefined
                }
              >
                <TableCell
                  className={cn(
                    'border-b border-line/60 py-2.5',
                    isP1 ? 'border-l-2 border-l-accent pl-1.5' : 'pl-2 sm:pl-4',
                  )}
                >
                  <PositionMark position={row.position} />
                </TableCell>
                <TableCell className="min-w-0 border-b border-line/60 px-2 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden="true"
                      className="h-4 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: teamColor(row.constructor.constructorId) }}
                    />
                    <span className="mono-num hidden w-8 shrink-0 text-[11px] font-bold tracking-widest text-muted sm:inline">
                      {display(driverCode(row.driver))}
                    </span>
                    <DriverNumber driver={row.driver} className="text-[11px] font-bold" />
                    <span className="min-w-0">
                      <span className="block max-w-[7.5rem] truncate font-medium text-text sm:max-w-none">
                        {driverFullName(row.driver)}
                      </span>
                      <span
                        className="block truncate text-[11px]"
                        style={{ color: teamColor(row.constructor.constructorId) }}
                      >
                        {display(row.constructor.name)}
                      </span>
                    </span>
                    {isP1 ? (
                      <Badge className="hidden h-auto shrink-0 rounded-sm bg-accent px-1.5 py-px text-[9px] font-bold tracking-[0.18em] text-bg sm:inline-flex">
                        LEADER
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-2 py-2.5 text-right text-base font-semibold text-text">
                  {formatPoints(row.points)}
                </TableCell>
                <TableCell
                  className={cn(
                    'mono-num border-b border-line/60 px-2 py-2.5 text-right text-xs text-muted sm:px-4',
                    'hidden sm:table-cell',
                  )}
                >
                  {isP1 ? '—' : `-${gap}`}
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-2 py-2.5 text-right text-xs text-muted sm:px-4">
                  {row.wins}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </table>
    </div>
  )
}

export function ConstructorTable({
  rows,
  loading,
  error,
  onRetry,
  limit,
  onSelectConstructor,
}: {
  rows: ConstructorStandingRow[]
  loading: boolean
  error: Error | null
  onRetry: () => void
  limit?: number
  onSelectConstructor?: (constructorId: string) => void
}) {
  if (loading && rows.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <TableSkeleton rows={7} cols={3} />
      </div>
    )
  }
  if (error && rows.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <ErrorState compact onRetry={onRetry} />
      </div>
    )
  }
  const max = Math.max(1, ...rows.map((r) => r.points))
  const leaderPts = rows[0]?.points ?? 0
  return (
    <div className="rounded-lg border border-line bg-surface">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <TableHeader>
          <TableRow className="border-b border-line bg-surface">
            <TableHead className={cn(headClass(), 'pl-2 sm:pl-4')}>POS</TableHead>
            <TableHead className={headClass()}>CONSTRUCTOR</TableHead>
            <TableHead className={cn(headClass(), 'text-right')}>PTS</TableHead>
            <TableHead className={cn(headClass(), 'text-right', 'hidden sm:table-cell')}>GAP</TableHead>
            <TableHead className={cn(headClass(), 'pr-2 text-right sm:pr-4')}>WINS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, limit ?? rows.length).map((row) => {
            const isP1 = row.position === 1
            const podium = row.position <= 3
            const gap = leaderPts - row.points
            return (
              <TableRow
                key={row.constructor.constructorId}
                className={cn(
                  'border-line/60 hover:bg-surface-hover',
                  onSelectConstructor ? 'cursor-pointer' : '',
                  isP1 ? 'bg-accent/[0.05]' : podium ? 'bg-surface-2/40' : '',
                )}
                role={onSelectConstructor ? 'link' : undefined}
                tabIndex={onSelectConstructor ? 0 : undefined}
                title={
                  onSelectConstructor ? `Open ${display(row.constructor.name)}` : undefined
                }
                onClick={
                  onSelectConstructor
                    ? () => onSelectConstructor(row.constructor.constructorId)
                    : undefined
                }
                onKeyDown={
                  onSelectConstructor
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelectConstructor(row.constructor.constructorId)
                        }
                      }
                    : undefined
                }
              >
                <TableCell
                  className={cn(
                    'border-b border-line/60 py-2.5',
                    isP1 ? 'border-l-2 border-l-accent pl-1.5' : 'pl-2 sm:pl-4',
                  )}
                >
                  <PositionMark position={row.position} />
                </TableCell>
                <TableCell className="min-w-0 border-b border-line/60 px-2 py-2.5">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: teamColor(row.constructor.constructorId) }}
                    />
                    <span
                      className="block max-w-[8.5rem] truncate font-medium sm:max-w-none"
                      style={{ color: teamColor(row.constructor.constructorId) }}
                    >
                      {display(row.constructor.name)}
                    </span>
                    {isP1 ? (
                      <Badge className="hidden h-auto shrink-0 rounded-sm bg-accent px-1.5 py-px text-[9px] font-bold tracking-[0.18em] text-bg sm:inline-flex">
                        LEADER
                      </Badge>
                    ) : null}
                  </span>
                  <Progress
                    value={Math.max(4, (row.points / max) * 100)}
                    className="mt-1.5 h-1 bg-bg-secondary"
                    indicatorStyle={{ backgroundColor: teamColor(row.constructor.constructorId) }}
                    aria-label={`${display(row.constructor.name)} ${row.points} points`}
                  />
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-2 py-2.5 text-right text-base font-semibold text-text">
                  {formatPoints(row.points)}
                </TableCell>
                <TableCell
                  className={cn(
                    'mono-num border-b border-line/60 px-2 py-2.5 text-right text-xs text-muted sm:px-4',
                    'hidden sm:table-cell',
                  )}
                >
                  {isP1 ? '—' : `-${gap}`}
                </TableCell>
                <TableCell className="mono-num border-b border-line/60 px-2 py-2.5 text-right text-xs text-muted sm:px-4">
                  {row.wins}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </table>
    </div>
  )
}

export function Standings({
  drivers,
  constructors,
  loading,
  driverError,
  constructorError,
  onRetryDrivers,
  onRetryConstructors,
  onSelectDriver,
  onSelectConstructor,
}: {
  drivers: DriverStandingRow[]
  constructors: ConstructorStandingRow[]
  loading: boolean
  driverError: Error | null
  constructorError: Error | null
  onRetryDrivers: () => void
  onRetryConstructors: () => void
  onSelectDriver?: (driverId: string) => void
  onSelectConstructor?: (constructorId: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <div id="drivers" className="scroll-mt-20 xl:col-span-3">
        <DriverTable
          rows={drivers}
          loading={loading}
          error={driverError}
          onRetry={onRetryDrivers}
          onSelectDriver={onSelectDriver}
        />
      </div>
      <div id="constructors" className="scroll-mt-20 xl:col-span-2">
        <ConstructorTable
          rows={constructors}
          loading={loading}
          error={constructorError}
          onRetry={onRetryConstructors}
          onSelectConstructor={onSelectConstructor}
        />
      </div>
    </div>
  )
}
