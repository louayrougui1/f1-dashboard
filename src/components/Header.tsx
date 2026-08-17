import { Menu, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatLastUpdated } from '../lib/format'
import { NAV_GROUPS } from '../lib/nav'
import { SeasonRoundControls } from './Selectors'
import type { Race } from '../lib/types'

export function viewLabel(activeId: string): string {
  for (const g of NAV_GROUPS) {
    const found = g.items.find((i) => i.id === activeId)
    if (found) return found.label.toUpperCase()
  }
  if (activeId === 'standings') return 'STANDINGS'
  if (activeId === 'driver') return 'DRIVER'
  if (activeId === 'team') return 'TEAM'
  return 'OVERVIEW'
}

export function TopBar({
  activeId,
  lastUpdated,
  refreshing,
  onRefresh,
  onOpenNav,
  seasonId,
  seasonYears,
  currentSeason,
  round,
  lastRace,
  calendar,
  onSeasonChange,
  onRoundChange,
}: {
  activeId: string
  lastUpdated: Date | null
  refreshing: boolean
  onRefresh: () => void
  onOpenNav: () => void
  seasonId: string
  seasonYears: string[]
  currentSeason: string | null
  round: number | null
  lastRace: Race | null
  calendar: Race[]
  onSeasonChange: (season: string) => void
  onRoundChange: (round: number | null) => void
}) {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-line bg-bg/92 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onOpenNav}
            className="shrink-0 text-muted hover:bg-surface/70 hover:text-text lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu aria-hidden="true" />
          </Button>
          <p className="label hidden text-xs text-text truncate sm:block">{viewLabel(activeId)}</p>
          <span className="hidden h-3.5 w-px bg-line-strong lg:block" aria-hidden="true" />
          <p className="hidden mono-num text-xs tracking-widest text-muted lg:block">
            UPDATED {formatLastUpdated(lastUpdated)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SeasonRoundControls
            seasonId={seasonId}
            seasonYears={seasonYears}
            currentSeason={currentSeason}
            round={round}
            lastRace={lastRace}
            calendar={calendar}
            onSeasonChange={onSeasonChange}
            onRoundChange={onRoundChange}
          />
          <span className="hidden items-center gap-1.5 rounded border border-line bg-bg-secondary px-2 py-1 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="label text-[10px] text-muted">Live Data</span>
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
                className="border-line bg-surface text-[13px] tracking-wide text-text hover:border-accent hover:bg-surface hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Refresh data"
              >
                <RefreshCw
                  className={`size-3.5 ${refreshing ? 'spinner text-accent' : 'text-muted'}`}
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">REFRESH</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Refresh data</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
