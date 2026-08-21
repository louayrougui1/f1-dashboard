import { useMemo } from 'react'
import type { Race, SeasonRoundResults } from '../lib/types'
import { display, raceDateRange, roundLabel } from '../lib/format'
import { countryFlag } from '../lib/flags'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from './Skeleton'
import { ErrorState } from './ErrorState'
import { LastRaceResults } from './LastRaceResults'

export function RacePage({
  round,
  seasonLabel,
  calendar,
  rounds,
  roundsLoading,
  roundsError,
  onRetryRounds,
  onBack,
}: {
  round: number
  seasonLabel: string | null
  calendar: Race[]
  rounds: SeasonRoundResults[]
  roundsLoading: boolean
  roundsError: Error | null
  onRetryRounds: () => void
  onBack: () => void
}) {
  const race = useMemo(() => calendar.find((r) => r.round === round) ?? null, [calendar, round])
  const result = useMemo(() => rounds.find((r) => r.round === round) ?? null, [rounds, round])
  const results = result?.results ?? []
  const flag = race ? countryFlag(race.country) : null

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
              <span className="label text-[11px] text-muted/70">Race Result</span>
              <span className="label text-[11px] text-muted/70">{display(seasonLabel)}</span>
            </div>
            <h1 className="mt-1 flex min-w-0 items-center gap-3 text-3xl leading-tight font-semibold tracking-tight text-text uppercase sm:text-4xl">
              {flag ? (
                <span className="shrink-0 text-2xl leading-none sm:text-3xl" aria-hidden="true">
                  {flag}
                </span>
              ) : null}
              <span className="truncate">{display(race?.raceName)}</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <Badge className="h-auto rounded-sm border-line bg-bg/60 px-1.5 py-px mono-num text-[11px] tracking-[0.18em]">
                {roundLabel(round)}
              </Badge>
              {race ? (
                <>
                  <span>{display(race.circuitName)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{raceDateRange(race)}</span>
                </>
              ) : null}
            </div>
          </div>
          {result ? (
            <div className="flex shrink-0 items-end gap-6 sm:flex-col sm:items-end sm:gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gold">P1</span>
                <span className="label text-[11px] text-muted/70">WINNER</span>
              </div>
              <div>
                <p className="mono-num text-xl font-semibold text-text">
                  {results[0] ? display(results[0].driver.code) : '—'}
                </p>
                <p className="label text-[11px] text-muted/70">Code</p>
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
      ) : !result ? (
        <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-4 py-6">
          <p className="label text-text">Race Results</p>
          <p className="text-xs text-muted">No results available for this round yet.</p>
        </div>
      ) : (
        <LastRaceResults
          raceName={race?.raceName ?? null}
          round={round}
          rows={results}
          maxRows={results.length || undefined}
          loading={false}
          error={null}
          hasData={results.length > 0}
          upcoming={false}
          onRetry={onRetryRounds}
        />
      )}
    </div>
  )
}