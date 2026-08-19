import type { ConstructorStandingRow, DriverStandingRow, Race, SeasonRoundResults } from '../lib/types'
import { display } from '../lib/format'
import { DriverTable, ConstructorTable } from './Standings'
import { Progression } from './Progression'
import { HeadToHead } from './HeadToHead'
import { RaceArchive } from './RaceArchive'
import { WatchLive } from './WatchLive'
import { SectionHeading } from './Card'

export function StandingsPage({
  season,
  drivers,
  driverLoading,
  driverError,
  onRetryDrivers,
  constructors,
  constructorLoading,
  constructorError,
  onRetryConstructors,
  calendar,
  rounds,
  roundsLoading,
  roundsError,
  onRetryRounds,
  onSelectDriver,
  onSelectConstructor,
  onSelectRace,
}: {
  season: string | null
  drivers: DriverStandingRow[]
  driverLoading: boolean
  driverError: Error | null
  onRetryDrivers: () => void
  constructors: ConstructorStandingRow[]
  constructorLoading: boolean
  constructorError: Error | null
  onRetryConstructors: () => void
  calendar: Race[]
  rounds: SeasonRoundResults[]
  roundsLoading: boolean
  roundsError: Error | null
  onRetryRounds: () => void
  onSelectDriver?: (driverId: string) => void
  onSelectConstructor?: (constructorId: string) => void
  onSelectRace: (round: number) => void
}) {
  const meta = `${display(season)} · All Positions`

  return (
    <div className="space-y-10">
      <section id="drivers" aria-label="Driver standings" className="scroll-mt-14">
        <SectionHeading label="Driver Standings" meta={meta} />
        <div className="mt-3">
          <DriverTable
            rows={drivers}
            limit={drivers.length || undefined}
            loading={driverLoading}
            error={driverError}
            onRetry={onRetryDrivers}
            onSelectDriver={onSelectDriver}
          />
        </div>
      </section>

      <section id="constructors" aria-label="Constructor standings" className="scroll-mt-14">
        <SectionHeading label="Constructor Standings" meta={meta} />
        <div className="mt-3">
          <ConstructorTable
            rows={constructors}
            limit={constructors.length || undefined}
            loading={constructorLoading}
            error={constructorError}
            onRetry={onRetryConstructors}
            onSelectConstructor={onSelectConstructor}
          />
        </div>
      </section>

      <section id="progression" aria-label="Championship progression" className="scroll-mt-14">
        <SectionHeading label="Championship Progression" meta={`${display(season)} · Cumulative`} />
        <div className="mt-3">
          <Progression
            rounds={rounds}
            loading={roundsLoading}
            error={roundsError}
            onRetry={onRetryRounds}
          />
        </div>
      </section>

      <section id="headtohead" aria-label="Head to head" className="scroll-mt-14">
        <SectionHeading label="Head-to-Head" meta={`${display(season)} · Teammates`} />
        <div className="mt-3">
          <HeadToHead
            rounds={rounds}
            drivers={drivers}
            loading={roundsLoading}
            error={roundsError}
            onRetry={onRetryRounds}
            onSelectDriver={onSelectDriver}
          />
        </div>
      </section>

      <section id="races" aria-label="Race archive" className="scroll-mt-14">
        <SectionHeading label="Race Archive" meta={`${display(season)} · Completed`} />
        <div className="mt-3">
          <RaceArchive
            calendar={calendar}
            rounds={rounds}
            loading={roundsLoading}
            error={roundsError}
            onRetry={onRetryRounds}
            onSelectRace={onSelectRace}
          />
        </div>
      </section>

      <section id="watchlive" aria-label="Watch live" className="scroll-mt-14">
        <SectionHeading label="Watch" meta="Live F1 streams" />
        <div className="mt-3">
          <WatchLive />
        </div>
      </section>
    </div>
  )
}