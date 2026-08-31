import { eq } from 'drizzle-orm'
import { config } from 'dotenv'
import { db } from '@/server/db'
import { customers } from '@/server/db/schema/customers'
import { repairs } from '@/server/db/schema/repairs'
import { regenerateTrackingToken } from '@/server/services/repair.service'
import {
  getPublicRepairByTrackingToken,
  verifyPublicRepairByTicketAndPhone,
} from '@/server/services/tracking.service'
import { publicTrackingResponseSchema } from '@/features/tracking/schemas'

config({ path: '.env.local' })

const FORBIDDEN_KEYS = [
  'id',
  'shopId',
  'diagnosis',
  'repairNotes',
  'initialCondition',
  'serialNumber',
  'assignedTechnician',
  'customer',
  'email',
  'changedBy',
  'note',
  'finalCost',
]

function assertNoForbiddenKeys(value: unknown, path = 'root'): void {
  if (!value || typeof value !== 'object') return
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.includes(key)) {
      throw new Error(`Forbidden key exposed at ${path}.${key}`)
    }
    assertNoForbiddenKeys(nested, `${path}.${key}`)
  }
}

async function main() {
  const [repair] = await db
    .select({
      id: repairs.id,
      shopId: repairs.shopId,
      ticketNumber: repairs.ticketNumber,
      trackingToken: repairs.trackingToken,
      phone: customers.phone,
    })
    .from(repairs)
    .innerJoin(customers, eq(customers.id, repairs.customerId))
    .limit(1)

  if (!repair?.trackingToken) {
    throw new Error('No repair with tracking token found for tests')
  }

  const tokenPayload = await getPublicRepairByTrackingToken(repair.trackingToken)
  publicTrackingResponseSchema.parse(tokenPayload)
  assertNoForbiddenKeys(tokenPayload)

  const verifyPayload = await verifyPublicRepairByTicketAndPhone(repair.ticketNumber, repair.phone)
  publicTrackingResponseSchema.parse(verifyPayload)

  let wrongPhoneFailed = false
  try {
    await verifyPublicRepairByTicketAndPhone(repair.ticketNumber, '0000000000')
  } catch {
    wrongPhoneFailed = true
  }
  if (!wrongPhoneFailed) throw new Error('Expected wrong phone verification to fail')

  const oldToken = repair.trackingToken
  await regenerateTrackingToken({
    shopId: repair.shopId,
    userRole: 'STAFF',
    repairId: repair.id,
  })

  let revokedTokenFailed = false
  try {
    await getPublicRepairByTrackingToken(oldToken)
  } catch {
    revokedTokenFailed = true
  }
  if (!revokedTokenFailed) throw new Error('Expected revoked token lookup to fail')

  console.log('Public tracking service tests passed.')
  console.log('Sample public payload:', JSON.stringify(tokenPayload, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
