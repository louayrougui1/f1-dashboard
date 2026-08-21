import type {
  CareerRace,
  Constructor,
  ConstructorStandingRow,
  Driver,
  DriverStandingRow,
  FastestLap,
  Lap,
  LapChartDetail,
  LapTiming,
  PitStopDetail,
  PitStopRow,
  QualifyingDetail,
  QualifyingRow,
  Race,
  RaceDetail,
  RaceResultRow,
  SeasonRoundResults,
  SessionKey,
} from './types'
import { normalizeRaceStatus } from './format'

const BASE = 'https://api.jolpi.ca/ergast/f1'
const TIMEOUT_MS = 30000
const MAX_CONCURRENT = 2
const REQUEST_GAP_MS = 250

export class ApiError extends Error {
  readonly status: number | null
  constructor(message: string, status: number | null = null, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = 'ApiError'
    this.status = status
  }
}

function isTransient(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false
  const status = err.status
  if (status === null) return true
  if (status === 429) return true
  return status >= 500
}

const MAX_ATTEMPTS = 6
const RETRY_BASE_MS = 1200
const MAX_BACKOFF_MS = 20000

let inFlight = 0
let lastRequestAt = 0
const waiters: Array<() => void> = []

async function waitForRequestGap(): Promise<void> {
  const now = Date.now()
  const delta = lastRequestAt + REQUEST_GAP_MS - now
  if (delta > 0) {
    await new Promise((resolve) => setTimeout(resolve, delta))
  }
  lastRequestAt = Date.now()
}

function wake(): void {
  while (waiters.length > 0 && inFlight < MAX_CONCURRENT) {
    const go = waiters.shift()
    go?.()
  }
}

