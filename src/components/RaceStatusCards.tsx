import type { ConstructorStandingRow, DriverStandingRow, Race, RaceResultRow } from '../lib/types'
import {
  display,
  driverCode,
  driverFullName,
  formatBroadcastDate,
  formatBroadcastTime,
  formatNumber,
  formatPoints,
  posTwo,
  roundLabel,
  splitGrandPrix,
} from '../lib/format'
import { teamColor } from '../lib/teamColors'
import { cn } from '@/lib/utils'
import type { CircuitTrack as Track } from '../lib/circuitTracks'
import { CircuitTrack } from './CircuitTrack'
import { WeekendSchedule } from './WeekendSchedule'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Countdown } from './Countdown'
import { RaceCardSkeleton } from './Skeleton'
import { DriverNumber } from './DriverNumber'

function PodiumRow({ result, position }: { result: RaceResultRow; position: number }) {
  const tone =
    position === 1 ? 'text-gold' : position === 2 ? 'text-silver' : position === 3 ? 'text-bronze' : 'text-muted'
  const gapOrTime = result.position === 1 ? result.time : result.gap
  return (
    <div
      className={`flex items-center gap-3 rounded border-b border-line/60 py-2 last:border-b-0 ${
        position === 1 ? 'border-l-2 border-l-gold bg-gold/[0.05] pl-2.5' : 'pl-4'
      }`}
    >
      <span className={`mono-num w-6 shrink-0 text-sm font-bold ${tone}`}>{posTwo(result.position)}</span>
      <span
        aria-hidden="true"
        className="h-4 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: teamColor(result.constructor.constructorId) }}
      />
      <span className="mono-num w-9 shrink-0 text-xs font-bold tracking-widest text-text">
        {driverCode(result.driver)}
      </span>
      <DriverNumber driver={result.driver} className="text-[11px] font-bold" />
      <span
        className="min-w-0 flex-1 truncate text-base"
        style={{ color: teamColor(result.constructor.constructorId) }}
      >
        {driverFullName(result.driver)}
      </span>
      {position === 1 ? (
        <Badge className="hidden h-auto shrink-0 rounded-sm border-gold/40 bg-gold/15 px-1.5 py-px text-[9px] font-bold tracking-[0.18em] text-gold sm:inline-flex">
          WINNER
        </Badge>
      ) : null}
      <span className={`mono-num shrink-0 text-xs ${position === 1 ? 'font-semibold text-gold' : 'text-muted'}`}>
        {display(gapOrTime)}
      </span>
    </div>
  )
}

function SeasonSummary({
  season,
  roundsCompleted,
  totalRounds,
  championDriver,
  championConstructor,
}: {
  season: string | null
  roundsCompleted: number | null
  totalRounds: number | null
  championDriver: DriverStandingRow | null
  championConstructor: ConstructorStandingRow | null
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <span className="label-lg text-text">Season Summary</span>
        <Badge className="h-auto rounded-sm bg-accent px-2 py-px text-xs font-bold tracking-[0.18em] text-bg">
          {display(season)}
        </Badge>
      </div>
      <div className="mt-4 grid flex-1 gap-4">
        <div className="rounded-md border border-line bg-bg/40 px-3 py-2.5">
          <p className="label text-[10px] text-muted/70">Champion Driver</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="truncate text-lg font-semibold text-gold">
              {championDriver ? driverFullName(championDriver.driver) : '—'}
            </p>
            <p className="mono-num shrink-0 text-sm font-bold text-text">
              {championDriver ? formatPoints(championDriver.points) : '—'} PTS
            </p>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs">
            {championDriver ? (
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: teamColor(championDriver.constructor.constructorId) }}
              />
            ) : null}
            <span
              className="truncate"
              style={{
                color: championDriver
                  ? teamColor(championDriver.constructor.constructorId)
                  : undefined,
              }}
            >
              {display(championDriver?.constructor.name)}
            </span>
            <span className="text-muted">· P1</span>
          </p>
        </div>
        <div className="rounded-md border border-line bg-bg/40 px-3 py-2.5">
          <p className="label text-[10px] text-muted/70">Champion Constructor</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1.5 truncate text-lg font-semibold text-text">
              {championConstructor ? (
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: teamColor(championConstructor.constructor.constructorId) }}
                />
              ) : null}
              <span
                className="truncate"
                style={{
                  color: championConstructor
                    ? teamColor(championConstructor.constructor.constructorId)
                    : undefined,
                }}
              >
                {display(championConstructor?.constructor.name)}
              </span>
            </p>
            <p className="mono-num shrink-0 text-sm font-bold text-text">
              {championConstructor ? formatPoints(championConstructor.points) : '—'} PTS
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="mono-num text-xs tracking-wider text-muted">
          R{formatNumber(roundsCompleted)} / {formatNumber(totalRounds)} ROUNDS
        </p>
        <Badge variant="outline" className="h-auto rounded-md border-line bg-bg/60 px-2 py-0.5 text-xs tracking-[0.18em] text-muted">
          SEASON COMPLETE
        </Badge>
      </div>
    </div>
  )
}

