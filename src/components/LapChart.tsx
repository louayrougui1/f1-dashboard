import { useMemo } from 'react'
import type { LapChartDetail, RaceResultRow } from '../lib/types'
import { display, driverCode, roundLabel } from '../lib/format'
import { teamColor } from '../lib/teamColors'
import { ErrorState } from './ErrorState'
import { TableSkeleton } from './Skeleton'

const W = 760
const H = 360
const PAD = { top: 18, right: 78, bottom: 36, left: 40 }
const MAX_SERIES = 8

interface Pt {
  x: number
  y: number
}

interface Series {
  id: string
  code: string
  color: string
  segments: Pt[][]
  last: Pt
  finalPos: number
}

export function LapChart({
  raceName,
  round,
  detail,
  resultRows,
  loading,
  error,
  upcoming,
  onRetry,
}: {
  raceName: string | null
  round: number | null
  detail: LapChartDetail | null
  resultRows: RaceResultRow[]
  loading: boolean
  error: Error | null
  upcoming: boolean
  onRetry: () => void
}) {
  const chart = useMemo(() => {
    const laps = detail?.laps ?? []
    const n = laps.length
    const drivers = new Map<string, RaceResultRow>()
    for (const r of resultRows) drivers.set(r.driver.driverId, r)

    const posMap = new Map<string, number[]>()
    for (let i = 0; i < n; i++) {
      for (const t of laps[i].timings) {
        let arr = posMap.get(t.driverId)
        if (!arr) {
          arr = new Array<number>(n).fill(-1)
          posMap.set(t.driverId, arr)
        }
        arr[i] = t.position
      }
    }

    const innerW = W - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom
    const x = (i: number) => (n <= 1 ? PAD.left + innerW / 2 : PAD.left + (i * innerW) / (n - 1))

    const selected = [...posMap.entries()]
      .map(([id, arr]) => {
        const row = drivers.get(id)
        const lastPos = [...arr].reverse().find((p) => p > 0) ?? 0
        const points = arr.filter((p) => p > 0).length
        return { id, arr, row, lastPos, points }
      })
      .filter((s) => s.lastPos > 0 && s.points >= 2)
      .sort((a, b) => {
        const ap = a.row ? a.row.position : a.lastPos
        const bp = b.row ? b.row.position : b.lastPos
        return ap - bp
      })
      .slice(0, MAX_SERIES)

    let maxPos = 10
    for (const s of selected) {
      for (const p of s.arr) if (p > maxPos) maxPos = p
    }
    const y = (pos: number) => PAD.top + (pos - 1) * (innerH / Math.max(1, maxPos - 1))

    const series: Series[] = selected.map((s) => {
      const segments: Pt[][] = []
      let cur: Pt[] = []
      for (let i = 0; i < s.arr.length; i++) {
        if (s.arr[i] > 0) {
          cur.push({ x: x(i), y: y(s.arr[i]) })
        } else if (cur.length > 0) {
          segments.push(cur)
          cur = []
        }
      }
      if (cur.length > 0) segments.push(cur)
      const lastSeg = segments[segments.length - 1]
      const last = lastSeg[lastSeg.length - 1]
      return {
        id: s.id,
        code: s.row ? driverCode(s.row.driver) : s.id.toUpperCase().slice(0, 3),
        color: s.row ? teamColor(s.row.constructor.constructorId) : teamColor(null),
        segments,
        last,
        finalPos: s.lastPos,
      }
    })

    const lapLabels: number[] = []
    for (let i = 0; i < n; i += 5) lapLabels.push(i)
    const posLabels = [1, 5, 10, 15, 20].filter((p) => p <= maxPos)
    return { series, x, y, innerW, lapLabels, posLabels }
  }, [detail, resultRows])

  if (loading && !detail) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <TableSkeleton rows={7} cols={3} />
      </div>
    )
  }
  if (error && !detail) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <ErrorState onRetry={onRetry} />
      </div>
    )
  }
  if (upcoming && !detail) {
    return (
      <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-4 py-6">
        <p className="label text-text">Lap Chart</p>
        <p className="text-xs text-muted">Lap-by-lap data has not been published yet.</p>
      </div>
    )
  }
  if (!detail || detail.laps.length === 0 || chart.series.length === 0) {
    return (
      <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-4 py-6">
        <p className="label text-text">Lap Chart</p>
        <p className="text-xs text-muted">Lap-by-lap data is not available for this round.</p>
      </div>
    )
  }

  const { series, x, y, innerW, lapLabels, posLabels } = chart

  return (
    <div className="rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-bg-secondary/50 px-4 py-2.5 lg:px-5">
        <p className="label min-w-0 truncate text-text">Lap Chart</p>
        <p className="label text-[10px] text-muted/70">
          {raceName ? `${display(raceName)} · ${display(roundLabel(round))}` : 'Position over race distance'}
        </p>
      </div>
      <div className="px-3 pt-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Driver positions by lap">
          {posLabels.map((p) => (
            <g key={`ph-${p}`}>
              <line
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={y(p)}
                y2={y(p)}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />
              <text x={PAD.left - 6} y={y(p) + 3} textAnchor="end" fontSize={9} fill="var(--color-muted)" className="mono-num">
                {p}
              </text>
            </g>
          ))}
          {lapLabels.map((i) => (
            <line
              key={`xv-${i}`}
              x1={x(i)}
              x2={x(i)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
          ))}
          {lapLabels.map((i) => (
            <text
              key={`xl-${i}`}
              x={x(i)}
              y={H - 14}
              textAnchor="middle"
              fontSize={9}
              fill="var(--color-muted)"
              className="mono-num"
            >
              {detail.laps[i].lap}
            </text>
          ))}
          {series.map((s) => (
            <g key={s.id}>
              {s.segments.map((seg, si) =>
                seg.length === 1 ? (
                  <circle key={`${s.id}-${si}`} cx={seg[0].x} cy={seg[0].y} r={2} fill={s.color} />
                ) : (
                  <path
                    key={`${s.id}-${si}`}
                    d={seg.map((p, pi) => `${pi === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={1.8}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                ),
              )}
              <circle cx={s.last.x} cy={s.last.y} r={3} fill={s.color} stroke="var(--color-bg)" strokeWidth={1.5} />
              <text
                x={s.last.x + 6}
                y={s.last.y + 3}
                fontSize={10}
                fontWeight={600}
                fill={s.color}
                className="mono-num"
              >
                {s.code}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 pb-4 pt-2 lg:px-5">
        {series.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5 text-xs">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="truncate text-text">{s.code}</span>
            <span className="mono-num text-muted">P{s.finalPos}</span>
          </span>
        ))}
      </div>
      <p className="px-4 pb-3 text-[10px] text-muted/60 lg:px-5">
        Top {series.length} classified drivers · Line ends where a driver retires
      </p>
    </div>
  )
}