function acquire(signal?: AbortSignal): Promise<() => void> {
  if (inFlight < MAX_CONCURRENT) {
    inFlight += 1
    return Promise.resolve(() => {
      inFlight -= 1
      wake()
    })
  }
  return new Promise<() => void>((resolve, reject) => {
    let done = false
    const onAbort = () => {
      if (done) return
      done = true
      const i = waiters.indexOf(go)
      if (i >= 0) waiters.splice(i, 1)
      signal?.removeEventListener('abort', onAbort)
      reject(new ApiError('Request aborted'))
    }
    const go = () => {
      if (done) return
      done = true
      signal?.removeEventListener('abort', onAbort)
      inFlight += 1
      resolve(() => {
        inFlight -= 1
        wake()
      })
    }
    waiters.push(go)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

interface RawDriver {
  driverId?: string
  code?: string
  givenName?: string
  familyName?: string
  nationality?: string
  permanentNumber?: string
}

interface RawConstructor {
  constructorId?: string
  name?: string
  nationality?: string
}

interface RawFastestLap {
  rank?: string
  lap?: string
  Time?: { time?: string }
}

interface RawResult {
  position?: string
  positionText?: string
  points?: string
  grid?: string
  laps?: string
  status?: string
  Time?: { millis?: string; time?: string }
  FastestLap?: RawFastestLap
  Driver?: RawDriver
  Constructor?: RawConstructor
}

interface RawSession {
  date?: string
  time?: string
}

interface RawRace {
  season?: string
  round?: string
  raceName?: string
  Circuit?: {
    circuitId?: string
    circuitName?: string
    Location?: { lat?: string; long?: string; locality?: string; country?: string }
  }
  date?: string
  time?: string
  FirstPractice?: RawSession
  SecondPractice?: RawSession
  ThirdPractice?: RawSession
  Qualifying?: RawSession
  Sprint?: RawSession
  SprintQualifying?: RawSession
}

function str(v: unknown): string | null {
  if (typeof v === 'string' && v.trim() !== '') return v
  return null
}

function num(v: unknown): number | null {
  const s = str(v)
  if (s === null) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function normalizeDriver(raw: RawDriver | undefined): Driver | null {
  if (!raw) return null
  const givenName = str(raw.givenName)
  const familyName = str(raw.familyName)
  const code = str(raw.code) ?? (familyName ?? '').slice(0, 3).toUpperCase()
  if (!familyName && !givenName && !code) return null
  return {
    driverId: str(raw.driverId) ?? 'unknown',
    code,
    givenName: givenName ?? familyName ?? '',
    familyName: familyName ?? '',
    nationality: str(raw.nationality) ?? '',
    permanentNumber: str(raw.permanentNumber),
  }
}

function normalizeConstructor(raw: RawConstructor | undefined): Constructor | null {
  if (!raw) return null
  const name = str(raw.name)
  if (!name) return null
  return {
    constructorId: str(raw.constructorId) ?? name.toLowerCase().replace(/\s+/g, '_'),
    name,
    nationality: str(raw.nationality) ?? '',
  }
}

function normalizeRace(raw: RawRace): Race | null {
  const raceName = str(raw.raceName)
  const date = str(raw.date)
  if (!raceName || !date) return null
  const time = str(raw.time)
  const circuitId = str(raw.Circuit?.circuitId) ?? ''
  const circuitName = str(raw.Circuit?.circuitName)
  const locality = str(raw.Circuit?.Location?.locality)
  const country = str(raw.Circuit?.Location?.country)
  const lat = num(raw.Circuit?.Location?.lat)
  const long = num(raw.Circuit?.Location?.long)
  const start = time ? new Date(`${date}T${time}`) : new Date(`${date}T00:00:00Z`)
  const weekend: Race['weekend'] = {}
  const sessions: Array<[SessionKey, RawSession | undefined]> = [
    ['firstPractice', raw.FirstPractice],
    ['secondPractice', raw.SecondPractice],
    ['thirdPractice', raw.ThirdPractice],
    ['qualifying', raw.Qualifying],
    ['sprint', raw.Sprint],
    ['sprintQualifying', raw.SprintQualifying],
  ]
  for (const [key, sess] of sessions) {
    if (!sess) continue
    const sDate = str(sess.date)
    if (!sDate) continue
    const sTime = str(sess.time)
    const sStart = sTime ? new Date(`${sDate}T${sTime}`) : null
    weekend[key] = {
      date: sDate,
      time: sTime,
      start: sStart && Number.isNaN(sStart.getTime()) ? null : sStart,
    }
  }
  return {
    round: num(raw.round) ?? 0,
    raceName,
    circuitId,
    circuitName: circuitName ?? '',
    locality: locality ?? '',
    country: country ?? '',
    date,
    time,
    start: Number.isNaN(start.getTime()) ? null : start,
    lat,
    long,
    weekend,
  }
}

function normalizeFastestLap(raw: RawFastestLap | undefined): FastestLap | null {
  if (!raw) return null
  const time = str(raw.Time?.time)
  if (!time) return null
  return {
    rank: num(raw.rank) ?? 0,
    lap: num(raw.lap) ?? 0,
    time,
  }
}

function normalizeResult(raw: RawResult): RaceResultRow | null {
  const driver = normalizeDriver(raw.Driver)
  const constructor = normalizeConstructor(raw.Constructor)
  if (!driver || !constructor) return null
  const time = str(raw.Time?.time)
  const position = num(raw.position)
  const grid = num(raw.grid)
  const isWinner = position !== null && position === 1
  const normalizedPositionText = (() => {
    const text = str(raw.positionText) ?? String(position ?? '')
    const s = text.trim().toUpperCase()
    if (
      s === 'R' ||
      s === 'RET' ||
      s === 'RETIRED' ||
      s === 'DNF' ||
      s === 'DID NOT FINISH' ||
      s === 'W' ||
      s === 'WITHDREW' ||
      s === 'WITHDRAWN'
    )
      return 'DNF'
    return text
  })()

  return {
    position: position ?? 0,
    positionText: normalizedPositionText,
    points: num(raw.points) ?? 0,
    grid,
    laps: num(raw.laps) ?? 0,
    status: normalizeRaceStatus(raw.status),
    time: time && isWinner ? time : null,
    gap: time && !isWinner ? time : null,
    driver,
    constructor,
    fastestLap: normalizeFastestLap(raw.FastestLap),
  }
}

interface RawScheduleResponse {
  MRData?: {
    RaceTable?: {
      season?: string
      Races?: RawRace[]
    }
  }
}

interface RawStandingsResponse {
  MRData?: {
    StandingsTable?: {
      StandingsLists?: Array<{
        DriverStandings?: Array<{
          position?: string
          points?: string
          wins?: string
          Driver?: RawDriver
          Constructors?: RawConstructor[]
        }>
        ConstructorStandings?: Array<{
          position?: string
          points?: string
          wins?: string
          Constructor?: RawConstructor
        }>
      }>
    }
  }
}

interface RawResultsResponse {
  MRData?: {
    total?: string
    RaceTable?: {
      season?: string
      round?: string
      Races?: Array<RawRace & { Results?: RawResult[] }>
    }
  }
}

interface RawSprintResponse {
  MRData?: {
    RaceTable?: {
      season?: string
      round?: string
      Races?: Array<RawRace & { SprintResults?: RawResult[] }>
    }
  }
}

interface RawQualifyingResult {
  position?: string
  Driver?: RawDriver
  Constructor?: RawConstructor
  Q1?: string
  Q2?: string
  Q3?: string
}

interface RawQualifyingResponse {
  MRData?: {
    RaceTable?: {
      season?: string
      round?: string
      Races?: Array<RawRace & { QualifyingResults?: RawQualifyingResult[] }>
    }
  }
}

interface RawPitStop {
  driverId?: string
  stop?: string
  lap?: string
  time?: string
  duration?: string
}

interface RawPitStopsResponse {
  MRData?: {
    RaceTable?: {
      season?: string
      round?: string
      Races?: Array<RawRace & { PitStops?: RawPitStop[] }>
    }
  }
}

async function request<T>(
  path: string,
  signal?: AbortSignal,
  opts?: { maxAttempts?: number },
): Promise<T> {
  const maxAttempts = opts?.maxAttempts ?? MAX_ATTEMPTS
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) throw new ApiError('Request aborted')
    const release = await acquire(signal)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const onOuterAbort = () => controller.abort()
    signal?.addEventListener('abort', onOuterAbort, { once: true })
    try {
      await waitForRequestGap()
      const res = await fetch(BASE + path, {
        signal: controller.signal,
        headers: { accept: 'application/json' },
      })
      if (!res.ok) {
        const retryAfterHeader = res.headers.get('Retry-After')
        const retryAfterMs = retryAfterHeader
          ? Number.parseFloat(retryAfterHeader) * 1000
          : null
        if (res.status === 429) {
          const waitMs = Number.isFinite(retryAfterMs)
            ? Math.max(retryAfterMs as number, RETRY_BASE_MS * 2)
            : RETRY_BASE_MS * 2
          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, waitMs))
            continue
          }
        }
        throw new ApiError(`API request failed (${res.status})`, res.status)
      }
      let json: unknown
      try {
        json = await res.json()
      } catch {
        throw new ApiError('API returned a malformed response')
      }
      return json as T
    } catch (err) {
      if (err instanceof ApiError) {
        lastError = err
      } else if (err instanceof DOMException && err.name === 'AbortError') {
        lastError = new ApiError('Request timed out')
      } else {
        lastError = new ApiError('Network error — could not reach the F1 data service', null, err)
      }
      if (signal?.aborted || !isTransient(lastError) || attempt >= maxAttempts - 1) {
        throw lastError
      }
      const backoff = Math.min(RETRY_BASE_MS * 2 ** attempt, MAX_BACKOFF_MS)
      await new Promise((resolve) => setTimeout(resolve, backoff))
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onOuterAbort)
      release()
    }
  }
  throw lastError
}

