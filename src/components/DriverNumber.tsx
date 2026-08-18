import type { Driver } from '../lib/types'
import { driverNumber } from '../lib/format'
import { cn } from '@/lib/utils'

export function DriverNumber({ driver, className }: { driver: Driver; className?: string }) {
  const n = driverNumber(driver)
  if (!n) return null
  return <span className={cn('mono-num shrink-0 font-bold tracking-widest text-muted', className)}>#{n}</span>
}