function ChampionshipStatus({
  roundsCompleted,
  totalRounds,
  nextRace,
  driverTop3,
  constructorTop3,
}: {
  roundsCompleted: number | null
  totalRounds: number | null
  nextRace: Race | null
  driverTop3: DriverStandingRow[]
  constructorTop3: ConstructorStandingRow[]
}) {
  const posCls = ['text-gold', 'text-silver', 'text-bronze']
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <span className="label-lg text-text">Championship Status</span>
        <Badge variant="outline" className="h-auto rounded-md border-line bg-bg/60 px-2 py-0.5 text-xs tracking-[0.18em] text-muted">
          R{formatNumber(roundsCompleted)} / {formatNumber(totalRounds)}
        </Badge>
      </div>

      <div className="mt-4">
        <p className="label text-[10px] text-muted/70">Top 3 Drivers</p>
        <div className="mt-1.5 overflow-hidden rounded-md border border-line">
          {driverTop3.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted">Standings unavailable.</p>
          ) : (
            driverTop3.map((row, i) => (
              <div
                key={row.driver.driverId}
                className={cn(
                  'flex items-center gap-2.5 border-b border-line/60 px-3 py-2 last:border-b-0',
                  i === 0 ? 'bg-gold/[0.05]' : '',
                )}
              >
                <span className={cn('mono-num w-5 shrink-0 text-sm font-bold', posCls[i] ?? 'text-muted')}>
                  {i + 1}
                </span>
                <span
                  aria-hidden="true"
                  className="h-4 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: teamColor(row.constructor.constructorId) }}
                />
                <DriverNumber driver={row.driver} className="text-[11px] font-bold" />
                <span className="min-w-0 flex-1 truncate text-sm text-text">{driverFullName(row.driver)}</span>
                <span className="mono-num shrink-0 text-xs font-semibold text-text">
                  {formatPoints(row.points)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="label text-[10px] text-muted/70">Top 3 Constructors</p>
        <div className="mt-1.5 overflow-hidden rounded-md border border-line">
          {constructorTop3.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted">Standings unavailable.</p>
          ) : (
            constructorTop3.map((row, i) => (
              <div
                key={row.constructor.constructorId}
                className="flex items-center gap-2.5 border-b border-line/60 px-3 py-2 last:border-b-0"
              >
                <span className={cn('mono-num w-5 shrink-0 text-sm font-bold', posCls[i] ?? 'text-muted')}>
                  {i + 1}
                </span>
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: teamColor(row.constructor.constructorId) }}
                />
                <span className="min-w-0 flex-1 truncate text-sm" style={{ color: teamColor(row.constructor.constructorId) }}>
                  {display(row.constructor.name)}
                </span>
                <span className="mono-num shrink-0 text-xs font-semibold text-text">
                  {formatPoints(row.points)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
        <p className="label text-[10px] text-muted/70">Next Round</p>
        <p className="mono-num truncate text-xs text-text">
          {roundLabel(nextRace?.round ?? null)} · {display(nextRace?.raceName)}
        </p>
      </div>
    </div>
  )
}

export function RaceStatusCards({
  featuredRace,
  featuredResults,
  featuredRound,
  nextRace,
  seasonComplete,
  season,
  roundsCompleted,
  totalRounds,
  championDriver,
  championConstructor,
  loading,
  featuredTrack,
  nextTrack,
  driverRows,
  constructorRows,
}: {
  featuredRace: Race | null
  featuredResults: RaceResultRow[]
  featuredRound: number | null
  nextRace: Race | null
  seasonComplete: boolean
  season: string | null
  roundsCompleted: number | null
  totalRounds: number | null
  championDriver: DriverStandingRow | null
  championConstructor: ConstructorStandingRow | null
  loading: boolean
  featuredTrack: Track | null
  nextTrack: Track | null
  driverRows: DriverStandingRow[]
  constructorRows: ConstructorStandingRow[]
}) {
  if (loading && !featuredRace) {
    return (
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="rounded-lg lg:col-span-3">
          <RaceCardSkeleton />
        </Card>
        <Card className="rounded-lg lg:col-span-2">
          <RaceCardSkeleton />
        </Card>
      </div>
    )
  }

  const podium = featuredResults.slice(0, 3)
  const hasResults = featuredResults.length > 0
  const name = splitGrandPrix(featuredRace?.raceName)
  const isFeaturedNext = nextRace !== null && featuredRound === nextRace.round
  const driverTop3 = driverRows.slice(0, 3)
  const constructorTop3 = constructorRows.slice(0, 3)

  return (
    <Card className="rounded-lg p-0 gap-0">
      <div className="grid min-w-0 lg:grid-cols-5">
        {/* FEATURED RACE — dominant panel */}
        <div className="hero-wash relative min-w-0 lg:col-span-3">
          <div className="hero-wash-rule absolute inset-x-0 top-0 h-0.5" aria-hidden="true" />
          {featuredRace ? (
            <div className="relative px-6 py-6 lg:px-8 lg:py-7">
              <span
                aria-hidden="true"
                className="mono-num pointer-events-none absolute -top-1 right-2 select-none text-[7rem] font-black leading-none tracking-tighter text-text/[0.04] lg:right-4 lg:text-[9.5rem]"
              >
                {featuredRound !== null ? String(featuredRound) : ''}
              </span>
              <div className="relative flex items-center justify-between gap-3">
                <span className="label-lg text-muted">
                  {hasResults ? 'Race Result' : isFeaturedNext ? 'Next Event' : 'Upcoming Round'}
                </span>
                <Badge
                  variant="outline"
                  className="h-auto rounded-md border-line bg-bg/60 px-2 py-0.5 text-xs tracking-[0.18em] text-muted"
                >
                  {roundLabel(featuredRound)}
                </Badge>
              </div>
              <h2 className="relative mt-4 text-3xl leading-[0.95] font-semibold tracking-tight text-text uppercase sm:text-4xl lg:text-5xl xl:text-6xl">
                {name.line1}
                {name.line2 ? (
                  <>
                    <br />
                    <span className="text-text/70">{name.line2}</span>
                  </>
                ) : null}
              </h2>
              <div className="relative mt-3 flex items-end justify-between gap-4">
                <p className="min-w-0 truncate text-sm text-muted">
                  {display(featuredRace.circuitName)}
                  {featuredRace.country ? ` · ${display(featuredRace.country)}` : ''}
                </p>
                {featuredTrack ? (
                  <div className="shrink-0 rounded-md border border-line bg-bg/40 p-1.5">
                    <CircuitTrack track={featuredTrack} className="h-20 w-28 sm:h-24 sm:w-36" />
                  </div>
                ) : null}
              </div>
              <div className="relative mt-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
                {hasResults ? (
                  <div>
                    <p className="label text-muted/70">Race Date</p>
                    <p className="mono-num mt-1 text-lg font-semibold text-text">
                      {formatBroadcastDate(featuredRace.start)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="label text-muted/70">Race Start</p>
                    <p className="mono-num mt-1 text-lg font-semibold text-text">
                      {formatBroadcastDate(featuredRace.start)} · {formatBroadcastTime(featuredRace.start)}
                    </p>
                  </div>
                )}
                {!hasResults ? <Countdown target={featuredRace.start} large /> : null}
              </div>
              {hasResults ? (
                <>
                  <Separator className="mt-4 bg-line" />
                  <div className="mt-2">
                    {podium.length > 0 ? (
                      podium.map((r) => <PodiumRow key={r.position} result={r} position={r.position} />)
                    ) : (
                      <p className="py-2 text-xs text-muted">Podium data unavailable.</p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center px-6 text-sm text-muted">
              No race data available for this selection.
            </div>
          )}
        </div>

        {/* RIGHT — context panel */}
        <div className="min-w-0 border-t border-line bg-surface px-6 py-6 lg:col-span-2 lg:border-l lg:border-t-0 lg:px-7">
          {seasonComplete ? (
            <SeasonSummary
              season={season}
              roundsCompleted={roundsCompleted}
              totalRounds={totalRounds}
              championDriver={championDriver}
              championConstructor={championConstructor}
            />
          ) : hasResults && nextRace ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-3">
                <span className="label-lg text-muted">Next Event</span>
                <Badge
                  variant="outline"
                  className="h-auto rounded-md border-line bg-bg/60 px-2 py-0.5 text-xs tracking-[0.18em] text-muted"
                >
                  {roundLabel(nextRace.round)}
                </Badge>
              </div>
              <h3 className="mt-3 text-xl leading-tight font-semibold tracking-tight text-text uppercase">
                {splitGrandPrix(nextRace.raceName).line1}
                {splitGrandPrix(nextRace.raceName).line2 ? (
                  <span className="text-text/70"> {splitGrandPrix(nextRace.raceName).line2}</span>
                ) : null}
              </h3>
              <p className="mt-1 truncate text-xs text-muted">
                {display(nextRace.circuitName)} · {display(nextRace.country)}
              </p>
              <p className="mono-num mt-1 text-xs tracking-wider text-muted">
                {formatBroadcastDate(nextRace.start)} · {formatBroadcastTime(nextRace.start)}
              </p>
              {nextTrack ? (
                <div className="mt-4 rounded-md border border-line bg-bg/40 px-4 py-3">
                  <CircuitTrack track={nextTrack} className="h-24 w-full sm:h-28" />
                  <p className="mono-num mt-1.5 text-center text-[9px] tracking-[0.2em] text-muted/70">
                    {nextTrack.name.toUpperCase()}
                  </p>
                </div>
              ) : null}
              <div className="mt-4">
                <WeekendSchedule race={nextRace} compact />
              </div>
              <div className="mt-auto pt-5">
                <Countdown target={nextRace.start} />
              </div>
            </div>
          ) : (
            <ChampionshipStatus
              roundsCompleted={roundsCompleted}
              totalRounds={totalRounds}
              nextRace={nextRace}
              driverTop3={driverTop3}
              constructorTop3={constructorTop3}
            />
          )}
        </div>
      </div>
    </Card>
  )
}