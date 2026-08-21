import { useMemo } from 'react'
import type { SeasonRoundResults } from '../lib/types'
import { roundLabel } from '../lib/format'
import { teamColor } from '../lib/teamColors'
import { TableSkeleton } from './Skeleton'
import { ErrorState } from './ErrorState'

const W = 720
const H = 300
const PAD = { top: 18, right: 46, bottom: 30, left: 42 }

interface Series {
  id: string
  name: string
  color: string
  pts: number[]
  total: number
}

function niceStep(max: number): number {
  if (max > 600) return 100
  if (max > 300) return 50
  if (max > 150) return 25
  if (max > 60) return 20
  if (max > 30) return 10
  return 5
}

function buildSeries(rounds: SeasonRoundResults[]): {
  series: Series[]
  yTop: number
  gridY: number[]
} {
  const teams = new Map<string, { name: string; total: number }>()
  for (const r of rounds) {
    for (const res of r.results) {
      const t = teams.get(res.constructor.constructorId)
      if (t) t.total += res.points
      else teams.set(res.constructor.constructorId, { name: res.constructor.name, total: res.points })
    }
  }
  const top = [...teams.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 6)
  const series: Series[] = top.map(([id, t]) => {
    let cum = 0
    const pts = rounds.map((r) => {
      const p = r.results.filter((x) => x.constructor.constructorId === id).reduce((s, x) => s + x.points, 0)
      cum += p
      return cum
    })
    return { id, name: t.name, color: teamColor(id), pts, total: t.total }
  })
  const max = Math.max(1, ...series.flatMap((s) => s.pts))
  const step = niceStep(max)
  const yTop = Math.ceil(max / step) * step
  const gridY: number[] = []
  for (let v = 0; v <= yTop; v += step) gridY.push(v)
  return { series, yTop, gridY }
}

export function Progression({
  rounds,
  loading,
  error,
  onRetry,
}: {
  rounds: SeasonRoundResults[]
  loading: boolean
  error: Error | null
  onRetry: () => void
}) {
  const { series, yTop, gridY } = useMemo(() => buildSeries(rounds), [rounds])

  if (loading && rounds.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <TableSkeleton rows={7} cols={3} />
      </div>
    )
  }
  if (error && rounds.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <ErrorState onRetry={onRetry} />
      </div>
    )
  }
  if (rounds.length === 0) {
    return (
      <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-4 py-6">
        <p className="label text-text">Championship Progression</p>
        <p className="text-xs text-muted">No completed rounds yet for this season.</p>
      </div>
    )
  }

  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const n = rounds.length
  const x = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1))
  const y = (v: number) => PAD.top + innerH - (v * innerH) / yTop

  return (
    <div className="rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-bg-secondary/50 px-4 py-2.5 lg:px-5">
        <p className="label min-w-0 truncate text-text">Championship Progression</p>
        <p className="label text-[11px] text-muted/70">Cumulative Constructor Points</p>
      </div>
      <div className="px-3 pt-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Cumulative constructor points per round">
          {gridY.map((gv) => (
            <g key={gv}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(gv)}
                y2={y(gv)}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />
              <text x={PAD.left - 6} y={y(gv) + 3} textAnchor="end" fontSize={9} fill="var(--color-muted)" className="mono-num">
                {gv}
              </text>
            </g>
          ))}
          {rounds.map((r, i) => (
            <line
              key={`xv-${r.round}`}
              x1={x(i)}
              x2={x(i)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
          ))}
          {rounds.map((r, i) => (
            <text
              key={`xl-${r.round}`}
              x={x(i)}
              y={H - 10}
              textAnchor="middle"
              fontSize={9}
              fill="var(--color-muted)"
              className="mono-num"
            >
              {roundLabel(r.round).replace('R', '')}
            </text>
          ))}
          {series.map((s) => {
            const d = s.pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ')
            const lastX = x(n - 1)
            const lastY = y(s.pts[n - 1])
            return (
              <g key={s.id}>
                <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
                <circle cx={lastX} cy={lastY} r={3} fill={s.color} stroke="var(--color-bg)" strokeWidth={1.5} />
                <text
                  x={lastX + 6}
                  y={lastY + 3}
                  fontSize={10}
                  fontWeight={600}
                  fill={s.color}
                  className="mono-num"
                >
                  {s.pts[n - 1]}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 pb-4 pt-2 lg:px-5">
        {series.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5 text-xs">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="truncate text-text">{s.name}</span>
            <span className="mono-num text-muted">{s.total}</span>
          </span>
        ))}
      </div>
    </div>
  )
}