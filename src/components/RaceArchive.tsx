import type { Race, SeasonRoundResults } from '../lib/types'
import { display, driverCode, raceDateRange } from '../lib/format'
import { countryFlag } from '../lib/flags'
import { cn } from '@/lib/utils'
import { TableSkeleton } from './Skeleton'
import { ErrorState } from './ErrorState'

const PODIUM_TONES = ['text-gold', 'text-silver', 'text-bronze']

export function RaceArchive({
  calendar,
  rounds,
  loading,
  error,
  onRetry,
  onSelectRace,
}: {
  calendar: Race[]
  rounds: SeasonRoundResults[]
  loading: boolean
  error: Error | null
  onRetry: () => void
  onSelectRace: (round: number) => void
}) {
  if (loading && rounds.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <TableSkeleton rows={7} cols={4} />
      </div>
    )
  }
  if (error && rounds.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <ErrorState compact onRetry={onRetry} />
      </div>
    )
  }

  const byRound = new Map(rounds.map((r) => [r.round, r]))
  const entries = calendar
    .filter((race) => byRound.has(race.round))
    .map((race) => ({ race, results: byRound.get(race.round)!.results }))

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-4 py-6">
        <p className="label text-text">Race Archive</p>
        <p className="text-xs text-muted">No completed races yet for this season.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <ul className="divide-y divide-line">
        {entries.map(({ race, results }) => {
          const flag = countryFlag(race.country)
          const podium = results.slice(0, 3)
          return (
            <li key={race.round}>
              <button
                type="button"
                onClick={() => onSelectRace(race.round)}
                className="group flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-left transition-colors duration-150 hover:bg-surface-2/60 sm:gap-4 sm:px-4"
              >
                <span className="mono-num shrink-0 text-sm text-muted">{String(race.round).padStart(2, '0')}</span>
                <span className="shrink-0 text-base leading-none" aria-hidden="true">
                  {flag ?? ''}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium tracking-wide text-text">
                    {display(race.raceName)}
                  </span>
                  <span className="label mt-0.5 block text-[11px] text-muted">
                    {raceDateRange(race)}
                  </span>
                </span>
                <span className="hidden items-center gap-2.5 sm:flex">
                  {podium.map((row, i) => (
                    <span
                      key={row.driver.driverId}
                      className="flex items-center gap-1 mono-num text-sm"
                    >
                      <span className={cn('font-bold', PODIUM_TONES[i])}>P{i + 1}</span>
                      <span className="text-text">{driverCode(row.driver)}</span>
                    </span>
                  ))}
                </span>
                <span className="flex items-center gap-2.5 sm:hidden">
                  {podium.map((row, i) => (
                    <span
                      key={row.driver.driverId}
                      className={cn('mono-num text-sm font-bold', PODIUM_TONES[i])}
                    >
                      {driverCode(row.driver)}
                    </span>
                  ))}
                </span>
                <span
                  aria-hidden="true"
                  className="text-muted/50 transition-colors duration-150 group-hover:text-accent"
                >
                  ›
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}