function seasonSegment(season: string): string {
  return season === 'current' || season === '' ? 'current' : season
}

export async function fetchSchedule(season: string, signal?: AbortSignal): Promise<Race[]> {
  const json = await request<RawScheduleResponse>(`/${seasonSegment(season)}.json`, signal)
  const races = (json.MRData?.RaceTable?.Races ?? [])
    .map(normalizeRace)
    .filter((r): r is Race => r !== null)
    .sort((a, b) => a.round - b.round)
  return races
}

export async function fetchDriverStandings(season: string, signal?: AbortSignal): Promise<DriverStandingRow[]> {
  const json = await request<RawStandingsResponse>(`/${seasonSegment(season)}/driverstandings.json`, signal)
  const list = json.MRData?.StandingsTable?.StandingsLists?.[0]
  const rows: DriverStandingRow[] = []
  for (const raw of list?.DriverStandings ?? []) {
    const driver = normalizeDriver(raw.Driver)
    const constructor = normalizeConstructor(raw.Constructors?.[0])
    if (!driver || !constructor) continue
    rows.push({
      position: num(raw.position) ?? 0,
      points: num(raw.points) ?? 0,
      wins: num(raw.wins) ?? 0,
      driver,
      constructor,
    })
  }
  return rows
}

export async function fetchConstructorStandings(season: string, signal?: AbortSignal): Promise<ConstructorStandingRow[]> {
  const json = await request<RawStandingsResponse>(`/${seasonSegment(season)}/constructorstandings.json`, signal)
  const list = json.MRData?.StandingsTable?.StandingsLists?.[0]
  const rows: ConstructorStandingRow[] = []
  for (const raw of list?.ConstructorStandings ?? []) {
    const constructor = normalizeConstructor(raw.Constructor)
    if (!constructor) continue
    rows.push({
      position: num(raw.position) ?? 0,
      points: num(raw.points) ?? 0,
      wins: num(raw.wins) ?? 0,
      constructor,
    })
  }
  return rows
}

