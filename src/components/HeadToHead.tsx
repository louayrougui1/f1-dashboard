import { useMemo, useState } from 'react'
import type { DriverStandingRow, RaceResultRow, SeasonRoundResults } from '../lib/types'
import { driverCode, driverFullName, roundLabel } from '../lib/format'
import { teamColor } from '../lib/teamColors'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSkeleton } from './Skeleton'
import { ErrorState } from './ErrorState'

interface CompareCell {
  round: number
  a: RaceResultRow | null
  b: RaceResultRow | null
}

function summary(cells: CompareCell[], get: (c: CompareCell) => RaceResultRow | null) {
  const rows = cells.map(get).filter((r): r is RaceResultRow => r !== null && r.position > 0)
  const wins = rows.filter((r) => r.position === 1).length
  const best = rows.length > 0 ? Math.min(...rows.map((r) => r.position)) : null
  const avg = rows.length > 0 ? rows.reduce((s, r) => s + r.position, 0) / rows.length : null
  return { wins, best, avg, raced: rows.length }
}

function CellValue({ row }: { row: RaceResultRow | null }) {
  if (!row || row.position <= 0) {
    return <span className="text-muted/60">—</span>
  }
  const tone =
    row.position === 1
      ? 'text-gold'
      : row.position <= 3
        ? row.position === 2
          ? 'text-silver'
          : 'text-bronze'
        : 'text-text/80'
  return <span className={cn('mono-num text-xs', tone)}>{String(row.position).padStart(2, '0')}</span>
}

