import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchConstructorStandings,
  fetchDriverStandings,
  fetchLaps,
  fetchPitStops,
  fetchQualifying,
  fetchRaceResults,
  fetchSchedule,
  fetchSeasonResults,
  fetchSprint,
} from './api'
import type {
  ConstructorStandingRow,
  DriverStandingRow,
  LapChartDetail,
  PitStopDetail,
  QualifyingDetail,
  Race,
  RaceDetail,
  SeasonRoundResults,
} from './types'

const cache = new Map<string, unknown>()

function readCache<T>(key: string): T | null {
  return (cache.get(key) as T | undefined) ?? null
}

function writeCache<T>(key: string, value: T): void {
  cache.set(key, value)
}

export type SliceStatus = 'loading' | 'ready' | 'error'

export interface SliceState<T> {
  status: SliceStatus
  data: T | null
  error: Error | null
}

export type DataKey = 'schedule' | 'drivers' | 'constructors' | 'results' | 'qualifying' | 'pitStops' | 'sprint' | 'laps' | 'seasonResults'

export interface DashboardState {
  seasonId: string
  setSeason: (season: string) => void
  round: number | null
  setRound: (round: number | null) => void
  season: string | null
  seasonYears: string[]
  liveSeason: string | null
  calendar: Race[]
  lastRace: Race | null
  nextRace: Race | null
  featuredRound: number | null
  featuredRace: Race | null
  featuredUpcoming: boolean
  schedule: SliceState<Race[]>
  featuredDetail: SliceState<RaceDetail | null>
  driverStandings: SliceState<DriverStandingRow[]>
  constructorStandings: SliceState<ConstructorStandingRow[]>
  qualifying: SliceState<QualifyingDetail | null>
  pitStops: SliceState<PitStopDetail | null>
  sprint: SliceState<RaceDetail | null>
  laps: SliceState<LapChartDetail | null>
  seasonResults: SliceState<SeasonRoundResults[]>
  championDriver: DriverStandingRow | null
  championConstructor: ConstructorStandingRow | null
  seasonComplete: boolean
  refreshing: boolean
  lastUpdated: Date | null
  refresh: () => void
  retry: (key: DataKey) => void
}

const EMPTY: Record<DataKey, SliceState<unknown>> = {
  schedule: { status: 'loading', data: null, error: null },
  drivers: { status: 'loading', data: null, error: null },
  constructors: { status: 'loading', data: null, error: null },
  results: { status: 'loading', data: null, error: null },
  qualifying: { status: 'loading', data: null, error: null },
  pitStops: { status: 'loading', data: null, error: null },
  sprint: { status: 'loading', data: null, error: null },
  laps: { status: 'loading', data: null, error: null },
  seasonResults: { status: 'loading', data: null, error: null },
}

const SEASON_FLOOR = 2000

export interface DashboardInitial {
  season: string | null
  round: number | null
}

