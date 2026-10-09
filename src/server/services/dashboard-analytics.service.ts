import { getPeriodRange } from '@/lib/shop-time'
import type { AnalyticsPeriod } from '@/features/dashboard/schemas'

export function getAnalyticsPeriod(period: AnalyticsPeriod) {
  return getPeriodRange(period)
}
