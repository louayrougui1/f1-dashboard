import { useMemo } from 'react'
import type {
  ConstructorStandingRow,
  Driver,
  DriverStandingRow,
  Race,
  RaceResultRow,
  SeasonRoundResults,
} from '../lib/types'
import { display, driverCode, driverFullName, formatPoints, posTwo, resultMark, roundLabel } from '../lib/format'
import { teamColor } from '../lib/teamColors'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from './Skeleton'
import { ErrorState } from './ErrorState'
import { PointsChart } from './PointsChart'
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
  return <span className={cn('mono-num text-sm font-bold', cls)}>{posTwo(position)}</span>
}

export function TeamPage({
  constructorId,
  seasonLabel,
  calendar,
  standings,
  driverStandings,
  standingsLoading,
  standingsError,
  onRetryStandings,
  rounds,
  roundsLoading,
  roundsError,
  onRetryRounds,
  onBack,
  onSelectDriver,
}: {
  constructorId: string
  seasonLabel: string | null
  calendar: Race[]
  standings: ConstructorStandingRow[]
  driverStandings: DriverStandingRow[]
  standingsLoading: boolean
  standingsError: Error | null
  onRetryStandings: () => void
  rounds: SeasonRoundResults[]
  roundsLoading: boolean
  roundsError: Error | null
  onRetryRounds: () => void
  onBack: () => void
  onSelectDriver: (driverId: string) => void
}) {
  const standing = useMemo(
    () => standings.find((s) => s.constructor.constructorId === constructorId) ?? null,
    [standings, constructorId],
  )
  const lastRound = rounds[rounds.length - 1]
  const lastRow = lastRound?.results.find((x) => x.constructor.constructorId === constructorId) ?? null
  const constructor = standing?.constructor ?? lastRow?.constructor ?? null
  const color = teamColor(constructorId)

  const teamDrivers = useMemo(() => {
    const map = new Map<string, Driver>()
    for (const s of driverStandings) {
      if (s.constructor.constructorId === constructorId) map.set(s.driver.driverId, s.driver)
    }
    for (const r of rounds) {
      for (const row of r.results) {
        if (row.constructor.constructorId === constructorId) map.set(row.driver.driverId, row.driver)
      }
    }
    const order = [...map.values()].sort((a, b) =>
      (driverCode(a) < driverCode(b) ? -1 : driverCode(a) > driverCode(b) ? 1 : 0),
    )
    return order
  }, [driverStandings, rounds, constructorId])

  const raceName = useMemo(() => {
    const m = new Map(calendar.map((r) => [r.round, r.raceName]))
    return (round: number) => m.get(round) ?? `Round ${round}`
  }, [calendar])

  const cells: Array<{ round: number; rows: RaceResultRow[] }> = useMemo(
    () =>
      rounds.map((r) => ({
        round: r.round,
        rows: r.results.filter((x) => x.constructor.constructorId === constructorId),
      })),
    [rounds, constructorId],
  )

  const wins = useMemo(
    () => cells.reduce((s, c) => s + c.rows.filter((r) => r.position === 1).length, 0),
    [cells],
  )

  const teamPoints = useMemo(() => {
    let cum = 0
    return rounds.map((r) => {
      const p = r.results.filter((x) => x.constructor.constructorId === constructorId).reduce((s, x) => s + x.points, 0)
      cum += p
      return cum
    })
  }, [rounds, constructorId])

  const driverStandingFor = (driverId: string): DriverStandingRow | null =>
    driverStandings.find((s) => s.driver.driverId === driverId) ?? null

  const totalRows = cells.reduce((s, c) => s + c.rows.length, 0)

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start rounded border border-line bg-surface px-3 py-1.5 text-xs tracking-[0.15em] text-muted transition-colors duration-150 hover:border-accent/50 hover:text-text"
      >
        ‹ BACK
      </button>

      <Card className="hero-wash overflow-hidden rounded-lg p-0">
        <div className="hero-wash-rule absolute inset-x-0 top-0 h-0.5" aria-hidden="true" />
        <div className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="label text-[10px] text-muted/70">Constructor</span>
              <span className="label text-[10px] text-muted/40">{display(seasonLabel)}</span>
            </div>
            <h1 className="mt-1 flex items-center gap-3 truncate text-3xl leading-tight font-semibold tracking-tight uppercase sm:text-4xl" style={{ color }}>
              <span aria-hidden="true" className="h-6 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="truncate">{display(constructor?.name)}</span>
            </h1>
            {constructor?.nationality ? (
              <p className="mt-2 text-xs text-muted">{constructor.nationality}</p>
            ) : null}
          </div>
          {standing ? (
            <div className="flex shrink-0 items-end gap-6 sm:flex-col sm:items-end sm:gap-3">
              <div className="flex items-baseline gap-2">
                <span className={cn('text-4xl font-bold', standing.position === 1 ? 'text-gold' : standing.position === 2 ? 'text-silver' : standing.position === 3 ? 'text-bronze' : 'text-text')}>
                  P{standing.position}
                </span>
                <span className="label text-[10px] text-muted/70">CHAMPIONSHIP</span>
              </div>
              <div className="flex items-center gap-5">
                <div>
                  <p className="mono-num text-xl font-semibold text-text">{formatPoints(standing.points)}</p>
                  <p className="label text-[10px] text-muted/70">Points</p>
                </div>
                <div>
                  <p className="mono-num text-xl font-semibold text-text">{standing.wins}</p>
                  <p className="label text-[10px] text-muted/70">Wins</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {teamDrivers.map((d) => {
          const s = driverStandingFor(d.driverId)
          return (
            <button
              key={d.driverId}
              type="button"
              onClick={() => onSelectDriver(d.driverId)}
              className="group rounded-lg border border-line bg-surface p-4 text-left transition-colors duration-150 hover:border-accent/50 hover:bg-surface-hover"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="label text-[10px] text-muted/70">Driver</p>
                  <p className="mt-1 truncate font-medium text-text">{driverFullName(d)}</p>
                  <p className="mono-num mt-0.5 flex items-center gap-2 text-[11px] font-bold tracking-widest" style={{ color }}>
                    {driverCode(d)}
                    <DriverNumber driver={d} className="text-[10px] font-bold" />
                  </p>
                </div>
                {s ? (
                  <div className="shrink-0 text-right">
                    <p className={cn('text-xl font-bold', s.position === 1 ? 'text-gold' : s.position === 2 ? 'text-silver' : s.position === 3 ? 'text-bronze' : 'text-text')}>
                      P{s.position}
                    </p>
                    <p className="mono-num text-[11px] text-muted">{formatPoints(s.points)} PTS</p>
                  </div>
                ) : null}
              </div>
              <p className="label mt-3 text-[10px] text-muted/70 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                View driver ›
              </p>
            </button>
          )
        })}
      </div>

      {roundsLoading && rounds.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <TableSkeleton rows={7} cols={5} />
        </div>
      ) : roundsError && rounds.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <ErrorState onRetry={onRetryRounds} />
        </div>
      ) : cells.length === 0 ? (
        <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-4 py-6">
          <p className="label text-text">Race Results</p>
          <p className="text-xs text-muted">No completed rounds yet for this season.</p>
        </div>
      ) : (
        <>
          <Card className="rounded-lg p-0 gap-0">
            <div className="flex items-center justify-between gap-3 border-b border-line bg-bg-secondary/50 px-4 py-2.5 lg:px-5">
              <p className="label min-w-0 truncate text-text">Race Results</p>
              <p className="label text-[10px] text-muted/70">
                {wins} {wins === 1 ? 'win' : 'wins'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface">
                    <th className="h-auto border-b border-line bg-surface px-4 py-2 text-left text-[11px] font-semibold tracking-[0.18em] text-muted">ROUND</th>
                    <th className="h-auto border-b border-line bg-surface px-2 py-2 text-left text-[11px] font-semibold tracking-[0.18em] text-muted">GRAND PRIX</th>
                    <th className="h-auto border-b border-line bg-surface px-2 py-2 text-left text-[11px] font-semibold tracking-[0.18em] text-muted">DRIVER</th>
                    <th className="h-auto border-b border-line bg-surface px-2 py-2 text-right text-[11px] font-semibold tracking-[0.18em] text-muted">POS</th>
                    <th className="h-auto border-b border-line bg-surface px-4 py-2 text-right text-[11px] font-semibold tracking-[0.18em] text-muted">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {cells.map((c) =>
                    c.rows.map((row, i) => {
                      const isLeader = row.position === 1
                      const mark = resultMark(row.status)
                      return (
                        <tr
                          key={`${c.round}-${row.driver.driverId}`}
                          className={cn(
                            'hover:bg-surface-hover',
                            mark ? 'bg-surface-2/60' : '',
                            isLeader ? 'bg-gold/[0.06]' : '',
                          )}
                        >
                          {i === 0 ? (
                            <td
                              rowSpan={c.rows.length}
                              className="mono-num border-b border-line/60 px-4 py-2.5 align-top text-xs text-muted"
                            >
                              {roundLabel(c.round)}
                            </td>
                          ) : null}
                          {i === 0 ? (
                            <td
                              rowSpan={c.rows.length}
                              className="min-w-0 border-b border-line/60 px-2 py-2.5 align-top"
                            >
                              <span className="block max-w-[11rem] truncate text-text">{display(raceName(c.round))}</span>
                            </td>
                          ) : null}
                          <td className="min-w-0 border-b border-line/60 px-2 py-2.5">
                            <button
                              type="button"
                              onClick={() => onSelectDriver(row.driver.driverId)}
                              className="flex items-center gap-1.5 hover:underline"
                            >
                              <span className="mono-num text-[11px] font-bold tracking-widest" style={{ color }}>
                                {driverCode(row.driver)}
                              </span>
                              <DriverNumber driver={row.driver} className="text-[10px] font-bold" />
                              <span className="block max-w-[8rem] truncate text-xs text-text">
                                {driverFullName(row.driver)}
                              </span>
                            </button>
                          </td>
<td className="border-b border-line/60 px-2 py-2.5 text-right">
  {mark ? (
    <span className="mono-num text-[10px] font-bold tracking-widest text-muted">{mark}</span>
  ) : row.position > 0 ? (
    <PositionMark position={row.position} />
  ) : (
    <span className="text-muted/60">—</span>
  )}
</td>
                          <td className="mono-num border-b border-line/60 px-4 py-2.5 text-right text-xs font-semibold text-text">
                            {formatPoints(row.points)}
                          </td>
                        </tr>
                      )
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="rounded-lg p-0 gap-0">
            <div className="flex items-center justify-between gap-3 border-b border-line bg-bg-secondary/50 px-4 py-2.5 lg:px-5">
              <p className="label min-w-0 truncate text-text">Points Progression</p>
              <p className="label text-[10px] text-muted/70">Cumulative Constructor Points</p>
            </div>
            <div className="px-3 pt-3 pb-2">
              <PointsChart
                pts={teamPoints}
                labels={rounds.map((r) => roundLabel(r.round).replace('R', ''))}
                color={color}
                ariaLabel="Cumulative constructor points per round"
              />
            </div>
          </Card>
        </>
      )}

      {standingsLoading && standings.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <TableSkeleton rows={7} cols={3} />
        </div>
      ) : standingsError && standings.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <ErrorState onRetry={onRetryStandings} />
        </div>
      ) : null}

      {totalRows === 0 && rounds.length > 0 && !roundsLoading && roundsError === null ? (
        <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-4 py-6">
          <p className="label text-text">Season Summary</p>
          <p className="text-xs text-muted">No results recorded for this constructor this season.</p>
        </div>
      ) : null}

      {teamDrivers.length > 0 && standings.length === 0 ? (
        <Badge className="h-auto rounded-sm border-line bg-surface px-2 py-0.5 text-[10px] tracking-[0.18em] text-muted">
          DRIVER ROSTER
        </Badge>
      ) : null}
    </div>
  )
}