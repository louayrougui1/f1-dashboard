export interface NavItem {
  id: string
  label: string
  target: string
  route?: string
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
      { id: 'results', label: 'Race Data', target: 'results' },
    ],
  },
  {
    label: 'Championship',
    items: [
      { id: 'drivers', label: 'Drivers', target: 'drivers' },
      { id: 'constructors', label: 'Constructors', target: 'constructors' },
      { id: 'standings', label: 'Standings', target: 'standings', route: '/standings' },
      { id: 'progression', label: 'Progression', target: 'progression' },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { id: 'circuit', label: 'Circuit', target: 'circuit' },
      { id: 'fastest', label: 'Fastest Lap', target: 'fastest' },
      { id: 'headtohead', label: 'Head-to-Head', target: 'headtohead' },
    ],
  },
]

export function navTargets(): string[] {
  return NAV_GROUPS.flatMap((g) => g.items.filter((i) => !i.route).map((i) => i.target))
}