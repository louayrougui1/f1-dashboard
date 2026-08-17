import { display, formatNumber } from '../lib/format'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

function Stat({
  label,
  value,
  sub,
  accent = false,
  hairline = false,
  tag,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
  hairline?: boolean
  tag?: string
}) {
  return (
    <div className={cn('min-w-[7.5rem] flex-1 bg-surface px-4 py-3', hairline && 'border-l-2 border-l-accent pl-3.5')}>
      <p className="label text-[10px] text-muted/70">{label}</p>
      <p className={cn('mt-1 flex items-center gap-1.5 truncate text-base font-semibold', accent ? 'text-accent' : 'text-text')}>
        {tag ? (
          <Badge className="h-auto shrink-0 rounded-sm bg-accent px-1.5 py-px text-[10px] font-bold tracking-[0.18em] text-bg">
            {tag}
          </Badge>
        ) : null}
        <span className="mono-num truncate">{value}</span>
      </p>
      {sub ? <p className="mt-0.5 truncate text-[11px] text-muted">{sub}</p> : null}
    </div>
  )
}

function SeasonProgress({ rounds, completed }: { rounds: number | null; completed: number | null }) {
  if (rounds === null || completed === null) return null
  const pct = Math.max(2, (completed / rounds) * 100)
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line bg-bg-secondary/40 px-4 py-3">
      <span className="label text-[10px] text-muted/70">Season Progress</span>
      <Progress
        value={pct}
        className="h-1 min-w-[8rem] flex-1 bg-bg-secondary"
        aria-label={`Season progress ${formatNumber(completed)} of ${formatNumber(rounds)} rounds completed`}
      />
      <Badge className="h-auto rounded-sm bg-accent px-2 py-px text-xs font-bold tracking-[0.18em] text-bg">
        R{formatNumber(completed)} / {formatNumber(rounds)}
      </Badge>
    </div>
  )
}

export function StatStrip({
  season,
  rounds,
  completed,
  raceRound,
  nextRound,
  winner,
  fastestLap,
  leader,
  leaderPoints,
}: {
  season: string | null
  rounds: number | null
  completed: number | null
  raceRound: string | null
  nextRound: string | null
  winner: string | null
  fastestLap: string | null
  leader: string | null
  leaderPoints: string | null
}) {
  return (
    <Card className="rounded-lg p-0 gap-0">
      <div className="flex flex-wrap gap-px bg-line">
        <Stat label="Season" value={display(season ?? '—')} hairline />
        <Stat label="Rounds" value={display(rounds ?? '—')} />
        <Stat label="Completed" value={display(completed ?? '—')} />
        <Stat label="Next Round" value={display(nextRound ?? '—')} />
        <Stat label={`Race P1 · ${display(raceRound ?? '—')}`} value={display(winner ?? '—')} />
        <Stat label={`Fastest Lap · ${display(raceRound ?? '—')}`} value={display(fastestLap ?? '—')} accent />
        <Stat label="Points Leader" value={display(leader ?? '—')} tag="P1" sub={leaderPoints ? `${leaderPoints} PTS` : undefined} />
      </div>
      <SeasonProgress rounds={rounds} completed={completed} />
    </Card>
  )
}