export async function fetchRaceResults(season: string, round: number, signal?: AbortSignal): Promise<RaceDetail | null> {
  const json = await request<RawResultsResponse>(`/${seasonSegment(season)}/${round}/results.json`, signal)
  const rawRace = json.MRData?.RaceTable?.Races?.[0]
  if (!rawRace) return null
  const race = normalizeRace(rawRace)
  if (!race) return null
  const results: RaceResultRow[] = (rawRace.Results ?? [])
    .map(normalizeResult)
    .filter((r): r is RaceResultRow => r !== null)
    .sort((a, b) => a.position - b.position)
  return {
    season: json.MRData?.RaceTable?.season ?? '',
    round: race.round,
    race,
    results,
  }
}

export async function fetchSprint(season: string, round: number, signal?: AbortSignal): Promise<RaceDetail | null> {
  const json = await request<RawSprintResponse>(`/${seasonSegment(season)}/${round}/sprint.json`, signal)
  const rawRace = json.MRData?.RaceTable?.Races?.[0]
  if (!rawRace) return null
  const race = normalizeRace(rawRace)
  if (!race) return null
  const results: RaceResultRow[] = (rawRace.SprintResults ?? [])
    .map(normalizeResult)
    .filter((r): r is RaceResultRow => r !== null)
    .sort((a, b) => a.position - b.position)
  return {
    season: json.MRData?.RaceTable?.season ?? '',
    round: race.round,
    race,
    results,
  }
}

interface RawLapTiming {
  driverId?: string
  position?: string
  time?: string
}

interface RawLap {
  number?: string
  Timings?: RawLapTiming[]
}

interface RawLapsResponse {
  MRData?: {
    total?: string
    RaceTable?: {
      season?: string
      round?: string
      Races?: Array<RawRace & { Laps?: RawLap[] }>
    }
  }
}

const LAPS_PAGE = 100

export async function fetchLaps(season: string, round: number, signal?: AbortSignal): Promise<LapChartDetail | null> {
  let offset = 0
  let total = 0
  let race: Race | null = null
  let seasonStr = ''
  const byLap = new Map<number, LapTiming[]>()

  do {
    const json = await request<RawLapsResponse>(
      `/${seasonSegment(season)}/${round}/laps.json?limit=${LAPS_PAGE}&offset=${offset}`,
      signal,
      { maxAttempts: 8 },
    )
    const raceTable = json.MRData?.RaceTable
    total = Number(json.MRData?.total ?? 0)
    if (!race) {
      const rawRace = raceTable?.Races?.[0]
      if (rawRace) {
        race = normalizeRace(rawRace)
        seasonStr = raceTable?.season ?? ''
      }
    }
    const pageLaps = raceTable?.Races?.[0]?.Laps ?? []
    for (const raw of pageLaps) {
      const lap = num(raw.number)
      if (lap === null) continue
      const timings: LapTiming[] = (raw.Timings ?? [])
        .map((t): LapTiming | null => {
          const driverId = str(t.driverId)
          const position = num(t.position)
          if (!driverId || position === null) return null
          return { driverId, position, time: str(t.time) ?? '' }
        })
        .filter((t): t is LapTiming => t !== null)
      const existing = byLap.get(lap)
      if (existing) existing.push(...timings)
      else byLap.set(lap, timings)
    }
    if (pageLaps.length === 0 || signal?.aborted || offset + LAPS_PAGE >= total) break
    offset += LAPS_PAGE
  } while (offset < total)

  if (!race) return null
  const laps: Lap[] = [...byLap.entries()]
    .map(([lap, timings]) => ({ lap, timings: timings.sort((a, b) => a.position - b.position) }))
    .sort((a, b) => a.lap - b.lap)
  return {
    season: seasonStr,
    round: race.round,
    race,
    laps,
  }
}

