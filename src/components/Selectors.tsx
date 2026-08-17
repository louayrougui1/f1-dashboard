import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Race } from '../lib/types'
import { display } from '../lib/format'
import { cn } from '@/lib/utils'

function shortName(race: Race | null | undefined): string {
  const name = display(race?.raceName)
  if (name === 'N/A') return 'LATEST'
  const idx = name.toUpperCase().indexOf('GRAND PRIX')
  if (idx > 0) return name.slice(0, idx).trim()
  return name
}

function roundCode(round: number): string {
  return `R${String(round).padStart(2, '0')}`
}

function RoundDot({ tone }: { tone: 'last' | 'next' | null }) {
  if (!tone) return null
  return (
    <span
      aria-hidden="true"
      className={cn(
        'h-1.5 w-1.5 shrink-0 rounded-full',
        tone === 'next' ? 'bg-accent ring-1 ring-accent/50' : 'bg-gold',
      )}
    />
  )
}

export function SeasonRoundControls({
  seasonId,
  seasonYears,
  currentSeason,
  round,
  lastRace,
  nextRace,
  calendar,
  onSeasonChange,
  onRoundChange,
}: {
  seasonId: string
  seasonYears: string[]
  currentSeason: string | null
  round: number | null
  lastRace: Race | null
  nextRace: Race | null
  calendar: Race[]
  onSeasonChange: (season: string) => void
  onRoundChange: (round: number | null) => void
}) {
  const yearOptions = seasonYears.filter((y) => y !== 'current' && y !== currentSeason)
  const lastRound = lastRace?.round ?? null
  const nextRound = nextRace?.round ?? null
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Select value={seasonId} onValueChange={onSeasonChange}>
        <SelectTrigger
          size="sm"
          aria-label="Select season"
          className="h-8 max-w-[7.5rem] border-line bg-surface px-2.5 text-sm text-text hover:border-accent/60 lg:max-w-none"
        >
          <SelectValue placeholder="Season" />
        </SelectTrigger>
        <SelectContent align="end" className="max-h-72 border-line bg-surface">
          <SelectItem value="current">{display(currentSeason) || 'CURRENT'}</SelectItem>
          {yearOptions.map((y) => (
            <SelectItem key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={round === null ? 'latest' : String(round)} onValueChange={(v) => onRoundChange(v === 'latest' ? null : Number(v))}>
        <SelectTrigger
          size="sm"
          aria-label="Select round"
          className="h-8 max-w-[6.5rem] border-line bg-surface px-2.5 text-sm text-text hover:border-accent/60 sm:max-w-[9rem]"
        >
          {round === null ? (
            <span className="truncate">
              {lastRace ? `${roundCode(lastRace.round)} · ${shortName(lastRace)}` : 'LATEST'}
            </span>
          ) : (
            <SelectValue placeholder="Round" />
          )}
        </SelectTrigger>
        <SelectContent align="end" className="max-h-72 border-line bg-surface">
          <SelectItem value="latest">
            <span className="flex items-center gap-1.5">
              <RoundDot tone={null} />
              LATEST
            </span>
          </SelectItem>
          {calendar.map((r) => {
            const tone = r.round === nextRound ? 'next' : r.round === lastRound ? 'last' : null
            return (
              <SelectItem
                key={r.round}
                value={String(r.round)}
                title={
                  tone === 'next'
                    ? `${display(r.raceName)} — next race`
                    : tone === 'last'
                      ? `${display(r.raceName)} — last completed race`
                      : display(r.raceName)
                }
              >
                <span className="flex items-center gap-1.5">
                  <RoundDot tone={tone} />
                  <span className="sm:hidden">{roundCode(r.round)}</span>
                  <span className="hidden sm:inline">
                    {roundCode(r.round)} · {shortName(r)}
                  </span>
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}