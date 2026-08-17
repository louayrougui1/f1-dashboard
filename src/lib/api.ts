import type {
  Constructor,
  ConstructorStandingRow,
  Driver,
  DriverStandingRow,
  FastestLap,
  Race,
  RaceDetail,
  RaceResultRow,
} from './types'

const BASE = 'https://api.jolpi.ca/ergast/f1'
const TIMEOUT_MS = 20000

export class ApiError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = 'ApiError'
  }
}

interface RawDriver {
  driverId?: string
  code?: string
  givenName?: string
  familyName?: string
  nationality?: string
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

interface RawRace {
  round?: string
  raceName?: string
  Circuit?: {
    circuitName?: string
    Location?: { locality?: string; country?: string }
  }
  date?: string
  time?: string
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
  const circuitName = str(raw.Circuit?.circuitName)
  const locality = str(raw.Circuit?.Location?.locality)
  const country = str(raw.Circuit?.Location?.country)
  const start = time ? new Date(`${date}T${time}`) : new Date(`${date}T00:00:00Z`)
  return {
    round: num(raw.round) ?? 0,
    raceName,
    circuitName: circuitName ?? '',
    locality: locality ?? '',
    country: country ?? '',
    date,
    time,
    start: Number.isNaN(start.getTime()) ? null : start,
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
  return {
    position: position ?? 0,
    positionText: str(raw.positionText) ?? String(position ?? ''),
    points: num(raw.points) ?? 0,
    grid,
    laps: num(raw.laps) ?? 0,
    status: str(raw.status) ?? '',
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
    RaceTable?: {
      season?: string
      round?: string
      Races?: Array<RawRace & { Results?: RawResult[] }>
    }
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const onOuterAbort = () => controller.abort()
  signal?.addEventListener('abort', onOuterAbort, { once: true })
  try {
    const res = await fetch(BASE + path, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
    if (!res.ok) {
      throw new ApiError(`API request failed (${res.status})`)
    }
    let json: unknown
    try {
      json = await res.json()
    } catch {
      throw new ApiError('API returned a malformed response')
    }
    return json as T
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out')
    }
    throw new ApiError('Network error — could not reach the F1 data service', err)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onOuterAbort)
  }
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