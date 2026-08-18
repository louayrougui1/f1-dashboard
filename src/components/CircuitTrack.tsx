import type { CircuitTrack as Track } from '../lib/circuitTracks'
import { cn } from '@/lib/utils'

export function CircuitTrack({
  track,
  className,
  stroke = '#5E6C7E',
  startColor = 'var(--color-gold)',
}: {
  track: Track | null
  className?: string
  stroke?: string
  startColor?: string
}) {
  if (!track) return null
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      className={cn('h-auto w-full', className)}
      role="img"
      aria-label={`${track.name} circuit map`}
    >
      <path
        d={track.d}
        fill="none"
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d={track.d}
        fill="none"
        stroke={stroke}
        strokeWidth={3.4}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.18}
      />
      <line
        x1={track.start[0] - 1.7}
        y1={track.start[1] - 1.7}
        x2={track.start[0] + 1.7}
        y2={track.start[1] + 1.7}
        stroke={startColor}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </svg>
  )
}