import type { ConstructorStandingRow, DriverStandingRow, RaceDetail } from '../lib/types'
import { display, roundLabel } from '../lib/format'
import { DriverTable, ConstructorTable } from './Standings'
import { LastRaceResults } from './LastRaceResults'
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
  featuredDetail,
  featuredRound,
  resultsLoading,
  resultsError,
  onRetryResults,
  onPrev,
  onNext,
  canPrev,
  canNext,
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
  featuredDetail: RaceDetail | null
  featuredRound: number | null
  resultsLoading: boolean
  resultsError: Error | null
  onRetryResults: () => void
  onPrev?: () => void
  onNext?: () => void
  canPrev?: boolean
  canNext?: boolean
}) {
  const results = featuredDetail?.results ?? []
  const meta = `${display(season)} · All Positions`

  return (
    <div className="space-y-10">
      <section>
        <SectionHeading label="Driver Standings" meta={meta} />
        <div className="mt-3">
          <DriverTable
            rows={drivers}
            limit={drivers.length || undefined}
            loading={driverLoading}
            error={driverError}
            onRetry={onRetryDrivers}
          />
        </div>
      </section>

      <section>
        <SectionHeading label="Constructor Standings" meta={meta} />
        <div className="mt-3">
          <ConstructorTable
            rows={constructors}
            limit={constructors.length || undefined}
            loading={constructorLoading}
            error={constructorError}
            onRetry={onRetryConstructors}
          />
        </div>
      </section>

      <section>
        <SectionHeading
          label="Race Results"
          meta={featuredRound !== null ? `${roundLabel(featuredRound)} · Full Grid` : undefined}
        />
        <div className="mt-3">
          <LastRaceResults
            raceName={featuredDetail?.race.raceName ?? null}
            round={featuredDetail?.round ?? featuredRound}
            rows={results}
            maxRows={results.length || undefined}
            loading={resultsLoading}
            error={resultsError}
            hasData={results.length > 0}
            onRetry={onRetryResults}
            onPrev={onPrev}
            onNext={onNext}
            canPrev={canPrev}
            canNext={canNext}
          />
        </div>
      </section>
    </div>
  )
}