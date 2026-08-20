import { useCallback, useEffect, useState } from 'react'
import {
  fetchConstructorResultsAll,
  fetchConstructorSeasonResults,
  fetchConstructorSeasonStanding,
  fetchDriverResultsAll,
  fetchDriverSeasonResults,
  fetchDriverSeasonStanding,
  fetchSchedule,
  fetchSeasonDriverChampion,
  type SeasonChampion,
  type SeasonStanding,
} from './api'
import { loadConstructorRecordBundle, loadDriverCareerBundle } from './careerData'
import type {
  CareerRace,
  CareerSeasonStats,
  CareerTeamStint,
  Constructor,
  ConstructorRecord,
  Driver,
  DriverCareer,
  RecordSeason,
} from './types'

const cache = new Map<string, unknown>()

export type CareerStatus = 'loading' | 'ready' | 'error'

export interface CareerState<T> {
  status: CareerStatus
  data: T | null
  error: Error | null
}

export type CareerResult<T> = CareerState<T> & { retry: () => void }

const CHUNK = 6
const DELAY_MS = 120

function currentYear(): number {
  return new Date().getFullYear()
}

async function finishedSeasonsFor(seasons: string[], signal?: AbortSignal): Promise<Set<string>> {
  const finished = new Set(seasons)
  const current = String(currentYear())
  if (!finished.has(current)) return finished
  try {
    const schedule = await fetchSchedule(current, signal)
    const lastStart = schedule.length > 0 ? schedule[schedule.length - 1].start : null
    if (lastStart !== null && lastStart < new Date()) return finished
    finished.delete(current)
  } catch {
    finished.delete(current)
  }
  return finished
}

async function fetchKeyed<T>(
  items: string[],
  fetchOne: (item: string, signal?: AbortSignal) => Promise<T | null>,
  signal?: AbortSignal,
): Promise<{ map: Map<string, T>; complete: boolean }> {
  const map = new Map<string, T>()
  const failed = new Set<string>()
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK)
    const settled = await Promise.allSettled(chunk.map((item) => fetchOne(item, signal)))
    settled.forEach((res, idx) => {
      const item = chunk[idx]
      if (res.status === 'fulfilled' && res.value !== null) map.set(item, res.value)
      else if (res.status === 'rejected') failed.add(item)
    })
    if (i + CHUNK < items.length && !signal?.aborted) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
    }
  }
  // Sequential retry pass for anything that failed, so a transient 429 doesn't
  // leave a permanent hole in the per-season standings.
  for (const item of items) {
    if (signal?.aborted) break
    if (map.has(item) || !failed.has(item)) continue
    try {
      const value = await fetchOne(item, signal)
      if (value !== null) map.set(item, value)
      failed.delete(item)
    } catch {
      // keep failed
    }
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
  }
  return { map, complete: failed.size === 0 }
}

interface DriverRecord {
  season: string
  constructor: Constructor
  stats: CareerSeasonStats
}

function buildRecordsFromRaces(races: CareerRace[], standings: Map<string, SeasonStanding>): DriverRecord[] {
  interface TeamAccum {
    constructor: Constructor
    seasons: Map<string, CareerSeasonStats>
  }
  const byTeam = new Map<string, TeamAccum>()
  for (const { season, row } of races) {
    const cid = row.constructor.constructorId
    let acc = byTeam.get(cid)
    if (!acc) {
      acc = { constructor: row.constructor, seasons: new Map() }
      byTeam.set(cid, acc)
    }
    let stats = acc.seasons.get(season)
    if (!stats) {
      stats = {
        season,
        races: 0,
        wins: 0,
        podiums: 0,
        poles: 0,
        championshipPosition: standings.get(season)?.position ?? null,
      }
      acc.seasons.set(season, stats)
    }
    if (row.position > 0) stats.races += 1
    if (row.position === 1) stats.wins += 1
    if (row.position >= 1 && row.position <= 3) stats.podiums += 1
    if (row.grid === 1) stats.poles += 1
  }

  const records: DriverRecord[] = []
  for (const acc of byTeam.values()) {
    for (const stats of acc.seasons.values()) records.push({ season: stats.season, constructor: acc.constructor, stats })
  }
  return records.sort((a, b) => a.season.localeCompare(b.season))
}

