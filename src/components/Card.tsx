import type { ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'

export function SectionHeading({ label, meta }: { label: string; meta?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-6 w-1.5 shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-text">{label}</h2>
      {meta ? <span className="label text-muted/70">{meta}</span> : null}
      <Separator className="min-w-4 flex-1 bg-line" aria-hidden="true" />
    </div>
  )
}
