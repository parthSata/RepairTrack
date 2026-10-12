import {
  partsAnalyticsResponseSchema,
  type PartsAnalyticsResponse,
} from '../src/features/dashboard/schemas'
import { dashboardRouter } from '../src/server/hono/routes/dashboard'
import { getPartsAnalytics } from '../src/server/services/dashboard-analytics.service'
import { db } from '../src/server/db'
import { inventory } from '../src/server/db/schema/inventory'
import { repairParts } from '../src/server/db/schema/repair-parts'
import { repairs } from '../src/server/db/schema/repairs'
import { eq } from 'drizzle-orm'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`)
    process.exit(1)
  }
  console.log(`✅ ${message}`)
}

console.log('--- Testing Parts Analytics Schema Validation ---')

const sampleValid: PartsAnalyticsResponse = {
  totalQuantity: 12,
  totalValue: 1540000,
  lowStockCount: 3,
  top: [
    {
      partId: 'part-1',
      name: 'iPhone 13 OLED Screen',
      sku: 'IP13-SCR-01',
      quantity: 5,
      value: 750000,
    },
    {
      partId: 'part-2',
      name: 'Samsung S22 Ultra Battery',
      sku: 'S22U-BAT-02',
      quantity: 4,
      value: 480000,
    },
    {
      partId: 'part-3',
      name: 'USB-C Charging Port',
      sku: 'UNIV-PORT-01',
      quantity: 3,
      value: 310000,
    },
  ],
}

const parsed = partsAnalyticsResponseSchema.safeParse(sampleValid)
assert(parsed.success, 'Valid parts analytics payload passes schema parse')

// Reject negative numbers
assert(
  !partsAnalyticsResponseSchema.safeParse({ ...sampleValid, totalQuantity: -1 }).success,
  'Negative totalQuantity is rejected',
)
assert(
  !partsAnalyticsResponseSchema.safeParse({ ...sampleValid, totalValue: -100 }).success,
  'Negative totalValue is rejected',
)
assert(
  !partsAnalyticsResponseSchema.safeParse({ ...sampleValid, lowStockCount: -1 }).success,
  'Negative lowStockCount is rejected',
)
assert(
  !partsAnalyticsResponseSchema.safeParse({
    ...sampleValid,
    top: [{ ...sampleValid.top[0]!, quantity: -5 }],
  }).success,
  'Negative item quantity is rejected',
)

// Empty list is valid
const sampleEmpty: PartsAnalyticsResponse = {
  totalQuantity: 0,
  totalValue: 0,
  lowStockCount: 0,
  top: [],
}
assert(
  partsAnalyticsResponseSchema.safeParse(sampleEmpty).success,
  'Empty parts usage payload is valid',
)

async function runAsyncTests() {
  console.log('--- Testing Hono Route Security & Authorization ---')
  const unauthRes = await dashboardRouter.request('/analytics/parts', {
    method: 'GET',
  })
  assert(unauthRes.status === 401, `Unauthenticated request returns 401: got ${unauthRes.status}`)

  const invalidPeriodRes = await dashboardRouter.request('/analytics/parts?period=invalid_period', {
    method: 'GET',
  })
  assert(
    invalidPeriodRes.status === 400 || invalidPeriodRes.status === 401,
    `Invalid period query is rejected: got ${invalidPeriodRes.status}`,
  )

  console.log('--- Testing Database Service getPartsAnalytics & Shop Isolation ---')
  const shop1 = '1608b702-fc0a-49af-87ef-d6b0563f9725' // Pitru Krupa
  const shop2 = 'b091837f-b0c8-471e-805b-6578e7d46aee' // Parth Sata
  const dummyShop = '00000000-0000-0000-0000-000000000000'

  const resDummy = await getPartsAnalytics(dummyShop, 'this_month')
  assert(resDummy.totalQuantity === 0, 'Dummy shop returns 0 totalQuantity')
  assert(resDummy.totalValue === 0, 'Dummy shop returns 0 totalValue')
  assert(resDummy.lowStockCount === 0, 'Dummy shop returns 0 lowStockCount')
  assert(resDummy.top.length === 0, 'Dummy shop returns empty top parts list')

  const res1Baseline = await getPartsAnalytics(shop1, 'this_month')
  const res2Baseline = await getPartsAnalytics(shop2, 'this_month')

  assert(typeof res1Baseline.totalQuantity === 'number', 'Shop 1 totalQuantity is a number')
  assert(typeof res1Baseline.totalValue === 'number', 'Shop 1 totalValue is a number')
  assert(typeof res1Baseline.lowStockCount === 'number', 'Shop 1 lowStockCount is a number')
  assert(Array.isArray(res1Baseline.top), 'Shop 1 top is an array')
  assert(res1Baseline.top.length <= 10, 'Shop 1 top has at most 10 items')

  console.log('--- Testing Live Parts Aggregation (Insert & Cleanup) ---')
  // Find a part and a repair in Shop 1
  const existingParts = await db
    .select()
    .from(inventory)
    .where(eq(inventory.shopId, shop1))
    .limit(1)
  const existingRepairs = await db
    .select({ id: repairs.id })
    .from(repairs)
    .where(eq(repairs.shopId, shop1))
    .limit(1)

  if (existingParts.length > 0 && existingRepairs.length > 0) {
    const testPart = existingParts[0]!
    const testRepair = existingRepairs[0]!
    const testId = `test_rp_${Date.now()}`
    const testQty = 3
    const testPrice = 250000 // 2,500 rupees in paise
    const expectedAddedValue = testQty * testPrice

    try {
      await db.insert(repairParts).values({
        id: testId,
        shopId: shop1,
        repairId: testRepair.id,
        inventoryId: testPart.id,
        quantity: testQty,
        unitSellingPrice: testPrice,
      })

      const resAfterInsert = await getPartsAnalytics(shop1, 'this_month')
      assert(
        resAfterInsert.totalQuantity === res1Baseline.totalQuantity + testQty,
        `totalQuantity incremented by ${testQty} (was ${res1Baseline.totalQuantity}, now ${resAfterInsert.totalQuantity})`,
      )
      assert(
        resAfterInsert.totalValue === res1Baseline.totalValue + expectedAddedValue,
        `totalValue incremented by ${expectedAddedValue} paise (was ${res1Baseline.totalValue}, now ${resAfterInsert.totalValue})`,
      )
      assert(
        resAfterInsert.top.some((p) => p.partId === testPart.id),
        `Inserted part appears in top list`,
      )

      const topItem = resAfterInsert.top.find((p) => p.partId === testPart.id)!
      assert(topItem.name === testPart.name, `Top item name matches inventory: ${topItem.name}`)
      assert(topItem.sku === testPart.sku, `Top item SKU matches inventory: ${topItem.sku}`)
      assert(topItem.quantity >= testQty, `Top item quantity includes testQty`)
      assert(topItem.value >= expectedAddedValue, `Top item value includes expectedAddedValue`)
      console.log('Live aggregated item:', topItem)

      // Verify dummy shop and shop2 are NOT affected
      const resDummyAfter = await getPartsAnalytics(dummyShop, 'this_month')
      assert(resDummyAfter.totalQuantity === 0, 'Dummy shop remains unaffected')
      const res2After = await getPartsAnalytics(shop2, 'this_month')
      assert(res2After.totalQuantity === res2Baseline.totalQuantity, 'Shop 2 remains unaffected')
    } finally {
      // Clean up test row
      await db.delete(repairParts).where(eq(repairParts.id, testId))
    }

    const resCleaned = await getPartsAnalytics(shop1, 'this_month')
    assert(
      resCleaned.totalQuantity === res1Baseline.totalQuantity,
      'After cleanup, Shop 1 totalQuantity returned to baseline',
    )
    assert(
      resCleaned.totalValue === res1Baseline.totalValue,
      'After cleanup, Shop 1 totalValue returned to baseline',
    )
  }

  // Periods check
  const resYear = await getPartsAnalytics(shop1, 'this_year')
  assert(
    resYear.totalQuantity >= res1Baseline.totalQuantity,
    'This year totalQuantity is greater than or equal to this month',
  )

  console.log('🎉 All parts analytics tests passed successfully!')
  process.exit(0)
}

void runAsyncTests()
