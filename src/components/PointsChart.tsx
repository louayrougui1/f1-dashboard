const W = 720
const H = 150
const PAD = { top: 14, right: 42, bottom: 26, left: 34 }

function niceStep(max: number): number {
  if (max > 120) return 40
  if (max > 60) return 20
  if (max > 30) return 10
  return 5
}

export function PointsChart({
  pts,
  labels,
  color,
  ariaLabel,
}: {
  pts: number[]
  labels: string[]
  color: string
  ariaLabel: string
}) {
  const max = Math.max(1, ...pts)
  const step = niceStep(max)
  const yTop = Math.ceil(max / step) * step
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const n = pts.length
  const x = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1))
  const y = (v: number) => PAD.top + innerH - (v * innerH) / yTop
  const gridY: number[] = []
  for (let v = 0; v <= yTop; v += step) gridY.push(v)

  const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
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
      {labels.map((l, i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 8}
          textAnchor="middle"
          fontSize={9}
          fill="var(--color-muted)"
          className="mono-num"
        >
          {l}
        </text>
      ))}
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={color} stroke="var(--color-bg)" strokeWidth={1.5} />
      ))}
      <text x={x(n - 1) + 6} y={y(pts[n - 1]) + 3} fontSize={10} fontWeight={600} fill={color} className="mono-num">
        {pts[n - 1]}
      </text>
    </svg>
  )
}