export function HeadToHead({
  rounds,
  drivers,
  loading,
  error,
  onRetry,
}: {
  rounds: SeasonRoundResults[]
  drivers: DriverStandingRow[]
  loading: boolean
  error: Error | null
  onRetry: () => void
}) {
  const teammateId = drivers[0]?.constructor.constructorId ?? null
  const teammates = useMemo(
    () => (teammateId ? drivers.filter((d) => d.constructor.constructorId === teammateId) : []),
    [drivers, teammateId],
  )
  const [aId, setAId] = useState<string | null>(null)
  const [bId, setBId] = useState<string | null>(null)

  const a = drivers.find((d) => d.driver.driverId === aId) ?? teammates[0] ?? drivers[0] ?? null
  const b = drivers.find((d) => d.driver.driverId === bId) ?? teammates[1] ?? drivers[1] ?? null

  const cells: CompareCell[] = useMemo(
    () =>
      rounds.map((r) => ({
        round: r.round,
        a: a ? (r.results.find((x) => x.driver.driverId === a.driver.driverId) ?? null) : null,
        b: b ? (r.results.find((x) => x.driver.driverId === b.driver.driverId) ?? null) : null,
      })),
    [rounds, a, b],
  )

  const aSum = summary(cells, (c) => c.a)
  const bSum = summary(cells, (c) => c.b)
  const h2hA = cells.filter((c) => c.a && c.b && c.a.position > 0 && c.b.position > 0 && c.a.position < c.b.position).length
  const h2hB = cells.filter((c) => c.a && c.b && c.a.position > 0 && c.b.position > 0 && c.b.position < c.a.position).length

  if (loading && rounds.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <TableSkeleton rows={6} cols={5} />
      </div>
    )
  }
  if (error && rounds.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <ErrorState onRetry={onRetry} />
      </div>
    )
  }
  if (rounds.length === 0) {
    return (
      <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-4 py-6">
        <p className="label text-text">Head-to-Head</p>
        <p className="text-xs text-muted">No completed rounds yet for this season.</p>
      </div>
    )
  }

  const driverColor = (d: DriverStandingRow | null) =>
    d ? teamColor(d.constructor.constructorId) : 'var(--color-muted)'

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg-secondary/50 px-4 py-2.5 lg:px-5">
        <p className="label min-w-0 truncate text-text">Head-to-Head</p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Select value={a?.driver.driverId ?? ''} onValueChange={(v) => setAId(v)}>
            <SelectTrigger
              aria-label="Select driver A"
              className="h-8 max-w-[10rem] border-line bg-surface px-2.5 text-xs text-text hover:border-accent/60"
            >
              <SelectValue placeholder="Driver A" />
            </SelectTrigger>
            <SelectContent align="end" className="max-h-72 border-line bg-surface">
              {drivers.map((d) => (
                <SelectItem key={d.driver.driverId} value={d.driver.driverId}>
                  {driverCode(d.driver)} · {driverFullName(d.driver)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={b?.driver.driverId ?? ''} onValueChange={(v) => setBId(v)}>
            <SelectTrigger
              aria-label="Select driver B"
              className="h-8 max-w-[10rem] border-line bg-surface px-2.5 text-xs text-text hover:border-accent/60"
            >
              <SelectValue placeholder="Driver B" />
            </SelectTrigger>
            <SelectContent align="end" className="max-h-72 border-line bg-surface">
              {drivers.map((d) => (
                <SelectItem key={d.driver.driverId} value={d.driver.driverId}>
                  {driverCode(d.driver)} · {driverFullName(d.driver)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 border-b border-line px-4 py-3 sm:grid-cols-3 lg:px-5">
        <div className="rounded-md border border-line bg-bg/40 px-3 py-2">
          <p className="label text-[10px] text-muted/70">Wins</p>
          <p className="mt-1 text-lg font-semibold">
            <span style={{ color: driverColor(a) }}>{aSum.wins}</span>
            <span className="mx-2 text-muted">–</span>
            <span style={{ color: driverColor(b) }}>{bSum.wins}</span>
          </p>
        </div>
        <div className="rounded-md border border-line bg-bg/40 px-3 py-2">
          <p className="label text-[10px] text-muted/70">Best Finish</p>
          <p className="mt-1 text-lg font-semibold">
            <span className="mono-num" style={{ color: driverColor(a) }}>
              P{aSum.best ?? '—'}
            </span>
            <span className="mx-2 text-muted">vs</span>
            <span className="mono-num" style={{ color: driverColor(b) }}>
              P{bSum.best ?? '—'}
            </span>
          </p>
        </div>
        <div className="rounded-md border border-line bg-bg/40 px-3 py-2">
          <p className="label text-[10px] text-muted/70">Head-to-Head Record</p>
          <p className="mt-1 text-lg font-semibold">
            <span style={{ color: driverColor(a) }}>{h2hA}</span>
            <span className="mx-2 text-muted">–</span>
            <span style={{ color: driverColor(b) }}>{h2hB}</span>
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[44rem] border-separate border-spacing-0 text-sm">
          <TableHeader>
            <TableRow className="border-0">
              <TableHead className="sticky left-0 z-10 h-auto border-b border-line bg-surface px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-muted">
                ROUND
              </TableHead>
              {cells.map((c) => (
                <TableHead
                  key={c.round}
                  className="h-auto border-b border-line bg-surface px-1 py-2 text-center text-[11px] font-semibold tracking-[0.18em] text-muted"
                >
                  {roundLabel(c.round).replace('R', '')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[a, b].map((d) =>
              d ? (
                <TableRow key={`row-${d.driver.driverId}`} className="border-0 hover:bg-surface-hover">
                  <TableCell className="sticky left-0 z-10 border-b border-line/60 bg-surface px-4 py-2">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-4 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: teamColor(d.constructor.constructorId) }}
                      />
                      <span className="mono-num text-[11px] font-bold tracking-widest" style={{ color: teamColor(d.constructor.constructorId) }}>
                        {driverCode(d.driver)}
                      </span>
                    </span>
                  </TableCell>
                  {cells.map((c) => {
                    const row = d.driver.driverId === a?.driver.driverId ? c.a : c.b
                    const isLeader = row !== null && row.position === 1
                    return (
                      <TableCell
                        key={`${d.driver.driverId}-${c.round}`}
                        className={cn(
                          'border-b border-line/60 px-1 py-2 text-center',
                          isLeader ? 'bg-gold/[0.08]' : '',
                        )}
                      >
                        <CellValue row={row} />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ) : null,
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}