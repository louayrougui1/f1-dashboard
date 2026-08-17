import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Race } from '../lib/types'
import { display } from '../lib/format'

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

export function SeasonRoundControls({
  seasonId,
  seasonYears,
  currentSeason,
  round,
  lastRace,
  calendar,
  onSeasonChange,
  onRoundChange,
}: {
  seasonId: string
  seasonYears: string[]
  currentSeason: string | null
  round: number | null
  lastRace: Race | null
  calendar: Race[]
  onSeasonChange: (season: string) => void
  onRoundChange: (round: number | null) => void
}) {
  const yearOptions = seasonYears.filter((y) => y !== 'current')
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Select value={seasonId} onValueChange={onSeasonChange}>
        <SelectTrigger
          size="sm"
          aria-label="Select season"
          className="h-8 max-w-[7.5rem] border-line bg-surface px-2.5 text-xs text-text hover:border-accent/60 lg:max-w-none"
        >
          <SelectValue placeholder="Season" />
        </SelectTrigger>
        <SelectContent align="end" className="max-h-72 border-line bg-surface">
          <SelectItem value="current">
            <span className="sm:hidden">{display(currentSeason)}</span>
            <span className="hidden sm:inline">{display(currentSeason)} · CURRENT</span>
          </SelectItem>
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
          className="h-8 max-w-[6.5rem] border-line bg-surface px-2.5 text-xs text-text hover:border-accent/60 sm:max-w-[9rem]"
        >
          <SelectValue placeholder="Round" />
        </SelectTrigger>
        <SelectContent align="end" className="max-h-72 border-line bg-surface">
          <SelectItem value="latest">
            {lastRace ? (
              <>
                <span className="sm:hidden">{roundCode(lastRace.round)}</span>
                <span className="hidden sm:inline">
                  {roundCode(lastRace.round)} · {shortName(lastRace)}
                </span>
              </>
            ) : (
              'LATEST'
            )}
          </SelectItem>
          {calendar.map((r) => (
            <SelectItem key={r.round} value={String(r.round)}>
              <span className="sm:hidden">{roundCode(r.round)}</span>
              <span className="hidden sm:inline">
                {roundCode(r.round)} · {shortName(r)}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}