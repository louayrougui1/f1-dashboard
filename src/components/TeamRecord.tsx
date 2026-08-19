import type { RecordSeason } from '../lib/types'
import type { ConstructorRecord } from '../lib/types'
import type { CareerResult } from '../lib/useCareer'
import { positionLabel } from '../lib/format'
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

function ChampMark({ position }: { position: number | null }) {
  if (position === null || position <= 0) {
    return <span className="mono-num text-xs text-muted/60">—</span>
  }
  const cls =
    position === 1
      ? 'text-gold'
      : position === 2
        ? 'text-silver'
        : position === 3
          ? 'text-bronze'
          : 'text-text'
  return <span className={cn('mono-num text-xs font-bold', cls)}>{positionLabel(position)}</span>
}

function StatHeader({ short, long }: { short: string; long: string }) {
  return (
    <span className="label w-7 shrink-0 text-right text-[10px] text-muted/70">
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{long}</span>
    </span>
  )
}

function StatValues({ values }: { values: [number, number, number, number] }) {
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

function SeasonRow({ season }: { season: RecordSeason }) {
  const rowTone =
    season.championshipPosition === 1
      ? 'bg-gold/[0.06]'
      : season.championshipPosition === 2
        ? 'bg-silver/[0.06]'
        : season.championshipPosition === 3
          ? 'bg-bronze/[0.06]'
          : ''
  return (
    <div className={cn('flex items-center gap-2 border-b border-line/60 px-4 py-2.5 last:border-b-0 sm:gap-3 lg:px-5', rowTone)}>
      <span className="mono-num w-14 shrink-0 text-xs font-semibold text-text">{season.season}</span>
      <span className="w-12 shrink-0 sm:w-20">
        <ChampMark position={season.championshipPosition} />
      </span>
      <div className="flex-1" />
      <StatValues values={[season.races, season.podiums, season.wins, season.poles]} />
    </div>
  )
}

export function TeamRecordView({ record }: { record: CareerResult<ConstructorRecord> }) {
  const { status, data, error, retry } = record

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

  if (!data || data.seasons.length === 0) {
    return (
      <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-4 py-6">
        <p className="label text-text">Championship Record</p>
        <p className="text-xs text-muted">No seasons recorded for this constructor.</p>
      </div>
    )
  }

  const totals: [number, number, number, number] = [
    data.seasons.reduce((s, x) => s + x.races, 0),
    data.seasons.reduce((s, x) => s + x.podiums, 0),
    data.seasons.reduce((s, x) => s + x.wins, 0),
    data.seasons.reduce((s, x) => s + x.poles, 0),
  ]

  return (
    <Card className="rounded-lg p-0 gap-0">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2 sm:gap-3 lg:px-5">
        <span className="label w-14 shrink-0 text-[10px] text-muted/70">
          <span className="sm:hidden">YR</span>
          <span className="hidden sm:inline">Season</span>
        </span>
        <span className="label w-12 shrink-0 text-[10px] text-muted/70 sm:w-20">Pos</span>
        <div className="flex-1" />
        <div className="flex shrink-0 items-center gap-6 sm:gap-10">
          {STAT_COLS.map((c) => (
            <StatHeader key={c.key} short={c.short} long={c.long} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 border-b border-line bg-bg-secondary/40 px-4 py-2.5 sm:gap-3 lg:px-5">
        <span className="label w-14 shrink-0 text-[10px] text-muted/70">Total</span>
        <span className="w-12 shrink-0 sm:w-20">
          <span className="mono-num text-xs text-muted/60">—</span>
        </span>
        <div className="flex-1" />
        <StatValues values={totals} />
      </div>
      {data.seasons.map((s) => (
        <SeasonRow key={s.season} season={s} />
      ))}
    </Card>
  )
}