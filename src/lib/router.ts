import { useEffect, useState } from 'react'

export type Route = 'dashboard' | 'standings'

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').split('?')[0].split('/')[0]
  return clean === 'standings' ? 'standings' : 'dashboard'
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}