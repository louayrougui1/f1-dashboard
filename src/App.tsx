import { useEffect, useMemo, useRef, useState } from "react";
import { useDashboard } from "./lib/useDashboard";
import { buildHash, useHashRoute } from "./lib/router";
import { standingsTargets } from "./lib/nav";
import { CIRCUIT_TRACKS } from "./lib/circuitTracks";
import { display, driverFullName, roundLabel } from "./lib/format";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopBar } from "./components/Header";
import { MobileNavSheet, Sidebar, useNavActive, useScrollSpy } from "./components/Sidebar";
import { RaceStatusCards } from "./components/RaceStatusCards";
import { StatStrip } from "./components/StatStrip";
import { LastRaceResults } from "./components/LastRaceResults";
import { FastestLap } from "./components/FastestLap";
import { Visualizations } from "./components/Visualizations";
import { Circuit } from "./components/Circuit";
import { Qualifying } from "./components/Qualifying";
import { PitStops } from "./components/PitStops";
import { LapChart } from "./components/LapChart";
import { WatchLive } from "./components/WatchLive";
import { StandingsPage } from "./components/StandingsPage";
import { RacePage } from "./components/RacePage";
import { DriverPage } from "./components/DriverPage";
import { TeamPage } from "./components/TeamPage";
import { SectionHeading } from "./components/Card";
import { ErrorState } from "./components/ErrorState";

const SEASON_FLOOR = 2000;

const RACE_TABS = [
  { key: "results", label: "Race Results" },
  { key: "qualifying", label: "Qualifying" },
  { key: "sprint", label: "Sprint" },
  { key: "pitstops", label: "Pit Stops" },
] as const;

type RaceTab = (typeof RACE_TABS)[number]["key"];

function parseSeasonParam(v: string | null): string | null {
  if (!v) return null;
  if (v === "current") return "current";
  if (!/^\d{4}$/.test(v)) return null;
  const n = Number(v);
  if (n < SEASON_FLOOR || n > new Date().getFullYear()) return null;
  return v;
}

function parseRoundParam(v: string | null): number | null {
  if (!v || !/^\d{1,2}$/.test(v)) return null;
  const n = Number(v);
  if (n < 1 || n > 60) return null;
  return n;
}

