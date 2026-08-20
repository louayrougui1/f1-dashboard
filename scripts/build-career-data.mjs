// Generates src/data/driverCareers.json + src/data/constructorRecords.json from the Jolpica F1 API.
// These files hold the immutable historical career/record data (seasons through the last completed
// year) so the app never has to fetch it live. Run with: node scripts/build-career-data.mjs
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = 'https://api.jolpi.ca/ergast/f1'
const OUT_DIR = join(__dirname, '..', 'src', 'data')
const CACHE_DIR = join(__dirname, '..', 'node_modules', '.cache', 'career-data')
const FIRST_SEASON = 1950
const LAST_SEASON = String(new Date().getFullYear() - 1)
const MAX_ATTEMPTS = 6
const RETRY_BASE_MS = 800
const RETRY_CAP_MS = 8000
const REQUEST_GAP_MS = 400
const PAGE = 100

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function jitter(ms) {
  return Math.min(ms + Math.floor(Math.random() * 200), RETRY_CAP_MS)
}

function cachePath(path) {
  return join(CACHE_DIR, encodeURIComponent(path.replace(/^[/\\]+/, '')) + '.json')
}

function str(v) {
  if (typeof v === 'string' && v.trim() !== '') return v
  return null
}

function num(v) {
  const s = str(v)
  if (s === null) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function normalizeDriver(raw) {
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

function normalizeConstructor(raw) {
  if (!raw) return null
  const name = str(raw.name)
  if (!name) return null
  return {
    constructorId: str(raw.constructorId) ?? name.toLowerCase().replace(/\s+/g, '_'),
    name,
    nationality: str(raw.nationality) ?? '',
  }
}

async function fetchJson(path, attempt = 0) {
  const cp = cachePath(path)
  if (existsSync(cp)) {
    return JSON.parse(readFileSync(cp, 'utf8'))
  }
  try {
    const res = await fetch(BASE + path, { headers: { accept: 'application/json' } })
    if (!res.ok) {
      const retryable = res.status === 429 || res.status >= 500
      if (retryable && attempt < MAX_ATTEMPTS - 1) {
        const retryAfter = Number(res.headers.get('retry-after'))
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : jitter(RETRY_BASE_MS * 2 ** attempt)
        await sleep(delay)
        return fetchJson(path, attempt + 1)
      }
      throw new Error(`API request failed (${res.status}) for ${path}`)
    }
    const json = await res.json()
    mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(cp, JSON.stringify(json), 'utf8')
    return json
  } catch (err) {
    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(jitter(RETRY_BASE_MS * 2 ** attempt))
      return fetchJson(path, attempt + 1)
    }
    throw err
  }
}

async function fetchSeasonResults(season) {
  let offset = 0
  let total = 0
  const races = []
  do {
    const json = await fetchJson(`/${season}/results.json?limit=${PAGE}&offset=${offset}`)
    const mr = json?.MRData
    total = Number(mr?.total ?? 0)
    const pageRaces = mr?.RaceTable?.Races ?? []
    races.push(...pageRaces)
    const step = Number(mr?.limit ?? 0) || PAGE
    if (pageRaces.length === 0 || step <= 0 || offset + step >= total) break
    offset += step
    await sleep(REQUEST_GAP_MS)
  } while (offset < total)
  return races
}

async function fetchStandingsRows(season, kind) {
  // kind: 'driverstandings' | 'constructorstandings'
  let offset = 0
  let total = 0
  const rows = []
  do {
    const json = await fetchJson(`/${season}/${kind}.json?limit=${PAGE}&offset=${offset}`)
    const mr = json?.MRData
    total = Number(mr?.total ?? 0)
    const list = mr?.StandingsTable?.StandingsLists?.[0]
    rows.push(...(kind === 'driverstandings' ? list?.DriverStandings ?? [] : list?.ConstructorStandings ?? []))
    const step = Number(mr?.limit ?? 0) || PAGE
    if (rows.length >= total || step <= 0 || offset + step >= total) break
    offset += step
    await sleep(REQUEST_GAP_MS)
  } while (offset < total)
  return rows
}

async function main() {
  const years = []
  for (let y = FIRST_SEASON; y <= Number(LAST_SEASON); y++) years.push(String(y))

  const drivers = new Map() // driverId -> { driver, teams: Map<constructorId, { constructor, seasons: Map<season, stats> }> }
  const constructors = new Map() // constructorId -> { constructor, seasons: Map<season, RecordSeason> }
  const constructorRounds = new Map() // `${constructorId}:${season}` -> Set<`${season}:${round}`>
  const champions = {}
  const failures = []
  let resultRows = 0

  for (const season of years) {
    let results
    let driverStandings
    let constructorStandings
    try {
      results = await fetchSeasonResults(season)
      await sleep(REQUEST_GAP_MS)
      const driverRows = await fetchStandingsRows(season, 'driverstandings')
      await sleep(REQUEST_GAP_MS)
      const constructorRows = await fetchStandingsRows(season, 'constructorstandings')
      await sleep(REQUEST_GAP_MS)
      driverStandings = { MRData: { StandingsTable: { StandingsLists: [{ DriverStandings: driverRows }] } } }
      constructorStandings = { MRData: { StandingsTable: { StandingsLists: [{ ConstructorStandings: constructorRows }] } } }
    } catch (err) {
      failures.push(`${season}: ${err.message}`)
      await sleep(REQUEST_GAP_MS)
      continue
    }

    const driverPos = new Map()
    for (const raw of driverStandings?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? []) {
      const id = str(raw?.Driver?.driverId)
      if (!id) continue
      driverPos.set(id, {
        position: num(raw.position),
        constructorIds: (raw.Constructors ?? [])
          .map((c) => str(c.constructorId))
          .filter((c) => c !== null),
      })
    }
    const constructorPos = new Map()
    for (const raw of constructorStandings?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? []) {
      const id = str(raw?.Constructor?.constructorId)
      if (!id) continue
      constructorPos.set(id, num(raw.position))
    }
    const champion = [...driverPos.entries()].find(([, v]) => v.position === 1)
    if (champion) champions[season] = { driverId: champion[0], constructorIds: champion[1].constructorIds }

    for (const race of results ?? []) {
      const round = num(race.round)
      if (round === null) continue
      for (const raw of race.Results ?? []) {
        const driver = normalizeDriver(raw?.Driver)
        const constructor = normalizeConstructor(raw?.Constructor)
        if (!driver || !constructor) continue
        const position = num(raw.position)
        const grid = num(raw.grid)
        resultRows += 1

        let d = drivers.get(driver.driverId)
        if (!d) {
          d = { driver, teams: new Map() }
          drivers.set(driver.driverId, d)
        }
        let team = d.teams.get(constructor.constructorId)
        if (!team) {
          team = { constructor, seasons: new Map() }
          d.teams.set(constructor.constructorId, team)
        }
        let stats = team.seasons.get(season)
        if (!stats) {
          stats = {
            season,
            races: 0,
            wins: 0,
            podiums: 0,
            poles: 0,
            championshipPosition: driverPos.get(driver.driverId)?.position ?? null,
          }
          team.seasons.set(season, stats)
        }
        if (position !== null && position > 0) stats.races += 1
        if (position === 1) stats.wins += 1
        if (position !== null && position >= 1 && position <= 3) stats.podiums += 1
        if (grid === 1) stats.poles += 1

        let c = constructors.get(constructor.constructorId)
        if (!c) {
          c = { constructor, seasons: new Map() }
          constructors.set(constructor.constructorId, c)
        }
        let rs = c.seasons.get(season)
        if (!rs) {
          rs = {
            season,
            races: 0,
            wins: 0,
            podiums: 0,
            poles: 0,
            championshipPosition: constructorPos.get(constructor.constructorId) ?? null,
          }
          c.seasons.set(season, rs)
        }
        const roundsKey = `${constructor.constructorId}:${season}`
        let seen = constructorRounds.get(roundsKey)
        if (!seen) {
          seen = new Set()
          constructorRounds.set(roundsKey, seen)
        }
        const roundKey = `${season}:${round}`
        if (!seen.has(roundKey)) {
          seen.add(roundKey)
          rs.races += 1
        }
        if (position === 1) rs.wins += 1
        if (position !== null && position >= 1 && position <= 3) rs.podiums += 1
        if (grid === 1) rs.poles += 1
      }
    }
    console.log(`  ${season} done (${(results ?? []).length} races)`)
  }

  if (failures.length > 0) {
    console.error('Build failed — no files written:')
    for (const f of failures) console.error('  ' + f)
    process.exit(1)
  }

  const driverOut = {}
  for (const [id, d] of drivers) {
    const seasons = []
    for (const team of d.teams.values()) {
      for (const stats of team.seasons.values()) {
        seasons.push({ constructor: team.constructor, stats })
      }
    }
    seasons.sort((a, b) => a.stats.season.localeCompare(b.stats.season))
    driverOut[id] = { driver: d.driver, seasons }
  }

  const constructorOut = {}
  for (const [id, c] of constructors) {
    const seasons = [...c.seasons.values()].sort((a, b) => b.season.localeCompare(a.season))
    constructorOut[id] = { constructor: c.constructor, seasons }
  }

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, 'driverCareers.json'), JSON.stringify({ lastSeason: LAST_SEASON, drivers: driverOut }), 'utf8')
  writeFileSync(
    join(OUT_DIR, 'constructorRecords.json'),
    JSON.stringify({ lastSeason: LAST_SEASON, champions, constructors: constructorOut }),
    'utf8',
  )

  const driverSeasons = Object.values(driverOut).reduce((s, d) => s + d.seasons.length, 0)
  const constructorSeasons = Object.values(constructorOut).reduce((s, c) => s + c.seasons.length, 0)
  console.log(
    `Wrote ${OUT_DIR} — seasons ${FIRST_SEASON}–${LAST_SEASON}, ` +
      `${Object.keys(driverOut).length} drivers (${driverSeasons} season-records), ` +
      `${Object.keys(constructorOut).length} constructors (${constructorSeasons} season-records), ` +
      `${resultRows.toLocaleString()} result rows.`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})