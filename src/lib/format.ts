import type { Driver } from './types'

const NA = 'N/A'

export function display(value: unknown): string {
  if (value === null || value === undefined) return NA
  const s = String(value).trim()
  if (s === '' || s === 'null' || s === 'undefined' || s === 'NaN' || s === '[object Object]') return NA
  return s
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return NA
  return String(value)
}

export function formatPoints(value: number | null | undefined): string {
  return formatNumber(value)
}

export function driverFullName(driver: Driver): string {
  const given = driver.givenName?.trim()
  const family = driver.familyName?.trim()
  if (given && family) return `${given} ${family}`
  return display(given || family || driver.code)
}

export function driverCode(driver: Driver): string {
  return display(driver.code)
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0')
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return NA
  const d = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return display(date)
  const day = d.getUTCDate()
  const month = d
    .toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })
    .toUpperCase()
  return `${day} ${month}`
}

export function formatRaceDateTime(start: Date | null): { date: string; time: string } {
  if (!start || Number.isNaN(start.getTime())) return { date: NA, time: NA }
  const day = start.getUTCDate()
  const month = start
    .toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })
    .toUpperCase()
  return {
    date: `${day} ${month} ${start.getUTCFullYear()}`,
    time: start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC',
  }
}

export function formatBroadcastDate(start: Date | null): string {
  if (!start || Number.isNaN(start.getTime())) return NA
  const weekday = start
    .toLocaleString('en-GB', { weekday: 'short', timeZone: 'UTC' })
    .toUpperCase()
  const day = start.getUTCDate()
  const month = start
    .toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })
    .toUpperCase()
  return `${weekday} ${pad(day)} ${month}`
}

export function roundLabel(round: number | null | undefined): string {
  if (round === null || round === undefined || Number.isNaN(round)) return NA
  return `R${pad(round, 2)}`
}

export function posTwo(position: number | string): string {
  const s = String(position).trim().toUpperCase()
  if (s === '' || s === NA) return NA
  if (/^[A-Z]$/.test(s)) return s
  const n = Number(s)
  if (Number.isFinite(n)) return pad(n, 2)
  return s
}

export function splitGrandPrix(raceName: string | null | undefined): { line1: string; line2: string } {
  const name = display(raceName)
  if (name === NA) return { line1: NA, line2: NA }
  const idx = name.toUpperCase().indexOf('GRAND PRIX')
  if (idx <= 0) return { line1: name.toUpperCase(), line2: '' }
  return {
    line1: name.slice(0, idx).trim().toUpperCase(),
    line2: name.slice(idx).trim().toUpperCase(),
  }
}

export function formatLastUpdated(d: Date | null): string {
  if (!d) return NA
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  return `${hh}:${mm}:${ss}`
}

export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  negative: boolean
}

export function getCountdown(target: Date | null, now: Date): Countdown {
  if (!target || Number.isNaN(target.getTime())) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, negative: false }
  }
  let diff = target.getTime() - now.getTime()
  const negative = diff < 0
  diff = Math.abs(diff)
  const seconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    negative,
  }
}

export function formatCountdown(target: Date | null, now: Date): string {
  const c = getCountdown(target, now)
  if (!target || Number.isNaN(target.getTime())) return NA
  if (c.negative) return 'IN PROGRESS'
  return `${pad(c.days)}D ${pad(c.hours)}H ${pad(c.minutes)}M`
}

export function positionLabel(position: number): string {
  return `P${position}`
}

export function formatLapTime(time: string | null | undefined): string {
  return display(time)
}

export function formatGap(gap: string | null | undefined, winnerTime: string | null | undefined): string {
  const g = display(gap)
  const w = display(winnerTime)
  if (g !== NA) return g
  return w
}

export function titleCase(s: string | null | undefined): string {
  const t = display(s)
  if (t === NA) return NA
  return t.toLowerCase().replace(/(^|[\s-])(\w)/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase())
}

export function hasValue(value: unknown): boolean {
  return display(value) !== NA
}