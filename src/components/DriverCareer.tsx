import type { CareerSeasonStats, CareerTeamStint, DriverCareer } from '../lib/types'
import type { CareerResult } from '../lib/useCareer'
import { display, positionLabel } from '../lib/format'
import { teamColor } from '../lib/teamColors'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { TableSkeleton } from './Skeleton'
import { ErrorState } from './ErrorState'

const STAT_COLS = [
  { key: 'races', short: 'R', long: 'Races' },
  { key: 'podiums', short: 'PDS', long: 'Podiums' },
  { key: 'wins', short: 'W', long: 'Wins' },
  { key: 'poles', short: 'PP', long: 'Poles' },
] as const

function StatHeader({ short, long }: { short: string; long: string }) {
  return (
    <span className="label w-7 shrink-0 text-right text-[10px] text-muted/70">
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{long}</span>
    </span>
  )
}

function StatGrid({ values }: { values: [number, number, number, number] }) {
  return (
    <div className="grid shrink-0 grid-cols-4 gap-6 sm:gap-10">
      {values.map((v, i) => (
        <span key={i} className="mono-num w-7 shrink-0 text-right text-xs text-text">
          {v}
        </span>
      ))}
    </div>
  )
}

function ChampMark({ position }: { position: number | null }) {
  if (position === null || position <= 0) {
    return <span className="label text-[10px] text-muted/60">—</span>
  }
  const cls =
    position === 1
      ? 'text-gold'
      : position === 2
        ? 'text-silver'
        : position === 3
          ? 'text-bronze'
          : 'text-muted'
  return (
    <span className="label text-[10px]">
      <span className={cn('mono-num font-bold', cls)}>{positionLabel(position)}</span>
    </span>
  )
}

function SeasonRow({ stats }: { stats: CareerSeasonStats }) {
  const rowTone =
    stats.championshipPosition === 1
      ? 'bg-gold/[0.06]'
      : stats.championshipPosition === 2
        ? 'bg-silver/[0.06]'
        : stats.championshipPosition === 3
          ? 'bg-bronze/[0.06]'
          : ''
  return (
    <div className={cn('flex items-center gap-3 border-b border-line/60 px-4 py-2.5 last:border-b-0 lg:px-5', rowTone)}>
      <div className="min-w-0 flex-1">
        <p className="mono-num text-xs font-semibold text-text">{stats.season}</p>
        <p className="mt-0.5 flex items-center gap-1">
          <span className="label text-[10px] text-muted/60">Finished</span>
          <ChampMark position={stats.championshipPosition} />
        </p>
      </div>
      <StatGrid values={[stats.races, stats.podiums, stats.wins, stats.poles]} />
    </div>
  )
}

function StintCard({ stint, onSelectConstructor }: { stint: CareerTeamStint; onSelectConstructor: (constructorId: string) => void }) {
  const color = teamColor(stint.constructor.constructorId)
  const totals: [number, number, number, number] = [stint.totals.races, stint.totals.podiums, stint.totals.wins, stint.totals.poles]
  return (
    <Card className="rounded-lg p-0 gap-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-bg-secondary/50 px-4 py-2.5 lg:px-5">
        <button
          type="button"
          onClick={() => onSelectConstructor(stint.constructor.constructorId)}
          className="group flex min-w-0 items-center gap-2"
          aria-label={`Open ${display(stint.constructor.name)} team page`}
        >
          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <span className="truncate text-sm font-semibold uppercase tracking-[0.16em] transition-colors group-hover:underline" style={{ color }}>
            {display(stint.constructor.name)}
          </span>
        </button>
        <p className="mono-num label shrink-0 text-[10px] text-muted/70">
          {stint.startSeason} – {stint.endSeason}
        </p>
      </div>
      <div className="flex items-center gap-3 border-b border-line px-4 py-2 lg:px-5">
        <div className="flex-1" />
        <div className="flex shrink-0 items-center gap-6 sm:gap-10">
          {STAT_COLS.map((c) => (
            <StatHeader key={c.key} short={c.short} long={c.long} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 border-b border-line bg-bg-secondary/40 px-4 py-2 lg:px-5">
        <p className="label flex-1 text-[10px] text-muted/70">Total</p>
        <StatGrid values={totals} />
      </div>
      {stint.seasons.map((s) => (
        <SeasonRow key={s.season} stats={s} />
      ))}
    </Card>
  )
}

export function DriverCareerView({
  career,
  onSelectConstructor,
}: {
  career: CareerResult<DriverCareer>
  onSelectConstructor: (constructorId: string) => void
}) {
  const { status, data, error, retry } = career

  if (status === 'loading' && data === null) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <TableSkeleton rows={6} cols={4} />
      </div>
    )
  }

  if (status === 'error' && error !== null && data === null) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <ErrorState onRetry={retry} />
      </div>
    )
  }

  if (!data || data.stints.length === 0) {
    return (
      <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-4 py-6">
        <p className="label text-text">Career</p>
        <p className="text-xs text-muted">No race history recorded for this driver.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="label text-text">Career</p>
        <p className="label text-[10px] text-muted/70">{data.stints.length} team stints</p>
      </div>
      {data.stints.map((stint) => (
        <StintCard key={`${stint.constructor.constructorId}-${stint.startSeason}`} stint={stint} onSelectConstructor={onSelectConstructor} />
      ))}
    </div>
  )
}