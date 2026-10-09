import { getTodayRange, getPeriodRange, SHOP_TIMEZONE } from '../src/lib/shop-time'
import {
  parseAnalyticsPeriod,
  analyticsQuerySchema,
  ANALYTICS_PERIODS,
} from '../src/features/dashboard/schemas'
import { getAnalyticsPeriod } from '../src/server/services/dashboard-analytics.service'
import { dashboardRouter } from '../src/server/hono/routes/dashboard'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`)
    process.exit(1)
  }
  console.log(`✅ ${message}`)
}

console.log('--- Testing (1) shop-time.ts ---')

assert(SHOP_TIMEZONE === 'Asia/Kolkata', 'SHOP_TIMEZONE is Asia/Kolkata')

// Test getTodayRange
const mockNow = new Date('2026-10-08T15:02:00.000Z') // 20:32:00 IST
const todayRange = getTodayRange(mockNow)
assert(
  todayRange.start.toISOString() === '2026-10-07T18:30:00.000Z',
  `Today start is 2026-10-07T18:30:00.000Z (00:00 IST 8 Oct): got ${todayRange.start.toISOString()}`,
)
assert(
  todayRange.end.toISOString() === '2026-10-08T18:30:00.000Z',
  `Today end is 2026-10-08T18:30:00.000Z (00:00 IST 9 Oct): got ${todayRange.end.toISOString()}`,
)
assert(
  todayRange.end.getTime() - todayRange.start.getTime() === 24 * 60 * 60 * 1000,
  'Today range span is exactly 24 hours',
)

// Test this_month
const thisMonthRange = getPeriodRange('this_month', mockNow)
assert(
  thisMonthRange.start.toISOString() === '2026-09-30T18:30:00.000Z',
  `this_month start is 1 Oct 00:00 IST: got ${thisMonthRange.start.toISOString()}`,
)
assert(
  thisMonthRange.end.toISOString() === mockNow.toISOString(),
  'this_month end is now',
)
assert(
  thisMonthRange.previousStart.toISOString() === '2026-08-31T18:30:00.000Z',
  `this_month previousStart is 1 Sep 00:00 IST: got ${thisMonthRange.previousStart.toISOString()}`,
)
// 7 days and 20h32m elapsed into Oct -> elapsed span from Sep 1 is Sep 8 20:32 IST
assert(
  thisMonthRange.previousEnd.toISOString() === '2026-09-08T15:02:00.000Z',
  `this_month previousEnd is 8 Sep 20:32 IST: got ${thisMonthRange.previousEnd.toISOString()}`,
)

// Test clamping on this_month (e.g. 31 Oct with previous month Sep having 30 days)
const mockEndOfOct = new Date('2026-10-31T15:00:00.000Z') // 31 Oct 20:30 IST
const clampedThisMonth = getPeriodRange('this_month', mockEndOfOct)
assert(
  clampedThisMonth.previousEnd.toISOString() === '2026-09-30T18:30:00.000Z',
  `this_month previousEnd clamps to end of previous month (1 Oct 00:00 IST): got ${clampedThisMonth.previousEnd.toISOString()}`,
)

// Test last_month
const lastMonthRange = getPeriodRange('last_month', mockNow)
assert(
  lastMonthRange.start.toISOString() === '2026-08-31T18:30:00.000Z',
  `last_month start is 1 Sep 00:00 IST: got ${lastMonthRange.start.toISOString()}`,
)
assert(
  lastMonthRange.end.toISOString() === '2026-09-30T18:30:00.000Z',
  `last_month end is 1 Oct 00:00 IST: got ${lastMonthRange.end.toISOString()}`,
)
assert(
  lastMonthRange.previousStart.toISOString() === '2026-07-31T18:30:00.000Z',
  `last_month previousStart is 1 Aug 00:00 IST: got ${lastMonthRange.previousStart.toISOString()}`,
)
assert(
  lastMonthRange.previousEnd.toISOString() === '2026-08-31T18:30:00.000Z',
  `last_month previousEnd is 1 Sep 00:00 IST: got ${lastMonthRange.previousEnd.toISOString()}`,
)

// Test last_3_months
const last3MonthsRange = getPeriodRange('last_3_months', mockNow)
assert(
  last3MonthsRange.start.toISOString() === '2026-07-08T15:02:00.000Z',
  `last_3_months start is 8 Jul 20:32 IST: got ${last3MonthsRange.start.toISOString()}`,
)
assert(last3MonthsRange.end.toISOString() === mockNow.toISOString(), 'last_3_months end is now')
assert(
  last3MonthsRange.previousStart.toISOString() === '2026-04-08T15:02:00.000Z',
  `last_3_months previousStart is 8 Apr 20:32 IST: got ${last3MonthsRange.previousStart.toISOString()}`,
)
assert(
  last3MonthsRange.previousEnd.toISOString() === last3MonthsRange.start.toISOString(),
  'last_3_months previousEnd is start of current period',
)

// Test this_year
const thisYearRange = getPeriodRange('this_year', mockNow)
assert(
  thisYearRange.start.toISOString() === '2025-12-31T18:30:00.000Z',
  `this_year start is 1 Jan 2026 00:00 IST: got ${thisYearRange.start.toISOString()}`,
)
assert(thisYearRange.end.toISOString() === mockNow.toISOString(), 'this_year end is now')
assert(
  thisYearRange.previousStart.toISOString() === '2024-12-31T18:30:00.000Z',
  `this_year previousStart is 1 Jan 2025 00:00 IST: got ${thisYearRange.previousStart.toISOString()}`,
)
assert(
  thisYearRange.previousEnd.toISOString() === '2025-10-08T15:02:00.000Z',
  `this_year previousEnd is 8 Oct 2025 20:32 IST: got ${thisYearRange.previousEnd.toISOString()}`,
)

console.log('--- Testing (2) schemas.ts ---')

assert(ANALYTICS_PERIODS.length === 4, 'ANALYTICS_PERIODS has 4 periods')
assert(parseAnalyticsPeriod('invalid_period') === 'this_month', 'invalid period safely defaults to this_month')
assert(parseAnalyticsPeriod(undefined) === 'this_month', 'undefined safely defaults to this_month')
assert(parseAnalyticsPeriod(null) === 'this_month', 'null safely defaults to this_month')
assert(parseAnalyticsPeriod('last_month') === 'last_month', 'valid period parses correctly')

const validQuery = analyticsQuerySchema.safeParse({ period: 'this_year' })
assert(validQuery.success && validQuery.data.period === 'this_year', 'analyticsQuerySchema validates valid period')

const defaultQuery = analyticsQuerySchema.safeParse({})
assert(defaultQuery.success && defaultQuery.data.period === 'this_month', 'analyticsQuerySchema defaults to this_month')

const invalidQuery = analyticsQuerySchema.safeParse({ period: 'random' })
assert(!invalidQuery.success, 'analyticsQuerySchema rejects random period')

console.log('--- Testing (3) dashboard-analytics.service.ts ---')

const svcRange = getAnalyticsPeriod('this_month')
assert(svcRange.start instanceof Date && svcRange.end instanceof Date, 'getAnalyticsPeriod returns Date range')

console.log('--- Testing (4) Hono route validation ---')

async function testRouteValidation() {
  // Test invalid query validation (should return 400 before session check)
  const res = await dashboardRouter.fetch(new Request('http://localhost/analytics/period?period=unknown'))
  assert(res.status === 400, `GET /analytics/period?period=unknown returns 400 (got ${res.status})`)
  const body = await res.json()
  assert(body.error?.message === 'Invalid analytics period', `400 error message is 'Invalid analytics period'`)
}

testRouteValidation().then(() => {
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!')
})