function buildDriverCareerFromRecords(
  driver: Driver | null,
  records: DriverRecord[],
  finishedSeasons: Set<string>,
): DriverCareer {
  const sorted = [...records].sort((a, b) => a.season.localeCompare(b.season))
  const stints: CareerTeamStint[] = []
  let current: CareerTeamStint | null = null
  for (const rec of sorted) {
    const year = Number(rec.season)
    const lastYear = current ? Number(current.seasons[current.seasons.length - 1].season) : 0
    const sameTeam = current !== null && current.constructor.constructorId === rec.constructor.constructorId
    const contiguous = sameTeam && year <= lastYear + 1
    if (current === null || !contiguous) {
      if (current !== null) stints.push(current)
      current = {
        constructor: rec.constructor,
        startSeason: rec.season,
        endSeason: rec.season,
        totals: { races: 0, wins: 0, podiums: 0, poles: 0 },
        seasons: [],
      }
    }
    current.totals.races += rec.stats.races
    current.totals.wins += rec.stats.wins
    current.totals.podiums += rec.stats.podiums
    current.totals.poles += rec.stats.poles
    current.seasons.push(rec.stats)
    current.startSeason = current.seasons[0].season
    current.endSeason = current.seasons[current.seasons.length - 1].season
  }
  if (current !== null) stints.push(current)

  stints.sort((a, b) => b.endSeason.localeCompare(a.endSeason) || b.startSeason.localeCompare(a.startSeason))
  for (const s of stints) s.seasons = [...s.seasons].reverse()

  const seasons = new Set<string>()
  let titles = 0
  for (const s of stints) {
    for (const season of s.seasons) {
      seasons.add(season.season)
      if (finishedSeasons.has(season.season) && season.championshipPosition === 1) titles += 1
    }
  }

  return { driver, stints, titles, seasonsCount: seasons.size }
}

function buildDriverCareer(
  races: CareerRace[],
  standings: Map<string, SeasonStanding>,
  finishedSeasons: Set<string>,
): DriverCareer {
  return buildDriverCareerFromRecords(races[0]?.row.driver ?? null, buildRecordsFromRaces(races, standings), finishedSeasons)
}

function buildConstructorRecordFromSeasons(
  constructor: Constructor | null,
  seasons: RecordSeason[],
  champions: Map<string, SeasonChampion>,
  finishedSeasons: Set<string>,
): ConstructorRecord {
  const constructorId = constructor?.constructorId ?? ''
  const constructorTitles = seasons.filter((s) => finishedSeasons.has(s.season) && s.championshipPosition === 1).length
  const driverTitles = seasons.filter(
    (s) => finishedSeasons.has(s.season) && champions.get(s.season)?.constructorIds.includes(constructorId),
  ).length
  return {
    constructor,
    seasons,
    seasonsCount: seasons.length,
    constructorTitles,
    driverTitles,
  }
}

function buildConstructorRecord(
  races: CareerRace[],
  standings: Map<string, SeasonStanding>,
  champions: Map<string, SeasonChampion>,
  finishedSeasons: Set<string>,
): ConstructorRecord {
  const bySeason = new Map<string, RecordSeason>()
  const roundsSeen = new Set<string>()
  for (const { season, round, row } of races) {
    let rs = bySeason.get(season)
    if (!rs) {
      rs = {
        season,
        races: 0,
        wins: 0,
        podiums: 0,
        poles: 0,
        championshipPosition: standings.get(season)?.position ?? null,
      }
      bySeason.set(season, rs)
    }
    const roundKey = `${season}:${round}`
    if (!roundsSeen.has(roundKey)) {
      roundsSeen.add(roundKey)
      rs.races += 1
    }
    if (row.position === 1) rs.wins += 1
    if (row.position >= 1 && row.position <= 3) rs.podiums += 1
    if (row.grid === 1) rs.poles += 1
  }
  const seasons = [...bySeason.values()].sort((a, b) => b.season.localeCompare(a.season))
  return buildConstructorRecordFromSeasons(races[0]?.row.constructor ?? null, seasons, champions, finishedSeasons)
}

function buildRecordFromRaces(races: CareerRace[], season: string, standing: SeasonStanding | null): RecordSeason {
  const roundsSeen = new Set<number>()
  const rs: RecordSeason = {
    season,
    races: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    championshipPosition: standing?.position ?? null,
  }
  for (const { round, row } of races) {
    if (!roundsSeen.has(round)) {
      roundsSeen.add(round)
      rs.races += 1
    }
    if (row.position === 1) rs.wins += 1
    if (row.position >= 1 && row.position <= 3) rs.podiums += 1
    if (row.grid === 1) rs.poles += 1
  }
  return rs
}

function useCareerEntity<T>(
  cacheKey: string,
  enabled: boolean,
  load: (signal: AbortSignal) => Promise<{ value: T; complete: boolean }>,
): CareerResult<T> {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<CareerState<T>>({ status: 'loading', data: null, error: null })

  useEffect(() => {
    if (!enabled) return
    const cached = cache.get(cacheKey) as T | undefined
    if (cached !== undefined) {
      setState({ status: 'ready', data: cached, error: null })
      return
    }
    const controller = new AbortController()
    let active = true
    setState({ status: 'loading', data: null, error: null })
    load(controller.signal)
      .then(({ value, complete }) => {
        if (complete) cache.set(cacheKey, value)
        if (active) setState({ status: 'ready', data: value, error: null })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || !active) return
        const error = err instanceof Error ? err : new Error(String(err))
        setState({ status: 'error', data: null, error })
      })
    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, cacheKey, attempt])

  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  return { ...state, retry }
}

