'use client'

import { useCallback, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { parseAnalyticsPeriod, type AnalyticsPeriod } from './schemas'

export function useAnalyticsPeriod() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [period, setPeriodState] = useState<AnalyticsPeriod>(() =>
    parseAnalyticsPeriod(searchParams.get('period')),
  )

  const setPeriod = useCallback(
    (nextPeriod: AnalyticsPeriod) => {
      setPeriodState(nextPeriod)
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.set('period', nextPeriod)
        window.history.replaceState(null, '', `${pathname}?${url.searchParams.toString()}`)
      }
    },
    [pathname],
  )

  return { period, setPeriod }
}
