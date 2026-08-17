import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchConstructorStandings,
  fetchDriverStandings,
  fetchRaceResults,
  fetchSchedule,
} from './api'
import type { ConstructorStandingRow, DriverStandingRow, Race, RaceDetail } from './types'

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

export type DataKey = 'schedule' | 'drivers' | 'constructors' | 'results'

export interface DashboardState {
  seasonId: string
  setSeason: (season: string) => void
  round: number | null
  setRound: (round: number | null) => void
  season: string | null
  seasonYears: string[]
  calendar: Race[]
  lastRace: Race | null
  nextRace: Race | null
  featuredRound: number | null
  featuredRace: Race | null
  schedule: SliceState<Race[]>
  featuredDetail: SliceState<RaceDetail | null>
  driverStandings: SliceState<DriverStandingRow[]>
  constructorStandings: SliceState<ConstructorStandingRow[]>
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
}

const SEASON_FLOOR = 2000

export function useDashboard(): DashboardState {
  const [seasonId, setSeasonId] = useState<string>('current')
  const [round, setRound] = useState<number | null>(null)
  const [slices, setSlices] = useState<Record<DataKey, SliceState<unknown>>>(EMPTY)
  const [version, setVersion] = useState<Record<DataKey, number>>({
    schedule: 0,
    drivers: 0,
    constructors: 0,
    results: 0,
  })
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const firstRun = useRef(true)

  const currentSeason = useMemo(() => {
    const data = slices.schedule.data as Race[] | null
    return data?.[0]?.date.slice(0, 4) ?? null
  }, [slices.schedule])

  const seasonYears = useMemo(() => {
    if (!currentSeason) return ['current']
    const cur = Number(currentSeason)
    if (!Number.isFinite(cur)) return ['current']
    const years: string[] = ['current']
    for (let y = cur; y >= SEASON_FLOOR; y--) years.push(String(y))
    return years
  }, [currentSeason])

  const keyFor = useCallback(
    (k: DataKey): string => {
      return k === 'results' ? `results:${seasonId}:${round ?? ''}` : `${k}:${seasonId}`
    },
    [seasonId, round],
  )

  const calendar = useMemo(() => {
    const data = slices.schedule.data as Race[] | null
    return data ?? []
  }, [slices.schedule])

  const now = useMemo(() => new Date(), [])
  const completedRaces = useMemo(
    () => calendar.filter((r) => r.start !== null && r.start.getTime() <= now.getTime()),
    [calendar, now],
  )
  const lastRace = useMemo(
    () => (completedRaces.length > 0 ? completedRaces[completedRaces.length - 1] : null),
    [completedRaces],
  )
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
    setRound(null)
    setSlices((prev) => {
      const next = { ...prev }
      for (const k of Object.keys(next) as DataKey[]) {
        const key = k === 'results' ? `results:${seasonId}:` : `${k}:${seasonId}`
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

  // When an explicit round changes, reset only the results slice for the new key.
  useEffect(() => {
    if (round === null) return
    setSlices((prev) => {
      const cached = readCache(keyFor('results'))
      return {
        ...prev,
        results:
          cached !== null
            ? { status: 'ready', data: cached, error: null }
            : { status: 'loading', data: null, error: null },
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  useEffect(() => {
    const controller = new AbortController()
    if (!firstRun.current) setRefreshing(true)
    firstRun.current = false

    const defs: Array<{ key: DataKey; cache: string; run: (s?: AbortSignal) => Promise<unknown> }> = [
      { key: 'schedule', cache: keyFor('schedule'), run: (s) => fetchSchedule(seasonId, s) },
      { key: 'drivers', cache: keyFor('drivers'), run: (s) => fetchDriverStandings(seasonId, s) },
      {
        key: 'constructors',
        cache: keyFor('constructors'),
        run: (s) => fetchConstructorStandings(seasonId, s),
      },
    ]

    if (featuredRound !== null && scheduleReady) {
      defs.push({
        key: 'results',
        cache: keyFor('results'),
        run: (s) => fetchRaceResults(seasonId, featuredRound, s),
      })
    }

    let completed = 0
    const total = defs.length

    for (const f of defs) {
      const cached = readCache(f.cache)
      if (cached !== null) {
        setSlices((prev) => ({ ...prev, [f.key]: { status: 'ready', data: cached, error: null } }))
        completed += 1
        if (completed === total) setRefreshing(false)
        continue
      }
      f.run(controller.signal)
        .then((value) => {
          writeCache(f.cache, value)
          setSlices((prev) => ({ ...prev, [f.key]: { status: 'ready', data: value, error: null } }))
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

    if (total === 0) setRefreshing(false)

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, seasonId, round, featuredRound, scheduleReady, keyFor])

  const refresh = useCallback(() => {
    cache.clear()
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
    calendar,
    lastRace,
    nextRace,
    featuredRound,
    featuredRace,
    schedule: slices.schedule as SliceState<Race[]>,
    featuredDetail: slices.results as SliceState<RaceDetail | null>,
    driverStandings: slices.drivers as SliceState<DriverStandingRow[]>,
    constructorStandings: slices.constructors as SliceState<ConstructorStandingRow[]>,
    championDriver,
    championConstructor,
    seasonComplete,
    refreshing,
    lastUpdated,
    refresh,
    retry,
  }
}