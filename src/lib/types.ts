export interface Driver {
  driverId: string
  code: string
  givenName: string
  familyName: string
  nationality: string
}

export interface Constructor {
  constructorId: string
  name: string
  nationality: string
}

export interface Race {
  round: number
  raceName: string
  circuitName: string
  locality: string
  country: string
  date: string
  time: string | null
  start: Date | null
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