export async function fetchQualifying(season: string, round: number, signal?: AbortSignal): Promise<QualifyingDetail | null> {
  const json = await request<RawQualifyingResponse>(`/${seasonSegment(season)}/${round}/qualifying.json`, signal)
  const rawRace = json.MRData?.RaceTable?.Races?.[0]
  if (!rawRace) return null
  const race = normalizeRace(rawRace)
  if (!race) return null
  const rows: QualifyingRow[] = (rawRace.QualifyingResults ?? [])
    .map((raw): QualifyingRow | null => {
      const driver = normalizeDriver(raw.Driver)
      const constructor = normalizeConstructor(raw.Constructor)
      if (!driver || !constructor) return null
      return {
        position: num(raw.position) ?? 0,
        driver,
        constructor,
        q1: str(raw.Q1),
        q2: str(raw.Q2),
        q3: str(raw.Q3),
      }
    })
    .filter((r): r is QualifyingRow => r !== null)
    .sort((a, b) => a.position - b.position)
  return {
    season: json.MRData?.RaceTable?.season ?? '',
    round: race.round,
    race,
    rows,
  }
}

export async function fetchPitStops(season: string, round: number, signal?: AbortSignal): Promise<PitStopDetail | null> {
  const json = await request<RawPitStopsResponse>(`/${seasonSegment(season)}/${round}/pitstops.json`, signal)
  const rawRace = json.MRData?.RaceTable?.Races?.[0]
  if (!rawRace) return null
  const race = normalizeRace(rawRace)
  if (!race) return null
  const stops: PitStopRow[] = (rawRace.PitStops ?? [])
    .map((raw): PitStopRow | null => {
      const driverId = str(raw.driverId)
      if (!driverId) return null
      return {
        driverId,
        stop: num(raw.stop) ?? 0,
        lap: num(raw.lap) ?? 0,
        time: str(raw.time) ?? '',
        duration: num(raw.duration),
      }
    })
    .filter((r): r is PitStopRow => r !== null)
    .sort((a, b) => a.stop - b.stop)
  return {
    season: json.MRData?.RaceTable?.season ?? '',
    round: race.round,
    race,
    stops,
  }
}

const SEASON_CHUNK = 6
const CHUNK_DELAY_MS = 120

const RESULTS_PAGE = 100

async function fetchEntityResults(
  kind: 'drivers' | 'constructors',
  id: string,
  signal?: AbortSignal,
): Promise<CareerRace[]> {
  const out: CareerRace[] = []
  let offset = 0
  let total = 0
  do {
    const json = await request<RawResultsResponse>(
      `/${kind}/${id}/results.json?limit=${RESULTS_PAGE}&offset=${offset}`,
      signal,
    )
    const table = json.MRData?.RaceTable
    total = Number(json.MRData?.total ?? 0)
    const races = table?.Races ?? []
    for (const raw of races) {
      const season = str(raw.season) ?? ''
      const round = num(raw.round)
      if (round === null) continue
      for (const res of raw.Results ?? []) {
        const row = normalizeResult(res)
        if (row) out.push({ season, round, row })
      }
    }
    if (races.length === 0 || signal?.aborted || offset + RESULTS_PAGE >= total) break
    offset += RESULTS_PAGE
  } while (offset < total)
  return out
}