export default function App() {
  const hash = useHashRoute();
  const route = hash.route;
  const initial = useMemo(
    () => ({
      season: parseSeasonParam(hash.params.season),
      round: parseRoundParam(hash.params.round),
    }),
    [hash.params.season, hash.params.round],
  );
  const dashboard = useDashboard(initial);
  const { active, manual, onNavigate, resetManual } = useNavActive();
  const standingsIds = useMemo(() => standingsTargets(), []);
  const standingsSpy = useScrollSpy(standingsIds);
  const [navOpen, setNavOpen] = useState(false);
  const [raceTab, setRaceTab] = useState<RaceTab>("results");
  const { season, calendar, lastRace, nextRace, featuredRound } = dashboard;
  const effectiveActive =
    route.name === "standings"
      ? (manual ?? standingsSpy)
      : route.name === "driver"
        ? "driver"
        : route.name === "team"
          ? "team"
          : route.name === "race"
            ? "race"
            : active;

  useEffect(() => {
    const seasonParam = dashboard.seasonId;
    const roundParam =
      dashboard.round !== null ? String(dashboard.round) : null;
    const want = buildHash(route, { season: seasonParam, round: roundParam });
    if (window.location.hash !== want)
      window.history.replaceState(null, "", want);
  }, [route, dashboard.seasonId, dashboard.round]);

  const prevRoute = useRef(route.name);
  useEffect(() => {
    if (route.name !== "dashboard" && prevRoute.current !== route.name)
      window.scrollTo(0, 0);
    prevRoute.current = route.name;
    resetManual();
  }, [route.name, resetManual]);

  const navigate = useMemo(
    () => ({
      toDashboard: () => {
        window.location.hash = "#/";
      },
      toStandings: () => {
        window.location.hash = "#/standings";
      },
      toRace: (round: number) => {
        window.location.hash = `#/race/${round}`;
      },
      toDriver: (driverId: string) => {
        window.location.hash = `#/driver/${encodeURIComponent(driverId)}`;
      },
      toConstructor: (constructorId: string) => {
        window.location.hash = `#/team/${encodeURIComponent(constructorId)}`;
      },
    }),
    [],
  );

  const scheduleLoading = dashboard.schedule.status === "loading";
  const scheduleError = dashboard.schedule.error;
  const hasRaceData = lastRace !== null || nextRace !== null;

  const featuredDetail = dashboard.featuredDetail;
  const featuredResults = featuredDetail.data?.results ?? [];
  const featuredRace = dashboard.featuredRace;
  const featuredTrack = featuredRace?.circuitId
    ? (CIRCUIT_TRACKS[featuredRace.circuitId] ?? null)
    : null;
  const nextTrack = nextRace?.circuitId
    ? (CIRCUIT_TRACKS[nextRace.circuitId] ?? null)
    : null;
  const resultsLoading =
    featuredDetail.status === "loading" && featuredResults.length === 0;
  const resultsError =
    featuredDetail.status === "error" ? featuredDetail.error : null;

  const qualifying = dashboard.qualifying.data;
  const qualifyingRows = qualifying?.rows ?? [];
  const qualifyingLoading =
    dashboard.qualifying.status === "loading" && qualifyingRows.length === 0;
  const qualifyingError =
    dashboard.qualifying.status === "error" ? dashboard.qualifying.error : null;

  const pitStops = dashboard.pitStops.data;
  const pitStopRows = pitStops?.stops ?? [];
  const pitStopsLoading =
    dashboard.pitStops.status === "loading" && pitStopRows.length === 0;
  const pitStopsError =
    dashboard.pitStops.status === "error" ? dashboard.pitStops.error : null;

  const sprintDetail = dashboard.sprint.data;
  const sprintRows = sprintDetail?.results ?? [];
  const sprintLoading =
    dashboard.sprint.status === "loading" && sprintRows.length === 0;
  const sprintError =
    dashboard.sprint.status === "error" ? dashboard.sprint.error : null;

  const lapsDetail = dashboard.laps.data;
  const lapsLoading = dashboard.laps.status === "loading" && !lapsDetail;
  const lapsError =
    dashboard.laps.status === "error" ? dashboard.laps.error : null;

  const isSprintWeekend = featuredRace?.weekend.sprint != null;
  const visibleTabs = isSprintWeekend
    ? RACE_TABS
    : RACE_TABS.filter((t) => t.key !== "sprint");
  const activeRaceTab = visibleTabs.some((t) => t.key === raceTab)
    ? raceTab
    : "results";

  const seasonResults = dashboard.seasonResults.data ?? [];
  const seasonResultsLoading =
    dashboard.seasonResults.status === "loading" && seasonResults.length === 0;
  const seasonResultsError =
    dashboard.seasonResults.status === "error"
      ? dashboard.seasonResults.error
      : null;

  const driverRows = dashboard.driverStandings.data ?? [];
  const constructorRows = dashboard.constructorStandings.data ?? [];
  const pointsLeader = driverRows[0] ?? null;
  const constructorLeader = constructorRows[0] ?? null;
  const completed = lastRace?.round ?? null;
  const roundsCompleted = lastRace?.round ?? null;
  const totalRounds = calendar.length || null;

  const maxCompleted = lastRace?.round ?? null;
  const prevRound =
    featuredRound !== null && featuredRound > 1 ? featuredRound - 1 : null;
  const nextRound =
    featuredRound !== null &&
    maxCompleted !== null &&
    featuredRound < maxCompleted
      ? featuredRound + 1
      : null;

  const qualifyingRace = qualifying?.race ?? featuredRace;
  const pitStopsRace = pitStops?.race ?? featuredRace;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-bg text-text">
        <div className="flex min-h-screen">
          <Sidebar navMode={route.name === "dashboard" ? "dashboard" : "standings"} active={effectiveActive} onNavigate={onNavigate} />

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
              nextRace={nextRace}
              calendar={calendar}
              onSeasonChange={dashboard.setSeason}
              onRoundChange={dashboard.setRound}
            />
            <MobileNavSheet
              open={navOpen}
              onOpenChange={setNavOpen}
              navMode={route.name === "dashboard" ? "dashboard" : "standings"}
              active={effectiveActive}
              onNavigate={onNavigate}
            />

            <main className="main-wash flex-1 px-4 py-5 lg:px-6">
              {route.name === "standings" ? (
                <div className="mx-auto max-w-[1560px]">
                  <StandingsPage
                    season={season}
                    drivers={driverRows}
                    driverLoading={
                      dashboard.driverStandings.status === "loading" &&
                      driverRows.length === 0
                    }
                    driverError={dashboard.driverStandings.error}
                    onRetryDrivers={() => dashboard.retry("drivers")}
                    constructors={constructorRows}
                    constructorLoading={
                      dashboard.constructorStandings.status === "loading" &&
                      constructorRows.length === 0
                    }
                    constructorError={dashboard.constructorStandings.error}
                    onRetryConstructors={() => dashboard.retry("constructors")}
                    calendar={calendar}
                    rounds={seasonResults}
                    roundsLoading={seasonResultsLoading}
                    roundsError={seasonResultsError}
                    onRetryRounds={() => dashboard.retry("seasonResults")}
                    onSelectDriver={navigate.toDriver}
                    onSelectConstructor={navigate.toConstructor}
                    onSelectRace={navigate.toRace}
                  />
                </div>
              ) : route.name === "race" ? (
                <div className="mx-auto max-w-[1560px]">
                  <RacePage
                    round={Number(route.round)}
                    seasonLabel={season}
                    calendar={calendar}
                    rounds={seasonResults}
                    roundsLoading={seasonResultsLoading}
                    roundsError={seasonResultsError}
                    onRetryRounds={() => dashboard.retry("seasonResults")}
                    onBack={navigate.toStandings}
                  />
                </div>
              ) : route.name === "driver" ? (
                <div className="mx-auto max-w-[1560px]">
                  <DriverPage
                    driverId={route.driverId}
                    seasonLabel={season}
                    calendar={calendar}
                    standings={driverRows}
                    standingsLoading={
                      dashboard.driverStandings.status === "loading" &&
                      driverRows.length === 0
                    }
                    standingsError={dashboard.driverStandings.error}
                    onRetryStandings={() => dashboard.retry("drivers")}
                    rounds={seasonResults}
                    roundsLoading={seasonResultsLoading}
                    roundsError={seasonResultsError}
                    onRetryRounds={() => dashboard.retry("seasonResults")}
                    onBack={navigate.toStandings}
                    onSelectDriver={navigate.toDriver}
                    onSelectConstructor={navigate.toConstructor}
                  />
                </div>
              ) : route.name === "team" ? (
                <div className="mx-auto max-w-[1560px]">
                  <TeamPage
                    constructorId={route.constructorId}
                    seasonLabel={season}
                    calendar={calendar}
                    standings={constructorRows}
                    driverStandings={driverRows}
                    standingsLoading={
                      dashboard.constructorStandings.status === "loading" &&
                      constructorRows.length === 0
                    }
                    standingsError={dashboard.constructorStandings.error}
                    onRetryStandings={() => dashboard.retry("constructors")}
                    rounds={seasonResults}
                    roundsLoading={seasonResultsLoading}
                    roundsError={seasonResultsError}
                    onRetryRounds={() => dashboard.retry("seasonResults")}
                    onBack={navigate.toStandings}
                    onSelectDriver={navigate.toDriver}
                  />
                </div>
              ) : (
                <div className="mx-auto max-w-[1560px] space-y-8">
                  <section
                    id="overview"
                    aria-label="Race overview"
                    className="scroll-mt-14"
                  >
                    {scheduleError && !hasRaceData && !scheduleLoading ? (
                      <div className="rounded-lg border border-line bg-surface">
                        <ErrorState
                          message="Unable to retrieve the race schedule from the Formula 1 data service."
                          detail={scheduleError?.message}
                          onRetry={() => dashboard.retry("schedule")}
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
                        nextTrack={nextTrack}
                        driverRows={driverRows}
                        constructorRows={constructorRows}
                      />
                    )}
                    <div className="mt-4">
                      <StatStrip
                        season={season}
                        rounds={totalRounds}
                        completed={completed}
                        leader={
                          pointsLeader ? driverFullName(pointsLeader.driver) : null
                        }
                        leaderPoints={
                          pointsLeader ? display(pointsLeader.points) : null
                        }
                        constructorLeader={
                          constructorLeader
                            ? display(constructorLeader.constructor.name)
                            : null
                        }
                        constructorLeaderPoints={
                          constructorLeader
                            ? display(constructorLeader.points)
                            : null
                        }
                      />
                    </div>
                  </section>

                  <section
                    id="calendar"
                    aria-label="Season calendar"
                    className="scroll-mt-14"
                  >
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
                        onRetry={() => dashboard.retry("schedule")}
                      />
                    </div>
                  </section>

                  <section
                    id="results"
                    aria-label="Race data"
                    className="scroll-mt-14"
                  >
                    <SectionHeading
                      label="Race Data"
                      meta={
                        featuredRound !== null
                          ? `${roundLabel(featuredRound)} · ${
                              activeRaceTab === "results"
                                ? "Timing"
                                : activeRaceTab === "qualifying"
                                  ? "Q1/Q2/Q3"
                                  : activeRaceTab === "sprint"
                                    ? "Sprint"
                                    : "Pit Stops"
                            }`
                          : undefined
                      }
                    />
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1">
                        {visibleTabs.map((t) => {
                          const isActive = activeRaceTab === t.key;
                          return (
                            <button
                              key={t.key}
                              type="button"
                              aria-pressed={isActive}
                              onClick={() => setRaceTab(t.key)}
                              className={cn(
                                "h-8 rounded-md px-3 text-xs font-semibold tracking-[0.15em] uppercase transition-colors",
                                isActive
                                  ? "bg-accent text-bg"
                                  : "text-muted hover:bg-surface-2 hover:text-text",
                              )}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3">
                        {activeRaceTab === "results" ? (
                          <LastRaceResults
                            raceName={
                              featuredDetail.data?.race.raceName ?? null
                            }
                            round={featuredDetail.data?.round ?? featuredRound}
                            rows={featuredResults}
                            maxRows={featuredResults.length || undefined}
                            loading={resultsLoading}
                            error={resultsError}
                            hasData={featuredResults.length > 0}
                            upcoming={dashboard.featuredUpcoming}
                            onRetry={() => dashboard.retry("results")}
                            onPrev={
                              prevRound !== null
                                ? () => dashboard.setRound(prevRound)
                                : undefined
                            }
                            onNext={
                              nextRound !== null
                                ? () => dashboard.setRound(nextRound)
                                : undefined
                            }
                            canPrev={prevRound !== null}
                            canNext={nextRound !== null}
                          />
                        ) : activeRaceTab === "qualifying" ? (
                          <Qualifying
                            raceName={qualifyingRace?.raceName ?? null}
                            round={qualifying?.round ?? featuredRound}
                            rows={qualifyingRows}
                            loading={qualifyingLoading}
                            error={qualifyingError}
                            hasData={qualifyingRows.length > 0}
                            upcoming={dashboard.featuredUpcoming}
                            onRetry={() => dashboard.retry("qualifying")}
                          />
                        ) : activeRaceTab === "sprint" ? (
                          <LastRaceResults
                            raceName={sprintDetail?.race.raceName ?? null}
                            round={sprintDetail?.round ?? featuredRound}
                            rows={sprintRows}
                            maxRows={sprintRows.length || undefined}
                            loading={sprintLoading}
                            error={sprintError}
                            hasData={sprintRows.length > 0}
                            upcoming={dashboard.featuredUpcoming}
                            onRetry={() => dashboard.retry("sprint")}
                            variant="sprint"
                          />
                        ) : (
                          <PitStops
                            raceName={pitStopsRace?.raceName ?? null}
                            round={pitStops?.round ?? featuredRound}
                            stops={pitStopRows}
                            resultRows={featuredResults}
                            loading={pitStopsLoading}
                            error={pitStopsError}
                            hasData={pitStopRows.length > 0}
                            upcoming={dashboard.featuredUpcoming}
                            onRetry={() => dashboard.retry("pitStops")}
                          />
                        )}
                      </div>
                    </div>
                  </section>

                  <section
                    id="fastest"
                    aria-label="Fastest lap"
                    className="scroll-mt-14"
                  >
                    <SectionHeading
                      label="Fastest Lap"
                      meta={
                        featuredRound !== null
                          ? roundLabel(featuredRound)
                          : undefined
                      }
                    />
                    <div className="mt-3">
                      <FastestLap
                        raceName={featuredDetail.data?.race.raceName ?? null}
                        rows={featuredResults}
                        loading={resultsLoading}
                        error={resultsError}
                        hasData={featuredResults.length > 0}
                        upcoming={dashboard.featuredUpcoming}
                        onRetry={() => dashboard.retry("results")}
                      />
                    </div>
                  </section>

                  <section
                    id="lapchart"
                    aria-label="Lap-by-lap chart"
                    className="scroll-mt-14"
                  >
                    <SectionHeading
                      label="Lap Chart"
                      meta={
                        featuredRound !== null
                          ? roundLabel(featuredRound)
                          : undefined
                      }
                    />
                    <div className="mt-3">
                      <LapChart
                        raceName={featuredDetail.data?.race.raceName ?? null}
                        round={featuredDetail.data?.round ?? featuredRound}
                        detail={lapsDetail}
                        resultRows={featuredResults}
                        loading={lapsLoading}
                        error={lapsError}
                        upcoming={dashboard.featuredUpcoming}
                        onRetry={() => dashboard.retry("laps")}
                      />
                    </div>
                  </section>

                  <section
                    id="circuit"
                    aria-label="Circuit"
                    className="scroll-mt-14"
                  >
                    <SectionHeading
                      label="Circuit"
                      meta={
                        featuredRound !== null
                          ? roundLabel(featuredRound)
                          : undefined
                      }
                    />
                    <div className="mt-3">
                      <Circuit
                        race={featuredRace}
                        track={featuredTrack}
                        rows={featuredResults}
                      />
                    </div>
                  </section>

                  <section
                    id="watchlive"
                    aria-label="Watch live"
                    className="scroll-mt-14"
                  >
                    <SectionHeading label="Watch" meta="Live F1 streams" />
                    <div className="mt-3">
                      <WatchLive />
                    </div>
                  </section>

                  <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 pb-2">
                    <p className="label text-[9px] text-muted/70">
                      Data · Jolpica F1 API · Season {season ?? "—"} · Live
                      standings &amp; results
                    </p>
                    <p className="mono-num text-[9px] text-muted/70">
                      F1 DATA CENTER · 2026
                    </p>
                  </footer>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
