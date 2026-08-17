import { useEffect, useState } from 'react'
import { NAV_GROUPS, navTargets } from '../lib/nav'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

function scrollToTarget(id: string, attempts = 0) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  if (attempts < 20) {
    requestAnimationFrame(() => scrollToTarget(id, attempts + 1))
  }
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-accent text-xs font-bold tracking-tight text-white">
        F1
      </span>
      <div className="leading-tight">
        <p className="label-lg text-text">Formula 1</p>
        <p className="text-[10px] tracking-[0.2em] text-muted">DATA CENTER</p>
      </div>
    </div>
  )
}

function NavList({
  active,
  onNavigate,
  onNavigateEnd,
}: {
  active: string
  onNavigate: (id: string) => void
  onNavigateEnd?: () => void
}) {
  return (
    <nav aria-label="Primary" className="px-3">
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.label ?? `g${gi}`} className={gi > 0 ? 'mt-4' : ''}>
          {group.label ? (
            <p className="label px-2 pb-1.5 text-[9px] text-muted/70">{group.label}</p>
          ) : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = active === item.id
              return (
                <li key={item.id}>
                  <a
                    href={item.route ? `#${item.route}` : `#${item.target}`}
                    onClick={(e) => {
                      e.preventDefault()
                      window.location.hash = item.route ? `#${item.route}` : `#${item.target}`
                      onNavigate(item.id)
                      onNavigateEnd?.()
                      if (!item.route) {
                        scrollToTarget(item.target)
                      }
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex items-center gap-2.5 rounded px-2.5 py-1.5 text-xs font-medium tracking-wide transition-colors duration-150 ${
                      isActive ? 'text-text' : 'text-muted hover:bg-surface/60 hover:text-text'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-3.5 w-0.5 rounded-full transition-colors duration-150 ${
                        isActive ? 'bg-accent' : 'bg-transparent group-hover:bg-line-strong'
                      }`}
                    />
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function Sidebar({ active, onNavigate }: { active: string; onNavigate?: (id: string) => void }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[13.5rem] shrink-0 flex-col border-r border-line bg-bg-secondary lg:flex">
      <div className="px-5 pt-5 pb-4">
        <BrandMark />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <NavList active={active} onNavigate={(id) => onNavigate?.(id)} />
      </ScrollArea>

      <div className="border-t border-line px-5 py-3">
        <p className="label text-[9px] text-muted/70">Data Source</p>
        <p className="mt-0.5 text-[10px] leading-snug text-muted">Jolpica F1 API · Live</p>
      </div>
    </aside>
  )
}

export function MobileNavSheet({
  open,
  onOpenChange,
  active,
  onNavigate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  active: string
  onNavigate: (id: string) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[16rem] gap-0 border-r border-line bg-bg-secondary p-0 text-text sm:max-w-[16rem]"
      >
        <div className="px-5 pt-5 pb-4">
          <BrandMark />
        </div>
        <Separator className="bg-line" />
        <ScrollArea className="min-h-0 flex-1 py-4">
          <NavList active={active} onNavigate={onNavigate} onNavigateEnd={() => onOpenChange(false)} />
        </ScrollArea>
        <Separator className="bg-line" />
        <div className="px-5 py-3">
          <p className="label text-[9px] text-muted/70">Data Source</p>
          <p className="mt-0.5 text-[10px] leading-snug text-muted">Jolpica F1 API · Live</p>
        </div>
        <SheetHeader className="sr-only">
          <SheetTitle>Formula 1 Navigation</SheetTitle>
          <SheetDescription>Jump to a dashboard section.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}

export function useScrollSpy(ids: string[]): string {
  const [active, setActive] = useState<string>(ids[0] ?? 'overview')

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) setActive(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.2, 0.6] },
    )
    for (const s of sections) observer.observe(s)

    const onScroll = () => {
      const pos = window.scrollY + 120
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= pos) current = id
      }
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [ids])

  return active
}

export function useNavActive(): { active: string; onNavigate: (id: string) => void } {
  const targets = navTargets()
  const active = useScrollSpy(targets)
  return { active, onNavigate: () => undefined }
}
