import type { RaceResultRow } from '../lib/types'
import { display, driverFullName, formatPoints, positionLabel } from '../lib/format'
import { teamColor } from '../lib/teamColors'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from './ErrorState'
import { DriverNumber } from './DriverNumber'

export function FastestLap({
  raceName,
  rows,
  loading,
  error,
  hasData,
  upcoming,
  onRetry,
}: {
  raceName: string | null
  rows: RaceResultRow[]
  loading: boolean
  error: Error | null
  hasData: boolean
  upcoming?: boolean
  onRetry: () => void
}) {
  if (loading && !hasData) {
    return (
      <Card className="rounded-lg border border-line bg-surface">
        <div className="space-y-3 px-6 py-6" aria-hidden="true">
          <Skeleton className="h-10 w-44 rounded-md" />
          <Skeleton className="h-5 w-32 rounded-md" />
        </div>
      </Card>
    )
  }
  if (error && !hasData) {
    return (
      <Card className="rounded-lg border border-line bg-surface">
        <ErrorState compact onRetry={onRetry} />
      </Card>
    )
  }

  const fl = rows.find((r) => r.fastestLap?.rank === 1) ?? null
  const flTime = fl?.fastestLap?.time
  const flColor = fl ? teamColor(fl.constructor.constructorId) : null

  return (
    <Card className="relative overflow-hidden rounded-lg border border-line bg-surface p-0">
      <div
        className="hero-wash-rule absolute inset-x-0 top-0 h-0.5"
        aria-hidden="true"
        style={flColor ? { background: flColor } : undefined}
      />
      {fl && flTime ? (
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-5 px-6 py-6 lg:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <Badge className="h-auto rounded-sm bg-accent px-2 py-1 text-[11px] font-bold tracking-[0.2em] text-bg">
                FL
              </Badge>
              <p className="label-lg text-muted">Fastest Lap</p>
            </div>
            <p className="mono-num mt-3 text-6xl leading-none font-bold tracking-tight text-text lg:text-7xl">
              {display(flTime)}
            </p>
            {raceName ? (
              <p className="label mt-2 text-[9px] text-muted/70">{display(raceName)}</p>
            ) : null}
          </div>
          <div className="min-w-0 text-left lg:text-right">
            <p className="truncate text-xl font-semibold tracking-wide text-text uppercase">
              <DriverNumber driver={fl.driver} className="text-base font-bold text-muted" /> {driverFullName(fl.driver)}
            </p>
            <p className="mt-0.5 flex items-center justify-start gap-1.5 truncate text-sm lg:justify-end">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: teamColor(fl.constructor.constructorId) }}
              />
              <span style={{ color: teamColor(fl.constructor.constructorId) }}>
                {display(fl.constructor.name)}
              </span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="h-auto gap-1 rounded-md border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-bold tracking-widest text-accent"
              >
                LAP {display(fl.fastestLap?.lap)}
              </Badge>
              <Badge
                variant="outline"
                className="h-auto rounded-md border-line bg-bg-secondary px-2.5 py-1 text-[11px] font-semibold tracking-widest text-muted"
              >
                {positionLabel(fl.position)}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'h-auto rounded-md border-line bg-bg-secondary px-2.5 py-1 text-[11px] font-semibold tracking-widest text-muted',
                )}
              >
                {formatPoints(fl.points)} PTS
              </Badge>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-6 py-8 text-sm text-muted">
          {upcoming ? 'Fastest lap data is not available yet.' : 'Fastest lap data not available.'}
        </div>
      )}
    </Card>
  )
}
