import type { Race, RaceResultRow } from '../lib/types'
import type { CircuitTrack as Track } from '../lib/circuitTracks'
import { display, formatBroadcastDate, formatBroadcastTime, formatNumber, roundLabel } from '../lib/format'
import { CircuitTrack } from './CircuitTrack'
import { WeekendSchedule } from './WeekendSchedule'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function km(value: number | null | undefined): string {
  if (!value || value <= 0) return '—'
  return `${(value / 1000).toFixed(3)} km`
}

export function Circuit({
  race,
  track,
  rows,
}: {
  race: Race | null
  track: Track | null
  rows: RaceResultRow[]
}) {
  if (!race) {
    return (
      <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-4 py-6">
        <p className="label text-text">Circuit</p>
        <p className="text-xs text-muted">No race data available for this selection.</p>
      </div>
    )
  }

  const winnerLaps = rows[0]?.laps ?? null
  const raceDistance = winnerLaps && track?.lengthM ? (winnerLaps * track.lengthM) / 1000 : null

  return (
    <Card className="rounded-lg p-0 gap-0">
      <div className="grid min-w-0 lg:grid-cols-5">
        <div className="hero-wash relative flex min-w-0 flex-col items-center justify-center px-6 py-8 lg:col-span-3 lg:px-10">
          <div className="hero-wash-rule absolute inset-x-0 top-0 h-0.5" aria-hidden="true" />
          <div className="w-full max-w-md">
            <CircuitTrack track={track} className="h-56 sm:h-72" />
          </div>
          {track ? (
            <p className="mono-num mt-3 text-[10px] tracking-[0.2em] text-muted/70">
              {track.name.toUpperCase()} · {km(track.lengthM)}
            </p>
          ) : (
            <p className="label mt-3 text-[10px] text-muted/70">Track map unavailable for this circuit</p>
          )}
        </div>

        <div className="min-w-0 border-t border-line bg-surface px-6 py-6 lg:col-span-2 lg:border-l lg:border-t-0 lg:px-7">
          <div className="flex items-center justify-between gap-3">
            <span className="label-lg text-accent">Circuit</span>
            <Badge
              variant="outline"
              className="h-auto rounded-md border-line bg-bg/60 px-2 py-0.5 text-xs tracking-[0.18em] text-muted"
            >
              {roundLabel(race.round)}
            </Badge>
          </div>
          <h3 className="mt-3 text-2xl leading-tight font-semibold tracking-tight text-text uppercase sm:text-3xl">
            {display(race.circuitName)}
          </h3>
          <p className="mt-1 truncate text-xs text-muted">
            {display(race.locality)}
            {race.country ? ` · ${display(race.country)}` : ''}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-md border border-line bg-bg/40 px-3 py-2.5">
              <p className="label text-[10px] text-muted/70">Circuit Length</p>
              <p className="mono-num mt-1 text-base font-semibold text-text">{km(track?.lengthM)}</p>
            </div>
            <div className="rounded-md border border-line bg-bg/40 px-3 py-2.5">
              <p className="label text-[10px] text-muted/70">Total Laps</p>
              <p className="mono-num mt-1 text-base font-semibold text-text">{formatNumber(winnerLaps)}</p>
            </div>
            <div className="rounded-md border border-line bg-bg/40 px-3 py-2.5">
              <p className="label text-[10px] text-muted/70">Race Distance</p>
              <p className="mono-num mt-1 text-base font-semibold text-text">
                {raceDistance !== null ? `${raceDistance.toFixed(3)} km` : '—'}
              </p>
            </div>
            <div className="rounded-md border border-line bg-bg/40 px-3 py-2.5">
              <p className="label text-[10px] text-muted/70">Race Date</p>
              <p className="mono-num mt-1 text-base font-semibold text-text">
                {formatBroadcastDate(race.start)}
                {race.start ? <span className="text-muted"> · {formatBroadcastTime(race.start)}</span> : null}
              </p>
            </div>
          </div>
        </div>
      </div>
      <WeekendSchedule race={race} />
    </Card>
  )
}