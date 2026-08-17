export interface NavItem {
  id: string
  label: string
  target: string
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  { items: [{ id: 'overview', label: 'Overview', target: 'overview' }] },
  {
    label: 'Racing',
    items: [
      { id: 'calendar', label: 'Calendar', target: 'calendar' },
      { id: 'results', label: 'Results', target: 'results' },
    ],
  },
  {
    label: 'Championship',
    items: [
      { id: 'drivers', label: 'Drivers', target: 'drivers' },
      { id: 'constructors', label: 'Constructors', target: 'constructors' },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { id: 'fastest', label: 'Fastest Lap', target: 'fastest' },
      { id: 'analysis', label: 'Race Analysis', target: 'results' },
    ],
  },
]

export function navTargets(): string[] {
  return NAV_GROUPS.flatMap((g) => g.items.map((i) => i.target))
}