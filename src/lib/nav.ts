export interface NavItem {
  id: string
  label: string
  target: string
  route?: string
  page?: 'dashboard' | 'standings'
}

export interface NavGroup {
  label?: string
  row?: boolean
  items: NavItem[]
}

const TOP_PAIR: NavGroup = {
  row: true,
  items: [
    { id: 'dashboard', label: 'Races', target: 'overview' },
    { id: 'standings', label: 'Standings', target: 'standings', route: '/standings' },
  ],
}

export const NAV_GROUPS: NavGroup[] = [
  TOP_PAIR,
  {
    items: [
      { id: 'overview', label: 'Overview', target: 'overview' },
      { id: 'calendar', label: 'Calendar', target: 'calendar' },
      { id: 'results', label: 'Race Data', target: 'results' },
      { id: 'fastest', label: 'Fastest Lap', target: 'fastest' },
      { id: 'lapchart', label: 'Lap Chart', target: 'lapchart' },
      { id: 'circuit', label: 'Circuit', target: 'circuit' },
      { id: 'watchlive', label: 'Watch Live', target: 'watchlive' },
    ],
  },
]

export const STANDINGS_GROUPS: NavGroup[] = [
  TOP_PAIR,
  {
    items: [
      { id: 'drivers', label: 'Drivers', target: 'drivers', page: 'standings' },
      { id: 'constructors', label: 'Constructors', target: 'constructors', page: 'standings' },
      { id: 'progression', label: 'Progression', target: 'progression', page: 'standings' },
      { id: 'headtohead', label: 'Head-to-Head', target: 'headtohead', page: 'standings' },
      { id: 'races', label: 'Race Archive', target: 'races', page: 'standings' },
      { id: 'watchlive', label: 'Watch Live', target: 'watchlive', page: 'standings' },
    ],
  },
]

export function navTargets(): string[] {
  return [...new Set(NAV_GROUPS.flatMap((g) => g.items.filter((i) => !i.route).map((i) => i.target)))]
}

export function standingsTargets(): string[] {
  return STANDINGS_GROUPS.flatMap((g) =>
    g.items.filter((i) => !i.route && i.page === 'standings').map((i) => i.target),
  )
}