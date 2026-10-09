import {
  repairAnalyticsResponseSchema,
  type RepairAnalyticsResponse,
} from '../src/features/dashboard/schemas'

import { calculateDelta } from '../src/features/dashboard/components/analytics/delta-badge'
import { formatRepairDuration } from '../src/features/dashboard/lib/format-duration'
import { dashboardRouter } from '../src/server/hono/routes/dashboard'
import { getRepairAnalytics } from '../src/server/services/dashboard-analytics.service'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`)
    process.exit(1)
  }
  console.log(`✅ ${message}`)
}

console.log('--- Testing Repair Analytics Duration Formatter ---')
assert(formatRepairDuration(null) === '—', 'formatRepairDuration(null) is "—"')
assert(formatRepairDuration(undefined) === '—', 'formatRepairDuration(undefined) is "—"')
assert(formatRepairDuration(0) === '0h', 'formatRepairDuration(0) is "0h"')
assert(formatRepairDuration(0.25) === '15m', 'formatRepairDuration(0.25) is "15m"')
assert(formatRepairDuration(0.75) === '45m', 'formatRepairDuration(0.75) is "45m"')
assert(formatRepairDuration(4.2) === '4h', 'formatRepairDuration(4.2) is "4h"')
assert(formatRepairDuration(23.8) === '24h', 'formatRepairDuration(23.8) is "24h"')
assert(formatRepairDuration(53) === '2d 5h', 'formatRepairDuration(53) is "2d 5h"')
assert(formatRepairDuration(48) === '2d', 'formatRepairDuration(48) is "2d"')
assert(formatRepairDuration(50) === '2d 2h', 'formatRepairDuration(50) is "2d 2h"')

console.log('--- Testing Repair Analytics Schema Validation ---')
const sampleValid: RepairAnalyticsResponse = {
  created: 15,
  completed: 12,
  pending: 8,
  overdue: 2,
  avgRepairHours: 53.5,
  previousCreated: 10,
  previousCompleted: 8,
  previousAvgRepairHours: 60.0,
}

const parsed = repairAnalyticsResponseSchema.safeParse(sampleValid)
assert(parsed.success, 'Valid repair analytics data passes schema parse')

const sampleNullAvg: RepairAnalyticsResponse = {
  created: 0,
  completed: 0,
  pending: 0,
  overdue: 0,
  avgRepairHours: null,
  previousCreated: 0,
  previousCompleted: 0,
  previousAvgRepairHours: null,
}
const parsedNull = repairAnalyticsResponseSchema.safeParse(sampleNullAvg)
assert(parsedNull.success, 'Null avgRepairHours is allowed when there are no completions')

const invalidNegative = { ...sampleValid, created: -1 }
assert(!repairAnalyticsResponseSchema.safeParse(invalidNegative).success, 'Negative count is rejected')

console.log('--- Testing Delta Calculation ---')
assert(calculateDelta(10, 5) === 100, 'Delta from 5 to 10 is 100%')
assert(calculateDelta(5, 10) === -50, 'Delta from 10 to 5 is -50%')
assert(calculateDelta(5, 0) === null, 'Delta is null when previous is 0')

async function runAsyncTests() {
  console.log('--- Testing Hono Route Security & Authorization ---')
  const unauthRes = await dashboardRouter.request('/analytics/repairs', {
    method: 'GET',
  })
  assert(unauthRes.status === 401, `Unauthenticated request returns 401: got ${unauthRes.status}`)

  console.log('--- Testing Database Service getRepairAnalytics & Shop Isolation ---')
  const shop1 = '1608b702-fc0a-49af-87ef-d6b0563f9725' // Pitru Krupa
  const shop2 = 'b091837f-b0c8-471e-805b-6578e7d46aee' // Parth Sata
  const dummyShop = '00000000-0000-0000-0000-000000000000'

  const res1 = await getRepairAnalytics(shop1, 'this_month')
  const res2 = await getRepairAnalytics(shop2, 'this_month')
  const resDummy = await getRepairAnalytics(dummyShop, 'this_month')

  assert(resDummy.created === 0, 'Dummy shop returns 0 created repairs')
  assert(resDummy.completed === 0, 'Dummy shop returns 0 completed repairs')
  assert(resDummy.pending === 0, 'Dummy shop returns 0 pending repairs')
  assert(resDummy.overdue === 0, 'Dummy shop returns 0 overdue repairs')
  assert(resDummy.avgRepairHours === null, 'Dummy shop returns null avgRepairHours')

  assert(typeof res1.created === 'number', 'Shop 1 created is a number')
  assert(typeof res1.completed === 'number', 'Shop 1 completed is a number')
  assert(typeof res1.pending === 'number', 'Shop 1 pending is a number')
  assert(typeof res1.overdue === 'number', 'Shop 1 overdue is a number')
  assert(
    res1.avgRepairHours === null || typeof res1.avgRepairHours === 'number',
    'Shop 1 avgRepairHours is number or null',
  )

  console.log('Shop 1 repair analytics:', res1)
  console.log('Shop 2 repair analytics:', res2)

  console.log('All tests passed successfully! 🎉')
  process.exit(0)
}

void runAsyncTests()
