export interface Driver {
  driverId: string
  code: string
  givenName: string
  familyName: string
  nationality: string
  permanentNumber: string | null
}

export interface Constructor {
  constructorId: string
  name: string
  nationality: string
}

export type SessionKey = 'firstPractice' | 'secondPractice' | 'thirdPractice' | 'qualifying' | 'sprint' | 'sprintQualifying'

export interface WeekendSession {
  date: string
  time: string | null
  start: Date | null
}

export interface Race {
  round: number
  raceName: string
  circuitId: string
  circuitName: string
  locality: string
  country: string
  date: string
  time: string | null
  start: Date | null
  lat: number | null
  long: number | null
  weekend: Partial<Record<SessionKey, WeekendSession>>
}

export interface DriverStandingRow {
  position: number
  points: number
  wins: number
  driver: Driver
  constructor: Constructor
}

export interface ConstructorStandingRow {
  position: number
  points: number
  wins: number
  constructor: Constructor
}

export interface FastestLap {
  rank: number
  lap: number
  time: string
}

export interface RaceResultRow {
  position: number
  positionText: string
  points: number
  grid: number | null
  laps: number
  status: string
  time: string | null
  gap: string | null
  driver: Driver
  constructor: Constructor
  fastestLap: FastestLap | null
}

export interface RaceDetail {
  season: string
  round: number
  race: Race
  results: RaceResultRow[]
}

export interface QualifyingRow {
  position: number
  driver: Driver
  constructor: Constructor
  q1: string | null
  q2: string | null
  q3: string | null
}

export interface QualifyingDetail {
  season: string
  round: number
  race: Race
  rows: QualifyingRow[]
}

export interface PitStopRow {
  driverId: string
  stop: number
  lap: number
  time: string
  duration: number | null
}

export interface PitStopDetail {
  season: string
  round: number
  race: Race
  stops: PitStopRow[]
}

export interface SeasonRoundResults {
  round: number
  results: RaceResultRow[]
}