export function useDriverCareer(driverId: string, enabled: boolean): CareerResult<DriverCareer> {
  const cacheKey = `driverCareer:${driverId}`
  return useCareerEntity<DriverCareer>(
    cacheKey,
    enabled,
    async (signal) => {
      try {
        const bundle = await loadDriverCareerBundle()
        const stored = bundle.drivers[driverId]
        const lastSeason = Number(bundle.lastSeason)
        const year = currentYear()
        if (stored && lastSeason >= year - 1) {
          const records: DriverRecord[] = stored.seasons.map((s) => ({
            season: s.stats.season,
            constructor: s.constructor,
            stats: s.stats,
          }))
          let liveSuccess = true
          if (year > lastSeason) {
            const yearStr = String(year)
            try {
              const [liveRaces, liveStanding] = await Promise.all([
                fetchDriverSeasonResults(driverId, yearStr, signal),
                fetchDriverSeasonStanding(driverId, yearStr, signal),
              ])
              const standings = new Map<string, SeasonStanding>()
              if (liveStanding) standings.set(yearStr, liveStanding)
              for (const rec of buildRecordsFromRaces(liveRaces, standings)) {
                if (records.some((r) => r.season === rec.season && r.constructor.constructorId === rec.constructor.constructorId)) {
                  continue
                }
                records.push(rec)
              }
            } catch {
              liveSuccess = false
            }
          }
          const finished = await finishedSeasonsFor([...new Set(records.map((r) => r.season))], signal)
          const value = buildDriverCareerFromRecords(stored.driver, records, finished)
          return { value, complete: year > lastSeason ? liveSuccess && finished.has(String(year)) : true }
        }
      } catch {
        // Stored bundle missing/corrupt — fall through to the live path.
      }
      const races = await fetchDriverResultsAll(driverId, signal)
      const seasons = [...new Set(races.map((r) => r.season))]
      const finished = await finishedSeasonsFor(seasons, signal)
      const { map, complete } = await fetchKeyed(
        seasons,
        (season, s) => fetchDriverSeasonStanding(driverId, season, s),
        signal,
      )
      return { value: buildDriverCareer(races, map, finished), complete }
    },
  )
}

export function useConstructorRecord(
  constructorId: string,
  enabled: boolean,
): CareerResult<ConstructorRecord> {
  const cacheKey = `constructorRecord:${constructorId}`
  return useCareerEntity<ConstructorRecord>(
    cacheKey,
    enabled,
    async (signal) => {
      try {
        const bundle = await loadConstructorRecordBundle()
        const stored = bundle.constructors[constructorId]
        const champions = new Map(Object.entries(bundle.champions))
        const lastSeason = Number(bundle.lastSeason)
        const year = currentYear()
        if (stored && lastSeason >= year - 1) {
          const seasons: RecordSeason[] = [...stored.seasons]
          let liveSuccess = true
          if (year > lastSeason) {
            const yearStr = String(year)
            try {
              const [liveRaces, liveStanding] = await Promise.all([
                fetchConstructorSeasonResults(constructorId, yearStr, signal),
                fetchConstructorSeasonStanding(constructorId, yearStr, signal),
              ])
              seasons.push(buildRecordFromRaces(liveRaces, yearStr, liveStanding))
              seasons.sort((a, b) => b.season.localeCompare(a.season))
            } catch {
              liveSuccess = false
            }
          }
          const finished = await finishedSeasonsFor(seasons.map((s) => s.season), signal)
          const value = buildConstructorRecordFromSeasons(stored.constructor, seasons, champions, finished)
          return { value, complete: year > lastSeason ? liveSuccess && finished.has(String(year)) : true }
        }
      } catch {
        // Stored bundle missing/corrupt — fall through to the live path.
      }
      const races = await fetchConstructorResultsAll(constructorId, signal)
      const seasons = [...new Set(races.map((r) => r.season))]
      const finished = await finishedSeasonsFor(seasons, signal)
      const standings = await fetchKeyed(
        seasons,
        (season, s) => fetchConstructorSeasonStanding(constructorId, season, s),
        signal,
      )
      const champions = await fetchKeyed(
        seasons,
        (season, s) => fetchSeasonDriverChampion(season, s),
        signal,
      )
      return {
        value: buildConstructorRecord(races, standings.map, champions.map, finished),
        complete: standings.complete && champions.complete,
      }
    },
  )
}