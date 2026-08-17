// Generates src/lib/circuitTracks.ts from the MIT-licensed bacinger/f1-circuits dataset.
// Run with: node scripts/build-circuits.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = 'https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/'
const OUT = join(__dirname, '..', 'src', 'lib', 'circuitTracks.ts')

// Ergast circuitId -> candidate dataset ids (first that resolves wins).
const MAPPING = {
  albert_park: ['au-1953'],
  silverstone: ['gb-1948'],
  red_bull_ring: ['at-1969'],
  villeneuve: ['ca-1978'],
  americas: ['us-2012'],
  miami: ['us-2022'],
  las_vegas: ['us-2023', 'us-1981'],
  jeddah: ['sa-2021'],
  lusail: ['qa-2004'],
  yas_marina: ['ae-2009'],
  hungaroring: ['hu-1986'],
  monza: ['it-1922'],
  monaco: ['mc-1929'],
  spa: ['be-1925'],
  francorchamps: ['be-1925'],
  suzuka: ['jp-1962'],
  interlagos: ['br-1940'],
  jacarepagua: ['br-1977'],
  istanbul: ['tr-2005'],
  sochi: ['ru-2014'],
  marina_bay: ['sg-2008'],
  shanghai: ['cn-2004'],
  sepang: ['my-1999'],
  baku: ['az-2016'],
  bahrain: ['bh-2002'],
  portimao: ['pt-2008'],
  algarve: ['pt-2008'],
  paul_ricard: ['fr-1969'],
  magny_cours: ['fr-1960'],
  imola: ['it-1953'],
  nurburgring: ['de-1984', 'de-1927', 'de-1967'],
  hockenheimring: ['de-1932', 'de-2002'],
  indianapolis: ['us-1909'],
  catalunya: ['es-1991'],
  barcelona: ['es-1991', 'es-2021'],
  zandvoort: ['nl-1948'],
  mexico: ['mx-1962'],
  kyalami: ['za-1961'],
  madrid: ['es-2026'],
  valencia: ['es-2008'],
  yeongam: ['kr-2010'],
  buddh: ['in-2011'],
  adelaide: ['au-1985'],
  detroit: ['us-1982'],
  long_beach: ['us-1976'],
  dallas: ['us-1983'],
  phoenix: ['us-1989'],
  jerez: ['es-1986'],
  estoril: ['pt-1972'],
  zolder: ['be-1973'],
  brands_hatch: ['gb-1964'],
  donington: ['gb-1977'],
  watkins_glen: ['us-1956'],
  monte_carlo: ['mc-1929'],
  montjuic: ['es-1966'],
  imola85: ['it-1953'],
  ricard: ['fr-1969'],
  clermont_ferrand: ['fr-1958'],
  dijon: ['fr-1972'],
  mugello: ['it-1974'],
  anderstorp: ['se-1968'],
  mont_tremblant: ['ca-1967'],
  a1_ring: ['at-1969'],
  nurburg: ['de-1984', 'de-1927', 'de-1967'],
  hockenheim: ['de-1932', 'de-2002'],
  oscar_galvez: ['ar-1952'],
  river_plate: ['ar-1952'],
  zeltweg: ['at-1969'],
  monza_old: ['it-1922'],
}

const SKIP = new Set([])

function dedupe(points, threshold = 0.05) {
  const out = []
  for (const p of points) {
    const last = out[out.length - 1]
    if (!last || Math.abs(p[0] - last[0]) >= threshold || Math.abs(p[1] - last[1]) >= threshold) {
      out.push(p)
    }
  }
  return out
}

function project(coords, bbox) {
  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity
  for (const [lon, lat] of coords) {
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  const latMid = ((minLat + maxLat) / 2) * (Math.PI / 180)
  const cosMid = Math.cos(latMid)
  const width = (maxLon - minLon) * cosMid
  const height = maxLat - minLat
  const span = Math.max(width, height, 1e-6)
  const PAD = 7
  const scale = (100 - 2 * PAD) / span
  const drawW = width * scale
  const drawH = height * scale
  const offsetX = PAD + (100 - 2 * PAD - drawW) / 2
  const offsetY = PAD + (100 - 2 * PAD - drawH) / 2
  const pts = coords.map(([lon, lat]) => {
    const x = offsetX + (lon - minLon) * cosMid * scale
    const y = offsetY + (maxLat - lat) * scale
    return [round2(x), round2(y)]
  })
  const cleaned = dedupe(pts)
  return cleaned
}

function round2(v) {
  return Math.round(v * 100) / 100
}

function pathD(points) {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`)
    .join(' ')
}

async function fetchTrack(candidates) {
  for (const id of candidates) {
    try {
      const res = await fetch(BASE + id + '.geojson')
      if (!res.ok) continue
      const json = await res.json()
      const feature = json?.features?.[0]
      const geometry = feature?.geometry
      if (!feature || geometry?.type !== 'LineString' || !Array.isArray(geometry.coordinates)) continue
      const name = feature.properties?.Name ?? id
      const lengthM = Number(feature.properties?.length) || 0
      return { id, name, lengthM, coords: geometry.coordinates, bbox: feature.bbox ?? json.bbox ?? null }
    } catch {
      continue
    }
  }
  return null
}

function isLatLonOrder(coords) {
  for (const c of coords.slice(0, 5)) {
    if (Math.abs(c[0]) > 90 || Math.abs(c[1]) <= 90) return false
  }
  return true
}

async function main() {
  const entries = []
  const missing = []
  for (const [ergastId, candidates] of Object.entries(MAPPING)) {
    if (SKIP.has(ergastId)) continue
    const track = await fetchTrack(candidates)
    if (!track) {
      missing.push(ergastId)
      continue
    }
    let coords = track.coords
    if (isLatLonOrder(coords)) {
      coords = coords.map(([lat, lon]) => [lon, lat])
    }
    const points = project(coords, track.bbox)
    entries.push({
      key: ergastId,
      name: track.name,
      lengthM: track.lengthM,
      d: pathD(points),
      start: points[0],
    })
  }

  const lines = []
  lines.push('// GENERATED by scripts/build-circuits.mjs — do not edit by hand.')
  lines.push('// Track geometry from bacinger/f1-circuits (MIT) — https://github.com/bacinger/f1-circuits')
  lines.push('export interface CircuitTrack {')
  lines.push('  name: string')
  lines.push('  lengthM: number')
  lines.push('  d: string')
  lines.push('  start: [number, number]')
  lines.push('}')
  lines.push('')
  lines.push('export const CIRCUIT_TRACKS: Record<string, CircuitTrack> = {')
  for (const e of entries) {
    lines.push(`  ${JSON.stringify(e.key)}: {`)
    lines.push(`    name: ${JSON.stringify(e.name)},`)
    lines.push(`    lengthM: ${e.lengthM},`)
    lines.push(`    d: ${JSON.stringify(e.d)},`)
    lines.push(`    start: [${e.start[0]}, ${e.start[1]}],`)
    lines.push('  },')
  }
  lines.push('}')
  lines.push('')

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, lines.join('\n'), 'utf8')
  console.log(`Wrote ${OUT} — ${entries.length} circuits.`)
  if (missing.length > 0) console.log('Missing (fallback in UI):', missing.join(', '))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})