export function fetchDriverResultsAll(driverId: string, signal?: AbortSignal): Promise<CareerRace[]> {
  return fetchEntityResults('drivers', driverId, signal)
}

export function fetchConstructorResultsAll(constructorId: string, signal?: AbortSignal): Promise<CareerRace[]> {
  return fetchEntityResults('constructors', constructorId, signal)
}

async function fetchEntitySeasonResults(
  kind: 'drivers' | 'constructors',
  id: string,
  season: string,
  signal?: AbortSignal,
): Promise<CareerRace[]> {
  const out: CareerRace[] = []
  let offset = 0
  let total = 0
  do {
    const json = await request<RawResultsResponse>(
      `/${seasonSegment(season)}/${kind}/${id}/results.json?limit=${RESULTS_PAGE}&offset=${offset}`,
      signal,
    )
    const table = json.MRData?.RaceTable
    total = Number(json.MRData?.total ?? 0)
    const races = table?.Races ?? []
    for (const raw of races) {
      const round = num(raw.round)
      if (round === null) continue
      for (const res of raw.Results ?? []) {
        const row = normalizeResult(res)
        if (row) out.push({ season, round, row })
      }
    }
    if (races.length === 0 || signal?.aborted || offset + RESULTS_PAGE >= total) break
    offset += RESULTS_PAGE
  } while (offset < total)
  return out
}

export function fetchDriverSeasonResults(driverId: string, season: string, signal?: AbortSignal): Promise<CareerRace[]> {
  return fetchEntitySeasonResults('drivers', driverId, season, signal)
}

export function fetchConstructorSeasonResults(
  constructorId: string,
  season: string,
  signal?: AbortSignal,
): Promise<CareerRace[]> {
  return fetchEntitySeasonResults('constructors', constructorId, season, signal)
}

export interface SeasonStanding {
  position: number | null
  points: number
  wins: number
}

export async function fetchDriverSeasonStanding(
  driverId: string,
  season: string,
  signal?: AbortSignal,
): Promise<SeasonStanding | null> {
  const json = await request<RawStandingsResponse>(`/${season}/drivers/${driverId}/driverstandings.json`, signal)
  const raw = json.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings?.[0]
  if (!raw) return null
  return {
    position: num(raw.position),
    points: num(raw.points) ?? 0,
    wins: num(raw.wins) ?? 0,
  }
}

export async function fetchConstructorSeasonStanding(
  constructorId: string,
  season: string,
  signal?: AbortSignal,
): Promise<SeasonStanding | null> {
  const json = await request<RawStandingsResponse>(`/${season}/constructors/${constructorId}/constructorstandings.json`, signal)
  const raw = json.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings?.[0]
  if (!raw) return null
  return {
    position: num(raw.position),
    points: num(raw.points) ?? 0,
    wins: num(raw.wins) ?? 0,
  }
}

export interface SeasonChampion {
  driverId: string
  constructorIds: string[]
}

export async function fetchSeasonDriverChampion(season: string, signal?: AbortSignal): Promise<SeasonChampion | null> {
  const json = await request<RawStandingsResponse>(`/${season}/driverstandings.json?limit=1`, signal)
  const raw = json.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings?.[0]
  const driverId = str(raw?.Driver?.driverId)
  if (!driverId) return null
  const constructorIds = (raw?.Constructors ?? [])
    .map((c) => str(c.constructorId))
    .filter((c): c is string => c !== null)
  return { driverId, constructorIds }
}

export async function fetchSeasonResults(
  season: string,
  rounds: number[],
  signal?: AbortSignal,
): Promise<SeasonRoundResults[]> {
  const out: SeasonRoundResults[] = []
  for (let i = 0; i < rounds.length; i += SEASON_CHUNK) {
    const chunk = rounds.slice(i, i + SEASON_CHUNK)
    const settled = await Promise.allSettled(chunk.map((r) => fetchRaceResults(season, r, signal)))
    settled.forEach((res, idx) => {
      if (res.status === 'fulfilled' && res.value) {
        out.push({ round: chunk[idx], results: res.value.results })
      }
    })
    if (i + SEASON_CHUNK < rounds.length && !signal?.aborted) {
      await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY_MS))
    }
  }
  return out.sort((a, b) => a.round - b.round)
}