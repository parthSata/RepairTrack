'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { parseAnalyticsPeriod, type AnalyticsPeriod } from './schemas'

export function useAnalyticsPeriod() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const period = parseAnalyticsPeriod(searchParams.get('period'))

  function setPeriod(nextPeriod: AnalyticsPeriod) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', nextPeriod)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return { period, setPeriod }
}
