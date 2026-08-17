import { useMemo } from 'react'
import type {
  DriverStandingRow,
  Race,
  RaceResultRow,
  SeasonRoundResults,
} from '../lib/types'
import { display, driverCode, driverFullName, formatPoints, posTwo, roundLabel } from '../lib/format'
import { teamColor } from '../lib/teamColors'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from './Skeleton'
import { ErrorState } from './ErrorState'
import { HeadToHead } from './HeadToHead'
import { PointsChart } from './PointsChart'

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

export function DriverPage({
  driverId,
  seasonLabel,
  calendar,
  standings,
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
  driverId: string
  seasonLabel: string | null
  calendar: Race[]
  standings: DriverStandingRow[]
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
  const standing = useMemo(() => standings.find((s) => s.driver.driverId === driverId) ?? null, [standings, driverId])
  const lastRound = rounds[rounds.length - 1]
  const lastRow = lastRound?.results.find((x) => x.driver.driverId === driverId) ?? null
  const driver = standing?.driver ?? lastRow?.driver ?? null
  const constructor = standing?.constructor ?? lastRow?.constructor ?? null
  const color = constructor ? teamColor(constructor.constructorId) : 'var(--color-muted)'
  const teammateId = useMemo(() => {
    const row = lastRound?.results.find((x) => x.driver.driverId === driverId)
    if (!row) return null
    return lastRound?.results.find(
      (x) => x.constructor.constructorId === row.constructor.constructorId && x.driver.driverId !== driverId,
    )?.driver.driverId ?? null
  }, [lastRound, driverId])

  const raceName = useMemo(() => {
    const m = new Map(calendar.map((r) => [r.round, r.raceName]))
    return (round: number) => m.get(round) ?? `Round ${round}`
  }, [calendar])

  const cells: Array<{ round: number; row: RaceResultRow | null }> = useMemo(
    () =>
      rounds.map((r) => ({
        round: r.round,
        row: r.results.find((x) => x.driver.driverId === driverId) ?? null,
      })),
    [rounds, driverId],
  )

  const winCount = useMemo(
    () => cells.filter((c) => c.row?.position === 1).length,
    [cells],
  )

  const driverPoints = useMemo(() => {
    let cum = 0
    return rounds.map((r) => {
      const row = r.results.find((x) => x.driver.driverId === driverId)
      cum += row?.points ?? 0
      return cum
    })
  }, [rounds, driverId])

  const h2hReady = rounds.length > 0 && !roundsLoading && roundsError === null && standings.length > 0

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
              <span className="label text-[10px] text-muted/70">Driver</span>
              <span className="label text-[10px] text-muted/40">{display(seasonLabel)}</span>
            </div>
            <h1 className="mt-1 truncate text-3xl leading-tight font-semibold tracking-tight text-text uppercase sm:text-4xl">
              {driver ? driverFullName(driver) : '—'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span style={{ color }} className="font-medium">
                  {display(constructor?.name)}
                </span>
              </span>
              {driver?.nationality ? <span className="text-muted">{driver.nationality}</span> : null}
              {driver ? (
                <Badge className="hidden h-auto rounded-sm border-line bg-bg/60 px-1.5 py-px mono-num text-[10px] tracking-[0.18em] text-muted sm:inline-flex">
                  {driverCode(driver)}
                </Badge>
              ) : null}
            </div>
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
                {winCount} {winCount === 1 ? 'win' : 'wins'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface">
                    <th className="h-auto border-b border-line bg-surface px-4 py-2 text-left text-[11px] font-semibold tracking-[0.18em] text-muted">ROUND</th>
                    <th className="h-auto border-b border-line bg-surface px-2 py-2 text-left text-[11px] font-semibold tracking-[0.18em] text-muted">GRAND PRIX</th>
                    <th className="h-auto border-b border-line bg-surface px-2 py-2 text-left text-[11px] font-semibold tracking-[0.18em] text-muted">TEAM</th>
                    <th className="h-auto border-b border-line bg-surface px-2 py-2 text-right text-[11px] font-semibold tracking-[0.18em] text-muted">POS</th>
                    <th className="h-auto border-b border-line bg-surface px-4 py-2 text-right text-[11px] font-semibold tracking-[0.18em] text-muted">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {cells.map((c) => {
                    const row = c.row
                    const isLeader = row?.position === 1
                    return (
                      <tr key={c.round} className={cn('hover:bg-surface-hover', isLeader ? 'bg-gold/[0.06]' : '')}>
                        <td className="mono-num border-b border-line/60 px-4 py-2.5 text-xs text-muted">{roundLabel(c.round)}</td>
                        <td className="min-w-0 border-b border-line/60 px-2 py-2.5">
                          <span className="block max-w-[11rem] truncate text-text">{display(raceName(c.round))}</span>
                        </td>
                        <td className="min-w-0 border-b border-line/60 px-2 py-2.5">
                          {row ? (
                            <span className="flex items-center gap-1.5">
                              <span aria-hidden="true" className="h-2 w-1 shrink-0 rounded-full" style={{ backgroundColor: teamColor(row.constructor.constructorId) }} />
                              <span className="block max-w-[9rem] truncate text-xs" style={{ color: teamColor(row.constructor.constructorId) }}>
                                {display(row.constructor.name)}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted/60">—</span>
                          )}
                        </td>
                        <td className="border-b border-line/60 px-2 py-2.5 text-right">
                          {row && row.position > 0 ? <PositionMark position={row.position} /> : <span className="text-muted/60">—</span>}
                        </td>
                        <td className="mono-num border-b border-line/60 px-4 py-2.5 text-right text-xs font-semibold text-text">
                          {row ? formatPoints(row.points) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="rounded-lg p-0 gap-0">
            <div className="flex items-center justify-between gap-3 border-b border-line bg-bg-secondary/50 px-4 py-2.5 lg:px-5">
              <p className="label min-w-0 truncate text-text">Points Progression</p>
              <p className="label text-[10px] text-muted/70">Cumulative</p>
            </div>
            <div className="px-3 pt-3 pb-2">
              <PointsChart
                pts={driverPoints}
                labels={rounds.map((r) => roundLabel(r.round).replace('R', ''))}
                color={color}
                ariaLabel="Cumulative driver points per round"
              />
            </div>
          </Card>
        </>
      )}

      {h2hReady ? (
        <HeadToHead
          rounds={rounds}
          drivers={standings}
          loading={roundsLoading}
          error={roundsError}
          onRetry={onRetryRounds}
          defaultA={driverId}
          defaultB={teammateId}
          onSelectDriver={onSelectDriver}
        />
      ) : null}

      {standingsLoading && standings.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <TableSkeleton rows={7} cols={4} />
        </div>
      ) : standingsError && standings.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <ErrorState onRetry={onRetryStandings} />
        </div>
      ) : null}
    </div>
  )
}