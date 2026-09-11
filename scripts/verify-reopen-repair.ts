import { and, eq, ne } from 'drizzle-orm'
import { config } from 'dotenv'
import { db } from '@/server/db'
import { repairApprovals } from '@/server/db/schema/repair-approvals'
import { repairStatusHistory, repairs } from '@/server/db/schema/repairs'
import { users } from '@/server/db/schema/users'
import { reopenRepairTicket } from '@/server/services/repair.service'

config({ path: '.env.local' })

type Fixture = {
  shopId: string
  customerId: string
  deviceId: string
  ownerId: string
  staffId: string
  technicianId: string
  otherShopUserId: string
  otherShopId: string
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

async function expectServiceError(
  fn: () => Promise<unknown>,
  expectedStatus: number,
  expectedMessage: string,
  label: string,
) {
  try {
    await fn()
    throw new Error(`${label} failed: expected HTTP ${expectedStatus}, but call succeeded`)
  } catch (error) {
    if (!(error instanceof Error) || !('status' in error)) {
      throw error
    }

    const status = (error as { status: number }).status
    if (status !== expectedStatus) {
      throw new Error(`${label} failed: expected HTTP ${expectedStatus}, got ${status}`)
    }
    if (!error.message.includes(expectedMessage)) {
      throw new Error(
        `${label} failed: expected message to include "${expectedMessage}", got "${error.message}"`,
      )
    }
  }
}

async function getFixture(): Promise<Fixture> {
  const [base] = await db
    .select({
      shopId: repairs.shopId,
      customerId: repairs.customerId,
      deviceId: repairs.deviceId,
      ownerId: users.id,
    })
    .from(repairs)
    .innerJoin(users, and(eq(users.shopId, repairs.shopId), eq(users.role, 'OWNER')))
    .limit(1)

  if (!base) {
    throw new Error('No repair + OWNER fixture found for reopen verification')
  }

  const [staff, technician, otherShopUser] = await Promise.all([
    db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.shopId, base.shopId), eq(users.role, 'STAFF')))
      .limit(1),
    db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.shopId, base.shopId), eq(users.role, 'TECHNICIAN')))
      .limit(1),
    db
      .select({ id: users.id, shopId: users.shopId })
      .from(users)
      .where(ne(users.shopId, base.shopId))
      .limit(1),
  ])

  if (!staff[0]) {
    throw new Error('No STAFF user found for reopen verification')
  }

  if (!technician[0]) {
    throw new Error('No TECHNICIAN user found for reopen verification')
  }

  if (!otherShopUser[0]) {
    throw new Error('No cross-shop user found for reopen verification')
  }

  return {
    shopId: base.shopId,
    customerId: base.customerId,
    deviceId: base.deviceId,
    ownerId: base.ownerId,
    staffId: staff[0].id,
    technicianId: technician[0].id,
    otherShopUserId: otherShopUser[0].id,
    otherShopId: otherShopUser[0].shopId,
  }
}

function generateTicketNumber() {
  const digits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('')
  return digits[0] === '0' ? `9${digits.slice(1)}` : digits
}

