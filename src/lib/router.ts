import { useEffect, useState } from 'react'

export type Route =
  | { name: 'dashboard' }
  | { name: 'standings' }
  | { name: 'driver'; driverId: string }
  | { name: 'team'; constructorId: string }

export interface RouteParams {
  season: string | null
  round: string | null
}

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').split('?')[0].replace(/\/+$/, '')
  const parts = clean.split('/').filter(Boolean)
  if (parts[0] === 'standings') return { name: 'standings' }
  if (parts[0] === 'driver' && parts[1]) return { name: 'driver', driverId: decodeURIComponent(parts[1]) }
  if (parts[0] === 'team' && parts[1]) return { name: 'team', constructorId: decodeURIComponent(parts[1]) }
  return { name: 'dashboard' }
}

export function parseQuery(hash: string): RouteParams {
  const params: RouteParams = { season: null, round: null }
  const q = hash.split('?')[1]
  if (!q) return params
  for (const part of q.split('&')) {
    const [k, v] = part.split('=')
    if (k === 'season') params.season = decodeURIComponent(v ?? '') || null
    if (k === 'round') params.round = decodeURIComponent(v ?? '') || null
  }
  return params
}

export function buildHash(route: Route, params: RouteParams): string {
  let path = ''
  if (route.name === 'standings') path = 'standings'
  else if (route.name === 'driver') path = `driver/${encodeURIComponent(route.driverId)}`
  else if (route.name === 'team') path = `team/${encodeURIComponent(route.constructorId)}`
  const query: string[] = []
  if (params.season) query.push(`season=${encodeURIComponent(params.season)}`)
  if (params.round) query.push(`round=${encodeURIComponent(params.round)}`)
  return `#/${path}${query.length > 0 ? `?${query.join('&')}` : ''}`
}

export interface HashState {
  route: Route
  params: RouteParams
}

export function parseHashState(hash: string): HashState {
  return { route: parseHash(hash), params: parseQuery(hash) }
}

export function useHashRoute(): HashState {
  const [state, setState] = useState<HashState>(() => parseHashState(window.location.hash))
  useEffect(() => {
    const onChange = () => setState(parseHashState(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return state
}