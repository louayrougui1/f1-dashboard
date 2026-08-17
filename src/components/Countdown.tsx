import { useEffect, useState } from 'react'
import { getCountdown } from '../lib/format'

function CountdownCell({ value, label, large }: { value: number; label: string; large?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-md border border-line bg-bg/70 px-1.5 py-1.5 min-w-[3.2rem]">
      <span
        className={`mono-num font-semibold leading-tight text-text ${large ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-0.5 text-[9px] font-semibold tracking-[0.18em] text-muted">{label}</span>
    </div>
  )
}

export function Countdown({ target, large = false }: { target: Date | null; large?: boolean }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const c = getCountdown(target, now)
  const active = target !== null && !Number.isNaN(target.getTime())

  if (!active) {
    return (
      <div role="timer" aria-label="Race start countdown" className="mono-num text-sm text-muted">
        COUNTDOWN N/A
      </div>
    )
  }
  if (c.negative) {
    return (
      <div
        role="timer"
        aria-label="Race start countdown"
        className="mono-num rounded border border-good/30 bg-good/10 px-3 py-1.5 text-xs font-semibold tracking-widest text-good"
      >
        RACE IN PROGRESS
      </div>
    )
  }

  return (
    <div role="timer" aria-label="Time until race start" className="flex items-stretch gap-1.5">
      <CountdownCell value={c.days} label="DAYS" large={large} />
      <CountdownCell value={c.hours} label="HRS" large={large} />
      <CountdownCell value={c.minutes} label="MIN" large={large} />
      <CountdownCell value={c.seconds} label="SEC" large={large} />
    </div>
  )
}