async function createTempRepair(fixture: Fixture) {
  const repairId = crypto.randomUUID()
  let ticketNumber = generateTicketNumber()

  while (true) {
    try {
      await db.insert(repairs).values({
        id: repairId,
        shopId: fixture.shopId,
        customerId: fixture.customerId,
        deviceId: fixture.deviceId,
        ticketNumber,
        trackingToken: null,
        status: 'RECEIVED',
        problemDescription: 'Temporary verification repair',
        issueDescription: 'Temporary verification repair',
        initialCondition: 'Temporary verification repair',
        diagnosis: null,
        estimatedCost: null,
        priority: 'MEDIUM',
        assignedTechnicianId: fixture.technicianId,
        createdBy: fixture.ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      return repairId
    } catch {
      ticketNumber = generateTicketNumber()
    }
  }
}

async function deleteTempRepair(repairId: string) {
  await db.delete(repairs).where(eq(repairs.id, repairId))
}

async function seedRepair({
  repairId,
  assignedTechnicianId,
  status,
}: {
  repairId: string
  assignedTechnicianId: string
  status: typeof repairs.$inferSelect.status
}) {
  const createdAt = new Date('2026-01-01T10:00:00.000Z')
  const diagnosingAt = new Date('2026-01-02T10:00:00.000Z')
  const terminalAt = new Date('2026-01-03T10:00:00.000Z')
  const approvalRequestedAt = new Date('2026-01-02T12:00:00.000Z')
  const approvalDecidedAt = new Date('2026-01-02T15:00:00.000Z')
  const updatedAt = new Date('2026-01-03T11:00:00.000Z')

  await db.transaction(async (tx) => {
    await tx.delete(repairApprovals).where(eq(repairApprovals.repairId, repairId))
    await tx.delete(repairStatusHistory).where(eq(repairStatusHistory.repairId, repairId))

    await tx.insert(repairApprovals).values({
      id: crypto.randomUUID(),
      repairId,
      status: 'APPROVED',
      initialEstimatedCost: 120_000,
      additionalEstimatedCost: 30_000,
      diagnosisSnapshot: 'Board-level repair approved by customer',
      requestedBy: assignedTechnicianId,
      requestedAt: approvalRequestedAt,
      decidedAt: approvalDecidedAt,
      rejectionReason: null,
      createdAt: approvalRequestedAt,
      updatedAt: approvalDecidedAt,
    })

    await tx.insert(repairStatusHistory).values([
      {
        id: crypto.randomUUID(),
        repairId,
        fromStatus: null,
        toStatus: 'RECEIVED',
        changedBy: assignedTechnicianId,
        actorType: 'STAFF',
        note: 'Ticket created',
        createdAt,
      },
      {
        id: crypto.randomUUID(),
        repairId,
        fromStatus: 'RECEIVED',
        toStatus: 'DIAGNOSING',
        changedBy: assignedTechnicianId,
        actorType: 'STAFF',
        note: 'Initial diagnosis started',
        createdAt: diagnosingAt,
      },
      {
        id: crypto.randomUUID(),
        repairId,
        fromStatus: 'READY_FOR_PICKUP',
        toStatus: status,
        changedBy: assignedTechnicianId,
        actorType: 'STAFF',
        note: status === 'COMPLETED' ? 'Device delivered to customer' : 'Customer rejected the repair',
        createdAt: terminalAt,
      },
    ])

    await tx
      .update(repairs)
      .set({
        status,
        diagnosis: 'Board-level repair approved by customer',
        estimatedCost: 150_000,
        assignedTechnicianId,
        updatedAt,
      })
      .where(eq(repairs.id, repairId))
  })
}

async function getCurrentState(repairId: string) {
  const [repair, approvals, statusHistory] = await Promise.all([
    db.select().from(repairs).where(eq(repairs.id, repairId)).limit(1),
    db.select().from(repairApprovals).where(eq(repairApprovals.repairId, repairId)),
    db.select().from(repairStatusHistory).where(eq(repairStatusHistory.repairId, repairId)),
  ])

  return {
    repair: repair[0] ?? null,
    approvals,
    statusHistory,
  }
}

async function testOwnerCanReopenCompleted(fixture: Fixture, repairId: string) {
  await seedRepair({
    repairId,
    assignedTechnicianId: fixture.technicianId,
    status: 'COMPLETED',
  })

  const before = await getCurrentState(repairId)
  const result = await reopenRepairTicket({
    shopId: fixture.shopId,
    userRole: 'OWNER',
    userId: fixture.ownerId,
    id: repairId,
    reason: 'Customer reported the same issue again.',
  })
  const after = await getCurrentState(repairId)
  const latestHistory = after.statusHistory.at(-1)

  assert(result.status === 'DIAGNOSING', 'Test 1 failed: OWNER reopen should return DIAGNOSING')
  assert(after.repair?.status === 'DIAGNOSING', 'Test 1 failed: repair should reopen to DIAGNOSING')
  assert(latestHistory?.fromStatus === 'COMPLETED', 'Test 1 failed: history should record fromStatus COMPLETED')
  assert(latestHistory?.toStatus === 'DIAGNOSING', 'Test 1 failed: history should record toStatus DIAGNOSING')
  assert(latestHistory?.actorType === 'OWNER', 'Test 1 failed: history actorType should be OWNER')
  assert(latestHistory?.changedBy === fixture.ownerId, 'Test 1 failed: changedBy should be the owner')
  assert(
    latestHistory?.note === 'Repair ticket reopened by OWNER. Reason: Customer reported the same issue again.',
    'Test 1 failed: history note should include the OWNER reopen reason',
  )
  assert(
    JSON.stringify(after.statusHistory.slice(0, before.statusHistory.length)) ===
      JSON.stringify(before.statusHistory),
    'Test 12 failed: previous status history should remain untouched after OWNER reopen',
  )
  assert(after.repair?.assignedTechnicianId === fixture.technicianId, 'Test 14 failed: technician assignment should remain unchanged')
  assert(
    JSON.stringify(after.approvals) === JSON.stringify(before.approvals),
    'Test 15 failed: customer approval rows should remain unchanged after OWNER reopen',
  )

  console.log('Test 1 passed: OWNER can reopen a COMPLETED ticket')
  console.log('Test 10 passed: successful reopen changes COMPLETED -> DIAGNOSING')
  console.log('Test 11 passed: reopen creates the correct repair_status_history entry')
  console.log('Test 12 passed: previous history remains untouched')
  console.log('Test 14 passed: existing technician assignment is preserved')
  console.log('Test 15 passed: existing Customer Approval data remains unchanged')
}

async function testStaffCanReopenCompleted(fixture: Fixture, repairId: string) {
  await seedRepair({
    repairId,
    assignedTechnicianId: fixture.technicianId,
    status: 'COMPLETED',
  })

  const result = await reopenRepairTicket({
    shopId: fixture.shopId,
    userRole: 'STAFF',
    userId: fixture.staffId,
    id: repairId,
    reason: 'Customer reported the same issue again.',
  })
  const after = await getCurrentState(repairId)
  const latestHistory = after.statusHistory.at(-1)

  assert(result.status === 'DIAGNOSING', 'Test 2 failed: STAFF reopen should return DIAGNOSING')
  assert(latestHistory?.actorType === 'STAFF', 'Test 2 failed: STAFF reopen should record STAFF actorType')
  assert(
    latestHistory?.note === 'Repair ticket reopened by STAFF. Reason: Customer reported the same issue again.',
    'Test 2 failed: STAFF reopen note should include the required reason',
  )

  console.log('Test 2 passed: STAFF can reopen a COMPLETED ticket')
}

async function testStaffReasonRequired(fixture: Fixture, repairId: string) {
  await seedRepair({
    repairId,
    assignedTechnicianId: fixture.technicianId,
    status: 'COMPLETED',
  })

  await expectServiceError(
    () =>
      reopenRepairTicket({
        shopId: fixture.shopId,
        userRole: 'STAFF',
        userId: fixture.staffId,
        id: repairId,
        reason: '   ',
      }),
    400,
    'Reason for reopening is required',
    'Test 3',
  )

  console.log('Test 3 passed: STAFF must provide a reason')
}

async function testStaffCannotReopenCancelled(fixture: Fixture, repairId: string) {
  await seedRepair({
    repairId,
    assignedTechnicianId: fixture.technicianId,
    status: 'CANCELLED',
  })

  await expectServiceError(
    () =>
      reopenRepairTicket({
        shopId: fixture.shopId,
        userRole: 'STAFF',
        userId: fixture.staffId,
        id: repairId,
        reason: 'Customer changed their mind again.',
      }),
    403,
    'Only the shop owner can reopen cancelled tickets',
    'Test 4',
  )

  console.log('Test 4 passed: STAFF cannot reopen a CANCELLED ticket')
}

async function testStaffCannotReopenActiveTickets(fixture: Fixture, repairId: string) {
  const activeStatuses: Array<typeof repairs.$inferSelect.status> = [
    'RECEIVED',
    'DIAGNOSING',
    'WAITING_FOR_APPROVAL',
    'APPROVED',
    'WAITING_FOR_PARTS',
    'IN_REPAIR',
    'QUALITY_CHECK',
    'READY_FOR_PICKUP',
  ]

  for (const status of activeStatuses) {
    await seedRepair({
      repairId,
      assignedTechnicianId: fixture.technicianId,
      status,
    })

    await expectServiceError(
      () =>
        reopenRepairTicket({
          shopId: fixture.shopId,
          userRole: 'STAFF',
          userId: fixture.staffId,
          id: repairId,
          reason: 'Customer reported the same issue again.',
        }),
      400,
      'Only completed or cancelled tickets can be reopened',
      `Test 5 (${status})`,
    )
  }

  console.log('Test 5 passed: STAFF cannot reopen active tickets')
}

async function testTechnicianCannotReopen(fixture: Fixture, repairId: string) {
  await seedRepair({
    repairId,
    assignedTechnicianId: fixture.technicianId,
    status: 'COMPLETED',
  })

  await expectServiceError(
    () =>
      reopenRepairTicket({
        shopId: fixture.shopId,
        userRole: 'TECHNICIAN',
        userId: fixture.technicianId,
        id: repairId,
        reason: 'Customer reported the same issue again.',
      }),
    403,
    'Only Owner and Staff can reopen eligible repair tickets',
    'Test 6',
  )

  console.log('Test 6 passed: TECHNICIAN cannot reopen')
}

async function testCustomerCannotReopen() {
  await expectServiceError(
    () =>
      reopenRepairTicket({
        shopId: 'public-shop',
        userRole: 'CUSTOMER',
        userId: 'public-customer',
        id: 'public-repair',
        reason: 'Customer reported the same issue again.',
      }),
    403,
    'Only Owner and Staff can reopen eligible repair tickets',
    'Test 7',
  )

  console.log('Test 7 passed: CUSTOMER/public access cannot reopen')
}

async function testWrongShopCannotReopen(fixture: Fixture, repairId: string) {
  await seedRepair({
    repairId,
    assignedTechnicianId: fixture.technicianId,
    status: 'COMPLETED',
  })

  await expectServiceError(
    () =>
      reopenRepairTicket({
        shopId: fixture.otherShopId,
        userRole: 'OWNER',
        userId: fixture.otherShopUserId,
        id: repairId,
        reason: 'Customer reported the same issue again.',
      }),
    404,
    'Repair ticket not found',
    'Test 8',
  )

  console.log('Test 8 passed: wrong-shop user cannot reopen')
}

async function testUnauthenticatedCannotReopen(fixture: Fixture, repairId: string) {
  await expectServiceError(
    () =>
      reopenRepairTicket({
        shopId: fixture.shopId,
        userRole: '',
        userId: '',
        id: repairId,
        reason: 'Customer reported the same issue again.',
      }),
    403,
    'Only Owner and Staff can reopen eligible repair tickets',
    'Test 9',
  )

  console.log('Test 9 passed: unauthenticated/invalid caller cannot reopen')
}

async function testConcurrentDuplicateReopen(fixture: Fixture, repairId: string) {
  await seedRepair({
    repairId,
    assignedTechnicianId: fixture.technicianId,
    status: 'COMPLETED',
  })

  const results = await Promise.allSettled([
    reopenRepairTicket({
      shopId: fixture.shopId,
      userRole: 'STAFF',
      userId: fixture.staffId,
      id: repairId,
      reason: 'Customer reported the same issue again.',
    }),
    reopenRepairTicket({
      shopId: fixture.shopId,
      userRole: 'STAFF',
      userId: fixture.staffId,
      id: repairId,
      reason: 'Customer reported the same issue again.',
    }),
  ])

  const fulfilled = results.filter((result) => result.status === 'fulfilled')
  const rejected = results.filter((result) => result.status === 'rejected')
  const after = await getCurrentState(repairId)
  const reopenEntries = after.statusHistory.filter(
    (entry) => entry.fromStatus === 'COMPLETED' && entry.toStatus === 'DIAGNOSING',
  )

  assert(fulfilled.length === 1, 'Test 13 failed: only one concurrent reopen should succeed')
  assert(rejected.length === 1, 'Test 13 failed: one concurrent reopen should be rejected')
  assert(reopenEntries.length === 1, 'Test 13 failed: only one reopen history row should be created')

  console.log('Test 13 passed: duplicate/concurrent reopen cannot produce multiple successful transitions')
}

async function testOwnerCancelledPathUnchanged(fixture: Fixture, repairId: string) {
  await seedRepair({
    repairId,
    assignedTechnicianId: fixture.technicianId,
    status: 'CANCELLED',
  })

  const result = await reopenRepairTicket({
    shopId: fixture.shopId,
    userRole: 'OWNER',
    userId: fixture.ownerId,
    id: repairId,
    reason: 'Owner override after cancellation review.',
  })

  assert(result.status === 'IN_REPAIR', 'Cancelled nuance failed: OWNER CANCELLED reopen should remain IN_REPAIR')
  console.log('Cancelled nuance check passed: OWNER-only CANCELLED reopen path remains unchanged')
}

async function main() {
  const fixture = await getFixture()
  const repairId = await createTempRepair(fixture)

  try {
    await testOwnerCanReopenCompleted(fixture, repairId)
    await testStaffCanReopenCompleted(fixture, repairId)
    await testStaffReasonRequired(fixture, repairId)
    await testStaffCannotReopenCancelled(fixture, repairId)
    await testStaffCannotReopenActiveTickets(fixture, repairId)
    await testTechnicianCannotReopen(fixture, repairId)
    await testCustomerCannotReopen()
    await testWrongShopCannotReopen(fixture, repairId)
    await testUnauthenticatedCannotReopen(fixture, repairId)
    await testConcurrentDuplicateReopen(fixture, repairId)
    await testOwnerCancelledPathUnchanged(fixture, repairId)

    console.log('All reopen verification tests passed.')
  } finally {
    await deleteTempRepair(repairId)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
