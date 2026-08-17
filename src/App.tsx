import { useEffect, useRef, useState } from 'react'
import { useDashboard } from './lib/useDashboard'
import { useHashRoute } from './lib/router'
import { CIRCUIT_TRACKS } from './lib/circuitTracks'
import { display, roundLabel } from './lib/format'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TopBar } from './components/Header'
import { MobileNavSheet, Sidebar, useNavActive } from './components/Sidebar'
import { RaceStatusCards } from './components/RaceStatusCards'
import { StatStrip } from './components/StatStrip'
import { Standings } from './components/Standings'
import { LastRaceResults } from './components/LastRaceResults'
import { FastestLap } from './components/FastestLap'
import { Visualizations } from './components/Visualizations'
import { Circuit } from './components/Circuit'
import { Qualifying } from './components/Qualifying'
import { PitStops } from './components/PitStops'
import { Progression } from './components/Progression'
import { HeadToHead } from './components/HeadToHead'
import { StandingsPage } from './components/StandingsPage'
import { SectionHeading } from './components/Card'
import { ErrorState } from './components/ErrorState'

export default function App() {
  const dashboard = useDashboard()
  const route = useHashRoute()
  const { active, onNavigate } = useNavActive()
  const [navOpen, setNavOpen] = useState(false)
  const { season, calendar, lastRace, nextRace, featuredRound } = dashboard
  const effectiveActive = route === 'standings' ? 'standings' : active

  const prevRoute = useRef(route)
  useEffect(() => {
    if (route === 'standings' && prevRoute.current !== 'standings') window.scrollTo(0, 0)
    prevRoute.current = route
  }, [route])

  const scheduleLoading = dashboard.schedule.status === 'loading'
  const scheduleError = dashboard.schedule.error
  const hasRaceData = lastRace !== null || nextRace !== null

  const featuredDetail = dashboard.featuredDetail
  const featuredResults = featuredDetail.data?.results ?? []
  const featuredRace = dashboard.featuredRace
  const featuredTrack = featuredRace?.circuitId ? (CIRCUIT_TRACKS[featuredRace.circuitId] ?? null) : null
  const resultsLoading = featuredDetail.status === 'loading' && featuredResults.length === 0
  const resultsError = featuredDetail.status === 'error' ? featuredDetail.error : null

  const qualifying = dashboard.qualifying.data
  const qualifyingRows = qualifying?.rows ?? []
  const qualifyingLoading = dashboard.qualifying.status === 'loading' && qualifyingRows.length === 0
  const qualifyingError = dashboard.qualifying.status === 'error' ? dashboard.qualifying.error : null

  const pitStops = dashboard.pitStops.data
  const pitStopRows = pitStops?.stops ?? []
  const pitStopsLoading = dashboard.pitStops.status === 'loading' && pitStopRows.length === 0
  const pitStopsError = dashboard.pitStops.status === 'error' ? dashboard.pitStops.error : null

  const seasonResults = dashboard.seasonResults.data ?? []
  const seasonResultsLoading = dashboard.seasonResults.status === 'loading' && seasonResults.length === 0
  const seasonResultsError = dashboard.seasonResults.status === 'error' ? dashboard.seasonResults.error : null

  const driverRows = dashboard.driverStandings.data ?? []
  const constructorRows = dashboard.constructorStandings.data ?? []
  const pointsLeader = driverRows[0] ?? null
  const winner = featuredResults[0] ?? null
  const fastestLapRow = featuredResults.find((r) => r.fastestLap?.rank === 1) ?? null
  const completed = lastRace?.round ?? null
  const roundsCompleted = lastRace?.round ?? null
  const totalRounds = calendar.length || null

  const maxCompleted = lastRace?.round ?? null
  const prevRound = featuredRound !== null && featuredRound > 1 ? featuredRound - 1 : null
  const nextRound =
    featuredRound !== null && maxCompleted !== null && featuredRound < maxCompleted ? featuredRound + 1 : null

  const qualifyingRace = qualifying?.race ?? featuredRace
  const pitStopsRace = pitStops?.race ?? featuredRace

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-bg text-text">
        <div className="flex min-h-screen">
          <Sidebar active={effectiveActive} />

          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar
              activeId={effectiveActive}
              lastUpdated={dashboard.lastUpdated}
              refreshing={dashboard.refreshing}
              onRefresh={dashboard.refresh}
              onOpenNav={() => setNavOpen(true)}
              seasonId={dashboard.seasonId}
              seasonYears={dashboard.seasonYears}
              currentSeason={dashboard.liveSeason}
              round={dashboard.round}
              lastRace={lastRace}
              calendar={calendar}
              onSeasonChange={dashboard.setSeason}
              onRoundChange={dashboard.setRound}
            />
            <MobileNavSheet open={navOpen} onOpenChange={setNavOpen} active={effectiveActive} onNavigate={onNavigate} />

            <main className="main-wash flex-1 px-4 py-5 lg:px-6">
              {route === 'standings' ? (
                <div className="mx-auto max-w-[1560px]">
                  <StandingsPage
                    season={season}
                    drivers={driverRows}
                    driverLoading={dashboard.driverStandings.status === 'loading' && driverRows.length === 0}
                    driverError={dashboard.driverStandings.error}
                    onRetryDrivers={() => dashboard.retry('drivers')}
                    constructors={constructorRows}
                    constructorLoading={
                      dashboard.constructorStandings.status === 'loading' && constructorRows.length === 0
                    }
                    constructorError={dashboard.constructorStandings.error}
                    onRetryConstructors={() => dashboard.retry('constructors')}
                    featuredDetail={featuredDetail.data}
                    featuredRound={featuredRound}
                    resultsLoading={resultsLoading}
                    resultsError={resultsError}
                    onRetryResults={() => dashboard.retry('results')}
                    onPrev={prevRound !== null ? () => dashboard.setRound(prevRound) : undefined}
                    onNext={nextRound !== null ? () => dashboard.setRound(nextRound) : undefined}
                    canPrev={prevRound !== null}
                    canNext={nextRound !== null}
                  />
                </div>
              ) : (
                <div className="mx-auto max-w-[1560px] space-y-8">
                  <section id="overview" aria-label="Race overview" className="scroll-mt-14">
                    {scheduleError && !hasRaceData && !scheduleLoading ? (
                      <div className="rounded-lg border border-line bg-surface">
                        <ErrorState
                          message="Unable to retrieve the race schedule from the Formula 1 data service."
                          detail={scheduleError?.message}
                          onRetry={() => dashboard.retry('schedule')}
                        />
                      </div>
                    ) : (
                      <RaceStatusCards
                        featuredRace={featuredRace}
                        featuredResults={featuredResults}
                        featuredRound={featuredRound}
                        nextRace={nextRace}
                        seasonComplete={dashboard.seasonComplete}
                        season={season}
                        roundsCompleted={roundsCompleted}
                        totalRounds={totalRounds}
                        championDriver={dashboard.championDriver}
                        championConstructor={dashboard.championConstructor}
                        loading={resultsLoading && featuredRace === null}
                        featuredTrack={featuredTrack}
                      />
                    )}
                    <div className="mt-4">
                      <StatStrip
                        season={season}
                        rounds={totalRounds}
                        completed={completed}
                        raceRound={featuredRound !== null ? roundLabel(featuredRound) : null}
                        nextRound={nextRace ? roundLabel(nextRace.round) : null}
                        winner={winner?.driver.code ?? null}
                        fastestLap={fastestLapRow?.fastestLap?.time ?? null}
                        leader={pointsLeader?.driver.code ?? null}
                        leaderPoints={pointsLeader ? display(pointsLeader.points) : null}
                      />
                    </div>
                  </section>

                  <section aria-label="Championship standings" className="scroll-mt-14">
                    <SectionHeading label="Championship" meta={`${display(season)} Season`} />
                    <div className="mt-3">
                      <Standings
                        drivers={driverRows}
                        constructors={constructorRows}
                        loading={dashboard.driverStandings.status === 'loading'}
                        driverError={dashboard.driverStandings.error}
                        constructorError={dashboard.constructorStandings.error}
                        onRetryDrivers={() => dashboard.retry('drivers')}
                        onRetryConstructors={() => dashboard.retry('constructors')}
                      />
                    </div>
                  </section>

                  <section id="circuit" aria-label="Circuit" className="scroll-mt-14">
                    <SectionHeading
                      label="Circuit"
                      meta={featuredRound !== null ? roundLabel(featuredRound) : undefined}
                    />
                    <div className="mt-3">
                      <Circuit race={featuredRace} track={featuredTrack} rows={featuredResults} />
                    </div>
                  </section>

                  <section id="qualifying" aria-label="Qualifying" className="scroll-mt-14">
                    <SectionHeading
                      label="Qualifying"
                      meta={featuredRound !== null ? `${roundLabel(featuredRound)} · Q1/Q2/Q3` : undefined}
                    />
                    <div className="mt-3">
                      <Qualifying
                        raceName={qualifyingRace?.raceName ?? null}
                        round={qualifying?.round ?? featuredRound}
                        rows={qualifyingRows}
                        loading={qualifyingLoading}
                        error={qualifyingError}
                        hasData={qualifyingRows.length > 0}
                        onRetry={() => dashboard.retry('qualifying')}
                      />
                    </div>
                  </section>

                  <section id="fastest" aria-label="Fastest lap" className="scroll-mt-14">
                    <SectionHeading label="Fastest Lap" meta={featuredRound !== null ? roundLabel(featuredRound) : undefined} />
                    <div className="mt-3">
                      <FastestLap
                        raceName={featuredDetail.data?.race.raceName ?? null}
                        rows={featuredResults}
                        loading={resultsLoading}
                        error={resultsError}
                        hasData={featuredResults.length > 0}
                        onRetry={() => dashboard.retry('results')}
                      />
                    </div>
                  </section>

                  <section id="results" aria-label="Race results" className="scroll-mt-14">
                    <SectionHeading
                      label="Race Results"
                      meta={featuredRound !== null ? `${roundLabel(featuredRound)} · Timing` : undefined}
                    />
                    <div className="mt-3">
                      <LastRaceResults
                        raceName={featuredDetail.data?.race.raceName ?? null}
                        round={featuredDetail.data?.round ?? featuredRound}
                        rows={featuredResults}
                        loading={resultsLoading}
                        error={resultsError}
                        hasData={featuredResults.length > 0}
                        onRetry={() => dashboard.retry('results')}
                        onPrev={prevRound !== null ? () => dashboard.setRound(prevRound) : undefined}
                        onNext={nextRound !== null ? () => dashboard.setRound(nextRound) : undefined}
                        canPrev={prevRound !== null}
                        canNext={nextRound !== null}
                      />
                    </div>
                  </section>

                  <section id="pitstops" aria-label="Pit stops" className="scroll-mt-14">
                    <SectionHeading
                      label="Pit Stops"
                      meta={featuredRound !== null ? roundLabel(featuredRound) : undefined}
                    />
                    <div className="mt-3">
                      <PitStops
                        raceName={pitStopsRace?.raceName ?? null}
                        round={pitStops?.round ?? featuredRound}
                        stops={pitStopRows}
                        resultRows={featuredResults}
                        loading={pitStopsLoading}
                        error={pitStopsError}
                        hasData={pitStopRows.length > 0}
                        onRetry={() => dashboard.retry('pitStops')}
                      />
                    </div>
                  </section>

                  <section id="progression" aria-label="Championship progression" className="scroll-mt-14">
                    <SectionHeading
                      label="Championship Progression"
                      meta={`${display(season)} · Cumulative`}
                    />
                    <div className="mt-3">
                      <Progression
                        rounds={seasonResults}
                        loading={seasonResultsLoading}
                        error={seasonResultsError}
                        onRetry={() => dashboard.retry('seasonResults')}
                      />
                    </div>
                  </section>

                  <section id="headtohead" aria-label="Head to head" className="scroll-mt-14">
                    <SectionHeading
                      label="Head-to-Head"
                      meta={`${display(season)} · Teammates`}
                    />
                    <div className="mt-3">
                      <HeadToHead
                        rounds={seasonResults}
                        drivers={driverRows}
                        loading={seasonResultsLoading}
                        error={seasonResultsError}
                        onRetry={() => dashboard.retry('seasonResults')}
                      />
                    </div>
                  </section>

                  <section id="calendar" aria-label="Season calendar" className="scroll-mt-14">
                    <SectionHeading label="Season" meta="Race calendar" />
                    <div className="mt-3">
                      <Visualizations
                        calendar={calendar}
                        lastRound={lastRace?.round ?? null}
                        nextRound={nextRace?.round ?? null}
                        selectedRound={featuredRound}
                        onSelectRound={dashboard.setRound}
                        loading={scheduleLoading}
                        error={scheduleError}
                        onRetry={() => dashboard.retry('schedule')}
                      />
                    </div>
                  </section>

                  <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 pb-2">
                    <p className="label text-[9px] text-muted/70">
                      Data · Jolpica F1 API · Season {season ?? '—'} · Live standings &amp; results
                    </p>
                    <p className="mono-num text-[9px] text-muted/70">F1 DATA CENTER · 2026</p>
                  </footer>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}