export function useDashboard(initial: DashboardInitial = { season: null, round: null }): DashboardState {
  const [seasonId, setSeasonId] = useState<string>(() =>
    initial.season && initial.season !== 'current' ? initial.season : 'current',
  )
  const [round, setRound] = useState<number | null>(initial.round)
  const [slices, setSlices] = useState<Record<DataKey, SliceState<unknown>>>(EMPTY)
  const [version, setVersion] = useState<Record<DataKey, number>>({
    schedule: 0,
    drivers: 0,
    constructors: 0,
    results: 0,
    qualifying: 0,
    pitStops: 0,
    sprint: 0,
    laps: 0,
    seasonResults: 0,
  })
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [liveSeason, setLiveSeason] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const firstRun = useRef(true)
  const mounted = useRef(false)

  const currentSeason = useMemo(() => {
    const data = slices.schedule.data as Race[] | null
    return data?.[0]?.date.slice(0, 4) ?? null
  }, [slices.schedule])

  const seasonYears = useMemo(() => {
    const anchor = liveSeason ?? currentSeason
    if (!anchor) return ['current']
    const cur = Number(anchor)
    if (!Number.isFinite(cur)) return ['current']
    const years: string[] = ['current']
    for (let y = cur; y >= SEASON_FLOOR; y--) years.push(String(y))
    return years
  }, [liveSeason, currentSeason])

  const cacheKey = useCallback((k: DataKey, season: string, r: number | null): string => {
    if (k === 'results' || k === 'qualifying' || k === 'pitStops' || k === 'sprint' || k === 'laps')
      return `${k}:${season}:${r ?? ''}`
    return `${k}:${season}`
  }, [])

  const keyFor = useCallback(
    (k: DataKey): string => {
      return cacheKey(k, seasonId, round)
    },
    [cacheKey, seasonId, round],
  )

  const calendar = useMemo(() => {
    const data = slices.schedule.data as Race[] | null
    return data ?? []
  }, [slices.schedule])

  const completedRaces = useMemo(
    () => calendar.filter((r) => r.start !== null && r.start.getTime() <= now.getTime()),
    [calendar, now],
  )
  const lastRace = useMemo(
    () => (completedRaces.length > 0 ? completedRaces[completedRaces.length - 1] : null),
    [completedRaces],
  )
  const completedRounds = useMemo(() => completedRaces.map((r) => r.round), [completedRaces])
  const upcoming = useMemo(
    () => calendar.filter((r) => r.start !== null && r.start.getTime() > now.getTime()),
    [calendar, now],
  )
  const nextRace = useMemo(() => (upcoming.length > 0 ? upcoming[0] : null), [upcoming])

  const scheduleReady = slices.schedule.status === 'ready' && calendar.length > 0
  const featuredRound = useMemo(() => {
    if (round !== null) return round
    return scheduleReady ? (lastRace?.round ?? null) : null
  }, [round, scheduleReady, lastRace])

  const featuredRace = useMemo(() => {
    if (featuredRound === null) return lastRace
    return calendar.find((r) => r.round === featuredRound) ?? lastRace
  }, [featuredRound, calendar, lastRace])

  const featuredUpcoming = useMemo(() => {
    if (!featuredRace || featuredRace.start === null) return false
    return featuredRace.start.getTime() > now.getTime()
  }, [featuredRace, now])

  const seasonComplete = useMemo(
    () => calendar.length > 0 && upcoming.length === 0,
    [calendar, upcoming],
  )

  const championDriver = useMemo(() => {
    const rows = slices.drivers.data as DriverStandingRow[] | null
    return rows?.[0] ?? null
  }, [slices.drivers])

  const championConstructor = useMemo(() => {
    const rows = slices.constructors.data as ConstructorStandingRow[] | null
    return rows?.[0] ?? null
  }, [slices.constructors])

  // Reset slices whenever the selected season changes (round resets to follow the season).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    setRound(null)
    setSlices((prev) => {
      const next = { ...prev }
      for (const k of Object.keys(next) as DataKey[]) {
        const key = cacheKey(k, seasonId, null)
        const cached = readCache(key)
        next[k] =
          cached !== null
            ? { status: 'ready', data: cached, error: null }
            : { status: 'loading', data: null, error: null }
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonId])

  // When an explicit round changes, reset only the round-scoped slices for the new key.
  useEffect(() => {
    if (round === null) return
    setSlices((prev) => {
      const next = { ...prev }
      for (const k of ['results', 'qualifying', 'pitStops', 'sprint', 'laps'] as DataKey[]) {
        const cached = readCache(keyFor(k))
        next[k] =
          cached !== null
            ? { status: 'ready', data: cached, error: null }
            : { status: 'loading', data: null, error: null }
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  useEffect(() => {
    const controller = new AbortController()
    if (!firstRun.current) setRefreshing(true)
    firstRun.current = false

    const defs: Array<{
      key: DataKey
      cache: string
      run: (s?: AbortSignal) => Promise<unknown>
      delayMs?: number
    }> = [
      { key: 'schedule', cache: keyFor('schedule'), run: (s) => fetchSchedule(seasonId, s) },
      { key: 'drivers', cache: keyFor('drivers'), run: (s) => fetchDriverStandings(seasonId, s) },
      {
        key: 'constructors',
        cache: keyFor('constructors'),
        run: (s) => fetchConstructorStandings(seasonId, s),
      },
    ]

    if (featuredRound !== null && scheduleReady && !featuredUpcoming) {
      defs.push({
        key: 'results',
        cache: keyFor('results'),
        run: (s) => fetchRaceResults(seasonId, featuredRound, s),
      })
      defs.push({
        key: 'qualifying',
        cache: keyFor('qualifying'),
        run: (s) => fetchQualifying(seasonId, featuredRound, s),
      })
      defs.push({
        key: 'pitStops',
        cache: keyFor('pitStops'),
        run: (s) => fetchPitStops(seasonId, featuredRound, s),
      })
      if (featuredRace?.weekend.sprint != null) {
        defs.push({
          key: 'sprint',
          cache: keyFor('sprint'),
          run: (s) => fetchSprint(seasonId, featuredRound, s),
        })
      } else {
        setSlices((prev) => ({ ...prev, sprint: { status: 'ready', data: null, error: null } }))
      }
      defs.push({
        key: 'laps',
        cache: keyFor('laps'),
        run: (s) => fetchLaps(seasonId, featuredRound, s),
        delayMs: 300,
      })
    } else if (featuredRound !== null && scheduleReady) {
      setSlices((prev) => {
        const next = { ...prev }
        for (const k of ['results', 'qualifying', 'pitStops', 'sprint', 'laps'] as DataKey[]) {
          next[k] = { status: 'ready', data: null, error: null }
        }
        return next
      })
    }

    if (scheduleReady && completedRounds.length > 0) {
      defs.push({
        key: 'seasonResults',
        cache: keyFor('seasonResults'),
        run: (s) => fetchSeasonResults(seasonId, completedRounds, s),
        delayMs: 600,
      })
    }

    let completed = 0
    const total = defs.length
    const timers: number[] = []

    for (const f of defs) {
      const cached = readCache(f.cache)
      if (cached !== null) {
        setSlices((prev) => ({ ...prev, [f.key]: { status: 'ready', data: cached, error: null } }))
        completed += 1
        if (completed === total) setRefreshing(false)
        continue
      }
      const start = () => {
        f.run(controller.signal)
          .then((value) => {
            writeCache(f.cache, value)
            setSlices((prev) => ({ ...prev, [f.key]: { status: 'ready', data: value, error: null } }))
            if (seasonId === 'current' && f.key === 'schedule') {
              const first = (value as Race[])?.[0]
              const year = first?.date?.slice(0, 4)
              if (year) setLiveSeason(year)
            }
            setLastUpdated(new Date())
          })
          .catch((err: unknown) => {
            if (controller.signal.aborted) return
            const error = err instanceof Error ? err : new Error(String(err))
            setSlices((prev) => {
              const existing = prev[f.key]
              if (existing?.data !== null && existing?.data !== undefined) {
                return { ...prev, [f.key]: { ...existing, error } }
              }
              return { ...prev, [f.key]: { status: 'error', data: null, error } }
            })
          })
          .finally(() => {
            completed += 1
            if (completed === total) setRefreshing(false)
          })
      }
      if (f.delayMs !== undefined && f.delayMs > 0) {
        timers.push(window.setTimeout(start, f.delayMs))
      } else {
        start()
      }
    }

    if (total === 0) setRefreshing(false)

    return () => {
      for (const t of timers) window.clearTimeout(t)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, seasonId, round, featuredRound, scheduleReady, keyFor, completedRounds, featuredUpcoming])

  const refresh = useCallback(() => {
    cache.clear()
    setNow(new Date())
    setVersion((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next) as DataKey[]) next[key] += 1
      return next
    })
  }, [])

  const retry = useCallback((key: DataKey) => {
    setVersion((prev) => ({ ...prev, [key]: prev[key] + 1 }))
  }, [])

  const setSeason = useCallback((season: string) => {
    setSeasonId(season === 'current' ? 'current' : season)
  }, [])

  const season = useMemo(() => {
    if (seasonId === 'current') return currentSeason
    return seasonId
  }, [seasonId, currentSeason])

  return {
    seasonId,
    setSeason,
    round,
    setRound,
    season,
    seasonYears,
    liveSeason,
    calendar,
    lastRace,
    nextRace,
    featuredRound,
    featuredRace,
    featuredUpcoming,
    schedule: slices.schedule as SliceState<Race[]>,
    featuredDetail: slices.results as SliceState<RaceDetail | null>,
    driverStandings: slices.drivers as SliceState<DriverStandingRow[]>,
    constructorStandings: slices.constructors as SliceState<ConstructorStandingRow[]>,
    qualifying: slices.qualifying as SliceState<QualifyingDetail | null>,
    pitStops: slices.pitStops as SliceState<PitStopDetail | null>,
    sprint: slices.sprint as SliceState<RaceDetail | null>,
    laps: slices.laps as SliceState<LapChartDetail | null>,
    seasonResults: slices.seasonResults as SliceState<SeasonRoundResults[]>,
    championDriver,
    championConstructor,
    seasonComplete,
    refreshing,
    lastUpdated,
    refresh,
    retry,
  }
}