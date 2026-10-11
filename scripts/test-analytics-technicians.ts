/**
 * scripts/test-analytics-technicians.ts
 *
 * Verification script for the Technician Performance analytics endpoint.
 * Run with:
 *   bun --preload=./scripts/server-only-shim.mjs scripts/test-analytics-technicians.ts
 */

import {
  technicianPerformancePointSchema,
  technicianAnalyticsResponseSchema,
  type TechnicianAnalyticsResponse,
} from '../src/features/dashboard/schemas'

import { dashboardRouter } from '../src/server/hono/routes/dashboard'
import { getTechnicianAnalytics } from '../src/server/services/dashboard-analytics.service'

// ── Assertion helper ─────────────────────────────────────────────────────────

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`)
    process.exit(1)
  }
  console.log(`✅ ${message}`)
}

// ── Schema validation ────────────────────────────────────────────────────────

console.log('\n--- Technician Analytics Schema Tests ---')

const validRow = {
  technicianId: 'user-1',
  name: 'Parth Sata',
  isActive: true,
  completed: 12,
  active: 3,
  overdue: 1,
  avgRepairHours: 48.5,
}

assert(
  technicianPerformancePointSchema.safeParse(validRow).success,
  'Valid technician row passes schema parse',
)

const validEmpty: TechnicianAnalyticsResponse = []
assert(
  technicianAnalyticsResponseSchema.safeParse(validEmpty).success,
  'Empty array is valid (no activity in period)',
)

const nullAvg = { ...validRow, avgRepairHours: null }
assert(
  technicianPerformancePointSchema.safeParse(nullAvg).success,
  'null avgRepairHours is allowed when no completions exist',
)

const inactiveRow = { ...validRow, isActive: false }
assert(
  technicianPerformancePointSchema.safeParse(inactiveRow).success,
  'Inactive technician row is valid',
)

assert(
  !technicianPerformancePointSchema.safeParse({ ...validRow, completed: -1 }).success,
  'Negative completed count is rejected',
)

assert(
  !technicianPerformancePointSchema.safeParse({ ...validRow, overdue: -1 }).success,
  'Negative overdue count is rejected',
)

// ── Share calculation test ────────────────────────────────────────────────────

console.log('\n--- Share Calculation Tests ---')

function computeShares(technicians: { completed: number }[]): number[] {
  const total = technicians.reduce((s, t) => s + t.completed, 0)
  return technicians.map((t) => (total > 0 ? Math.round((t.completed / total) * 100) : 0))
}

const techsWithActivity = [{ completed: 6 }, { completed: 3 }, { completed: 1 }]
const shares = computeShares(techsWithActivity)
assert(shares[0] === 60, `Top technician share is 60%: got ${shares[0]}`)
assert(shares[1] === 30, `Second technician share is 30%: got ${shares[1]}`)
assert(shares[2] === 10, `Third technician share is 10%: got ${shares[2]}`)

const zeroCompletion = [{ completed: 0 }, { completed: 0 }]
const zeroShares = computeShares(zeroCompletion)
assert(zeroShares[0] === 0, 'Share is 0% when all completions are 0 (no division by zero)')
assert(zeroShares[1] === 0, 'Share is 0% when all completions are 0 (second technician)')

// ── Async: Route guards + DB isolation ──────────────────────────────────────

async function runAsyncTests() {
  console.log('\n--- Hono Route Security & Authorization ---')

  const unauthRes = await dashboardRouter.request('/analytics/technicians', { method: 'GET' })
  assert(unauthRes.status === 401, `Unauthenticated request returns 401: got ${unauthRes.status}`)

  const badPeriodRes = await dashboardRouter.request('/analytics/technicians?period=bad', {
    method: 'GET',
  })
  assert(
    badPeriodRes.status === 400 || badPeriodRes.status === 401,
    `Invalid period returns 400 or 401 (auth-first): got ${badPeriodRes.status}`,
  )

  console.log('\n--- Database Service — Shop Isolation ---')

  const SHOP_1 = '1608b702-fc0a-49af-87ef-d6b0563f9725' // Pitru Krupa
  const SHOP_2 = 'b091837f-b0c8-471e-805b-6578e7d46aee' // Parth Sata
  const DUMMY  = '00000000-0000-0000-0000-000000000000'

  const [resDummy, res1, res2] = await Promise.all([
    getTechnicianAnalytics(DUMMY, 'this_month'),
    getTechnicianAnalytics(SHOP_1, 'this_month'),
    getTechnicianAnalytics(SHOP_2, 'this_month'),
  ])

  assert(Array.isArray(resDummy), 'Dummy shop returns an array')
  assert(resDummy.length === 0, 'Dummy shop returns empty array (no technicians)')

  assert(Array.isArray(res1), 'Shop 1 returns an array')
  assert(
    technicianAnalyticsResponseSchema.safeParse(res1).success,
    'Shop 1 response matches schema',
  )

  assert(Array.isArray(res2), 'Shop 2 returns an array')
  assert(
    technicianAnalyticsResponseSchema.safeParse(res2).success,
    'Shop 2 response matches schema',
  )

  // Verify sorting: completed DESC
  for (let i = 1; i < res1.length; i++) {
    assert(
      res1[i - 1]!.completed >= res1[i]!.completed,
      `Shop 1: row ${i - 1} completed (${res1[i - 1]!.completed}) >= row ${i} completed (${res1[i]!.completed})`,
    )
  }

  console.log('\nShop 1 technicians:', res1)
  console.log('Shop 2 technicians:', res2)

  console.log('\n🎉 All technician analytics tests passed!')
  process.exit(0)
}

void runAsyncTests()
