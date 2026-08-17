import type { Race, SessionKey } from '../lib/types'
import { display, formatBroadcastTime } from '../lib/format'

const SESSIONS: Array<{ key: SessionKey; label: string }> = [
  { key: 'firstPractice', label: 'FP1' },
  { key: 'secondPractice', label: 'FP2' },
  { key: 'thirdPractice', label: 'FP3' },
  { key: 'sprintQualifying', label: 'SQ' },
  { key: 'sprint', label: 'SPR' },
  { key: 'qualifying', label: 'QUAL' },
]

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function dateLabel(date: string | null): string {
  if (!date) return 'N/A'
  const m = date.match(/^\d{4}-(\d{2})-(\d{2})$/)
  if (!m) return 'N/A'
  const month = Number(m[1])
  const day = Number(m[2])
  if (month < 1 || month > 12 || day < 1 || day > 31) return 'N/A'
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]}`
}

export function WeekendSchedule({ race }: { race: Race | null }) {
  const sessions = SESSIONS.map((s) => ({
    ...s,
    session: race?.weekend[s.key] ?? null,
  })).filter((s) => s.session !== null)

  if (sessions.length === 0) return null

  return (
    <div className="border-t border-line">
      <div className="flex items-baseline justify-between gap-3 px-6 pt-5 sm:px-7">
        <p className="label text-[10px] text-muted/70">Weekend Schedule</p>
        <p className="label text-[10px] text-muted/40">All times UTC</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
        {sessions.map((s) => (
          <div key={s.key} className="min-w-0 bg-surface px-4 py-3.5">
            <p className="label text-[10px] tracking-[0.2em] text-accent">{s.label}</p>
            <p className="mono-num mt-1.5 truncate text-sm font-semibold text-text">
              {dateLabel(s.session?.date ?? null)}
            </p>
            <p className="mono-num mt-0.5 truncate text-[10px] text-muted">
              {display(formatBroadcastTime(s.session?.start ?? null))}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}