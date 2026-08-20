import type { CareerSeasonStats, Constructor, Driver, RecordSeason } from './types'
import type { SeasonChampion } from './api'

export interface StoredDriverSeason {
  constructor: Constructor
  stats: CareerSeasonStats
}

export interface StoredDriverSeasons {
  driver: Driver
  seasons: StoredDriverSeason[]
}

export interface DriverCareerBundle {
  lastSeason: string
  drivers: Record<string, StoredDriverSeasons>
}

export interface StoredConstructorSeasons {
  constructor: Constructor
  seasons: RecordSeason[]
}

export interface ConstructorRecordBundle {
  lastSeason: string
  champions: Record<string, SeasonChampion>
  constructors: Record<string, StoredConstructorSeasons>
}

let driverBundlePromise: Promise<DriverCareerBundle> | null = null
let constructorBundlePromise: Promise<ConstructorRecordBundle> | null = null

export function loadDriverCareerBundle(): Promise<DriverCareerBundle> {
  if (!driverBundlePromise) {
    driverBundlePromise = import('../data/driverCareers.json').then(
      (m) => m.default as DriverCareerBundle,
    )
  }
  return driverBundlePromise
}

export function loadConstructorRecordBundle(): Promise<ConstructorRecordBundle> {
  if (!constructorBundlePromise) {
    constructorBundlePromise = import('../data/constructorRecords.json').then(
      (m) => m.default as ConstructorRecordBundle,
    )
  }
  return constructorBundlePromise
}