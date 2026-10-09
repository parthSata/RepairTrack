import {
  revenueAnalyticsResponseSchema,
  type RevenueAnalyticsResponse,
} from '../src/features/dashboard/schemas'

import { calculateDelta } from '../src/features/dashboard/components/analytics/delta-badge'
import { dashboardRouter } from '../src/server/hono/routes/dashboard'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`)
    process.exit(1)
  }
  console.log(`✅ ${message}`)
}

console.log('--- Testing Revenue Analytics Schemas & Logic ---')

// 1. Delta calculation
assert(calculateDelta(100, 0) === null, 'Delta is null when previous is 0')
assert(calculateDelta(100, -10) === null, 'Delta is null when previous is negative or zero')
assert(calculateDelta(150, 100) === 50, 'Delta is +50% when increasing from 100 to 150')
assert(calculateDelta(80, 100) === -20, 'Delta is -20% when decreasing from 100 to 80')
assert(calculateDelta(100, 100) === 0, 'Delta is 0% when no change')

// 2. Schema validation
const validData: RevenueAnalyticsResponse = {
  periodRevenue: 4500000,
  previousPeriodRevenue: 3000000,
  thisMonth: 4500000,
  lastMonthToDate: 3000000,
  thisYear: 52000000,
  lastYearToDate: 41000000,

  monthly: [
    { month: 'Jan', amount: 3500000 },
    { month: 'Feb', amount: 4200000 },
    { month: 'Mar', amount: 4800000 },
    { month: 'Apr', amount: 3900000 },
    { month: 'May', amount: 5100000 },
    { month: 'Jun', amount: 4600000 },
    { month: 'Jul', amount: 5300000 },
    { month: 'Aug', amount: 4900000 },
    { month: 'Sep', amount: 5500000 },
    { month: 'Oct', amount: 4500000 },
    { month: 'Nov', amount: 0 },
    { month: 'Dec', amount: 0 },
  ],
}

const parsed = revenueAnalyticsResponseSchema.safeParse(validData)
assert(parsed.success, 'Valid revenue data passes schema parse')
assert(validData.monthly.length === 12, 'Monthly data has all 12 calendar months')

// Invalid negative values rejected
const invalidNegative = { ...validData, thisMonth: -500 }
assert(!revenueAnalyticsResponseSchema.safeParse(invalidNegative).success, 'Negative values are rejected')

import { getRevenueAnalytics } from '../src/server/services/dashboard-analytics.service'

async function testRouteGuards() {
  // Test unauthenticated -> 401
  const unauthRes = await dashboardRouter.request('/analytics/revenue', {
    method: 'GET',
  })
  assert(unauthRes.status === 401, `Unauthenticated request returns 401: got ${unauthRes.status}`)

  // 4. Shop-isolation verification in database
  console.log('--- Testing Shop Isolation in getRevenueAnalytics ---')
  const shop1 = '1608b702-fc0a-49af-87ef-d6b0563f9725' // Pitru Krupa
  const shop2 = 'b091837f-b0c8-471e-805b-6578e7d46aee' // Parth Sata's shop
  const shop3 = '478571e3-4d4c-4958-a505-2117325d0f19' // Nita Herma's shop (0 payments)

  const res1 = await getRevenueAnalytics(shop1)
  const res2 = await getRevenueAnalytics(shop2)
  const res3 = await getRevenueAnalytics(shop3)

  assert(res3.thisMonth === 0 && res3.thisYear === 0, 'Zero-payment shop returns 0 revenue')
  assert(res3.monthly.every((m) => m.amount === 0), 'Zero-payment shop returns 0 for all months')

  assert(res1.thisYear > res2.thisYear, `Shop 1 revenue (${res1.thisYear}) is isolated from Shop 2 (${res2.thisYear})`)
  assert(res1.thisMonth !== res2.thisMonth, 'Shop 1 thisMonth is isolated from Shop 2')

  console.log('All tests passed successfully!')
}

void testRouteGuards()

