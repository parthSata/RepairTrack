import { and, eq, inArray, or, ilike, desc, asc, count, gte, lte, SQL } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db } from '@/server/db'
import { customers } from '@/server/db/schema/customers'
import { devices, repairNotes, repairStatusHistory, repairs } from '@/server/db/schema/repairs'
import { repairApprovals } from '@/server/db/schema/repair-approvals'
import { users } from '@/server/db/schema/users'
import type { CreateRepairInput } from '@/features/repairs/schemas'
import {
  computeIsRepairOverdue,
  isExpectedCompletionDateInPast,
  overdueRepairCondition,
} from '@/features/repairs/overdue'
import { generateTicketNumber, generateTrackingToken } from '@/server/lib/tokens'

export function applyTechnicianRepairScope(
  conditions: SQL[],
  { userRole, userId }: { userRole: string; userId: string },
) {
  if (userRole === 'TECHNICIAN') {
    conditions.push(eq(repairs.assignedTechnicianId, userId))
  }
}

export async function createRepairTicket({
  shopId,
  createdBy,
  data,
}: {
  shopId: string
  createdBy: string
  data: CreateRepairInput
}) {
  // 1. Verify Customer exists in current shop (403 if cross-shop or missing)
  const [customer] = await db
    .select({ id: customers.id, shopId: customers.shopId })
    .from(customers)
    .where(and(eq(customers.id, data.customerId), eq(customers.shopId, shopId)))

  if (!customer) {
    throw new HTTPException(403, {
      message: 'Forbidden: Selected customer does not belong to your shop.',
    })
  }

  // 2. Verify Device exists in current shop (403 if cross-shop or missing)
  const [device] = await db
    .select({ id: devices.id, shopId: devices.shopId, customerId: devices.customerId })
    .from(devices)
    .where(and(eq(devices.id, data.deviceId), eq(devices.shopId, shopId)))

  if (!device) {
    throw new HTTPException(403, {
      message: 'Forbidden: Selected device does not belong to your shop.',
    })
  }

  // 3. Verify Device belongs to selected Customer (400 if mismatch)
  if (device.customerId !== data.customerId) {
    throw new HTTPException(400, {
      message: 'The selected device does not belong to the selected customer.',
    })
  }

  // 4. Verify Technician (if provided) is an active TECHNICIAN or STAFF in current shop
  if (data.assignedTechnicianId) {
    const [tech] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, data.assignedTechnicianId),
          eq(users.shopId, shopId),
          inArray(users.role, ['TECHNICIAN', 'STAFF']),
          eq(users.status, 'ACTIVE'),
        ),
      )

    if (!tech) {
      throw new HTTPException(400, {
        message: 'Invalid technician selection: User is not an active technician in your shop.',
      })
    }
  }

  // 5. Generate 10-digit ticket number with retry on collision inside transaction
  let retries = 5
  let createdRepair: typeof repairs.$inferSelect | null = null

  while (retries > 0 && !createdRepair) {
    const ticketNumber = generateTicketNumber()
    const trackingToken = generateTrackingToken()
    const repairId = crypto.randomUUID()

    try {
      createdRepair = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(repairs)
          .values({
            id: repairId,
            shopId,
            customerId: data.customerId,
            deviceId: data.deviceId,
            ticketNumber,
            trackingToken,
            status: 'RECEIVED',
            problemDescription: data.problemDescription,
            issueDescription: data.problemDescription,
            initialCondition: data.initialCondition,
            estimatedCost:
              data.estimatedCost != null ? Math.round(data.estimatedCost * 100) : null,
            priority: data.priority ?? 'MEDIUM',
            expectedCompletionDate: data.expectedCompletionDate
              ? new Date(data.expectedCompletionDate)
              : null,
            assignedTechnicianId: data.assignedTechnicianId || null,
            createdBy,
          })
          .returning()

        // Insert initial history row
        await tx.insert(repairStatusHistory).values({
          id: crypto.randomUUID(),
          repairId,
          fromStatus: null,
          toStatus: 'RECEIVED',
          changedBy: createdBy,
          note: 'Ticket created',
        })

        if (data.initialNote && data.initialNote.trim().length > 0) {
          await tx.insert(repairNotes).values({
            id: crypto.randomUUID(),
            repairId,
            authorId: createdBy,
            note: data.initialNote.trim(),
          })
        }

        return inserted
      })
    } catch (err: unknown) {
      if (err instanceof HTTPException) {
        throw err
      }
      retries--
      if (retries === 0) {
        throw new HTTPException(500, {
          message: 'Failed to generate a unique ticket number. Please try again.',
        })
      }
    }
  }

  if (!createdRepair) {
    throw new HTTPException(500, { message: 'Failed to create repair ticket.' })
  }

  return createdRepair
}

export async function listRepairs({
  shopId,
  userRole,
  userId,
  status,
  priority,
  overdue,
  technicianId,
  startDate,
  endDate,
  search,
  page = 1,
  limit = 10,
}: {
  shopId: string
  userRole: string
  userId: string
  status?: string
  priority?: string
  overdue?: boolean
  technicianId?: string
  startDate?: string
  endDate?: string
  search?: string
  page?: number
  limit?: number
}) {
  const conditions: SQL[] = [eq(repairs.shopId, shopId)]

  applyTechnicianRepairScope(conditions, { userRole, userId })

  if (userRole !== 'TECHNICIAN' && technicianId) {
    if (technicianId === 'unassigned') {
      conditions.push(eq(repairs.assignedTechnicianId, '')) // handled via null check below or empty
    } else {
      conditions.push(eq(repairs.assignedTechnicianId, technicianId))
    }
  }

  if (status) {
    conditions.push(eq(repairs.status, status as typeof repairs.$inferSelect.status))
  }

  if (priority) {
    conditions.push(eq(repairs.priority, priority as typeof repairs.$inferSelect.priority))
  }

  if (overdue) {
    conditions.push(overdueRepairCondition())
  }

  if (startDate) {
    conditions.push(gte(repairs.createdAt, new Date(startDate)))
  }

  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    conditions.push(lte(repairs.createdAt, end))
  }

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`
    conditions.push(
      or(
        ilike(repairs.ticketNumber, term),
        ilike(customers.name, term),
        ilike(customers.phone, term),
      )!,
    )
  }

  const whereClause = and(...conditions)
  const offset = (page - 1) * limit

  // Execute Count and List queries in parallel for 2x faster DB response
  const [countResult, items] = await Promise.all([
    db
      .select({ count: count() })
      .from(repairs)
      .leftJoin(customers, eq(customers.id, repairs.customerId))
      .where(whereClause),

    db
      .select({
        id: repairs.id,
        shopId: repairs.shopId,
        ticketNumber: repairs.ticketNumber,
        status: repairs.status,
        priority: repairs.priority,
        problemDescription: repairs.problemDescription,
        issueDescription: repairs.issueDescription,
        initialCondition: repairs.initialCondition,
        diagnosis: repairs.diagnosis,
        estimatedCost: repairs.estimatedCost,
        expectedCompletionDate: repairs.expectedCompletionDate,
        createdAt: repairs.createdAt,
        updatedAt: repairs.updatedAt,
        customer: {
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          email: customers.email,
        },
        device: {
          id: devices.id,
          brand: devices.brand,
          model: devices.model,
          deviceType: devices.deviceType,
        },
        assignedTechnician: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(repairs)
      .leftJoin(customers, eq(customers.id, repairs.customerId))
      .leftJoin(devices, eq(devices.id, repairs.deviceId))
      .leftJoin(users, eq(users.id, repairs.assignedTechnicianId))
      .where(whereClause)
      .orderBy(desc(repairs.createdAt))
      .limit(limit)
      .offset(offset),
  ])

  const total = Number(countResult[0]?.count ?? 0)

  return {
    items: items.map((item) => ({
      ...item,
      isOverdue: computeIsRepairOverdue(item.expectedCompletionDate, item.status),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  }
}

export async function getRepairById({
  shopId,
  userRole,
  userId,
  id,
}: {
  shopId: string
  userRole: string
  userId: string
  id: string
}) {
  const conditions: SQL[] = [eq(repairs.id, id), eq(repairs.shopId, shopId)]

  applyTechnicianRepairScope(conditions, { userRole, userId })

  const result = await db
    .select({
      id: repairs.id,
      shopId: repairs.shopId,
      customerId: repairs.customerId,
      deviceId: repairs.deviceId,
      ticketNumber: repairs.ticketNumber,
      trackingToken: repairs.trackingToken,
      status: repairs.status,
      priority: repairs.priority,
      problemDescription: repairs.problemDescription,
      issueDescription: repairs.issueDescription,
      initialCondition: repairs.initialCondition,
      diagnosis: repairs.diagnosis,
      estimatedCost: repairs.estimatedCost,
      finalCost: repairs.finalCost,
      expectedCompletionDate: repairs.expectedCompletionDate,
      assignedTechnicianId: repairs.assignedTechnicianId,
      createdBy: repairs.createdBy,
      createdAt: repairs.createdAt,
      updatedAt: repairs.updatedAt,
      device: {
        id: devices.id,
        brand: devices.brand,
        model: devices.model,
        serialNumber: devices.serialNumber,
        deviceType: devices.deviceType,
        condition: devices.condition,
        modelVerified: devices.modelVerified,
        modelVerificationOverridden: devices.modelVerificationOverridden,
        modelVerificationNote: devices.modelVerificationNote,
      },
      customer: {
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
      },
    })
    .from(repairs)
    .leftJoin(devices, eq(devices.id, repairs.deviceId))
    .leftJoin(customers, eq(customers.id, repairs.customerId))
    .where(and(...conditions))

  const repair = result[0]
  if (!repair) throw new HTTPException(404, { message: 'Repair ticket not found' })

  // Fetch creator info, assigned technician, notes, status history, and approval concurrently
  const [creatorResult, techResult, notes, statusHistory, pendingApprovalResult, latestApprovalResult] =
    await Promise.all([
    repair.createdBy
      ? db
          .select({ id: users.id, name: users.name, email: users.email, role: users.role })
          .from(users)
          .where(eq(users.id, repair.createdBy))
      : Promise.resolve([]),
    repair.assignedTechnicianId
      ? db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, repair.assignedTechnicianId))
      : Promise.resolve([]),
    db
      .select({
        id: repairNotes.id,
        note: repairNotes.note,
        createdAt: repairNotes.createdAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(repairNotes)
      .leftJoin(users, eq(users.id, repairNotes.authorId))
      .where(eq(repairNotes.repairId, id))
      .orderBy(asc(repairNotes.createdAt)),
    db
      .select({
        id: repairStatusHistory.id,
        fromStatus: repairStatusHistory.fromStatus,
        toStatus: repairStatusHistory.toStatus,
        actorType: repairStatusHistory.actorType,
        note: repairStatusHistory.note,
        createdAt: repairStatusHistory.createdAt,
        changedBy: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(repairStatusHistory)
      .leftJoin(users, eq(users.id, repairStatusHistory.changedBy))
      .where(eq(repairStatusHistory.repairId, id))
      .orderBy(asc(repairStatusHistory.createdAt)),
    db
      .select({
        id: repairApprovals.id,
        status: repairApprovals.status,
        additionalEstimatedCost: repairApprovals.additionalEstimatedCost,
        diagnosisSnapshot: repairApprovals.diagnosisSnapshot,
        requestedAt: repairApprovals.requestedAt,
        decidedAt: repairApprovals.decidedAt,
        rejectionReason: repairApprovals.rejectionReason,
        requestedBy: {
          id: users.id,
          name: users.name,
          role: users.role,
        },
      })
      .from(repairApprovals)
      .leftJoin(users, eq(users.id, repairApprovals.requestedBy))
      .where(and(eq(repairApprovals.repairId, id), eq(repairApprovals.status, 'PENDING')))
      .limit(1),
    db
      .select({
        id: repairApprovals.id,
        status: repairApprovals.status,
        additionalEstimatedCost: repairApprovals.additionalEstimatedCost,
        diagnosisSnapshot: repairApprovals.diagnosisSnapshot,
        requestedAt: repairApprovals.requestedAt,
        decidedAt: repairApprovals.decidedAt,
        rejectionReason: repairApprovals.rejectionReason,
        requestedBy: {
          id: users.id,
          name: users.name,
          role: users.role,
        },
      })
      .from(repairApprovals)
      .leftJoin(users, eq(users.id, repairApprovals.requestedBy))
      .where(eq(repairApprovals.repairId, id))
      .orderBy(desc(repairApprovals.requestedAt))
      .limit(1),
  ])

  const creator = creatorResult[0] || null
  const assignedTechnician = techResult[0] || null
  const approval = pendingApprovalResult[0] ?? latestApprovalResult[0] ?? null

  return {
    ...repair,
    isOverdue: computeIsRepairOverdue(repair.expectedCompletionDate, repair.status),
    creator,
    assignedTechnician,
    notes,
    statusHistory,
    approval,
  }
}

export async function updateRepairStatus({
  shopId,
  userRole,
  userId,
  id,
  status,
  note,
}: {
  shopId: string
  userRole: string
  userId: string
  id: string
  status: typeof repairs.$inferSelect.status
  note?: string
}) {
  // PERMISSION CHECK: OWNER is intentionally excluded from direct status changes
  if (userRole === 'OWNER') {
    throw new HTTPException(403, {
      message:
        'Owner cannot change repair status directly. Status changes belong to the technicians and staff working on the repair.',
    })
  }

  const [existing] = await db
    .select({
      id: repairs.id,
      status: repairs.status,
      assignedTechnicianId: repairs.assignedTechnicianId,
    })
    .from(repairs)
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Repair ticket not found' })
  }

  // TECHNICIAN can only update status on repairs assigned to them
  if (userRole === 'TECHNICIAN' && existing.assignedTechnicianId !== userId) {
    throw new HTTPException(403, {
      message: 'Forbidden: Technicians can only change status on repairs assigned to them.',
    })
  }

  // Prevent status updates on completed or cancelled tickets (must use reopen action)
  if (['COMPLETED', 'CANCELLED'].includes(existing.status)) {
    throw new HTTPException(400, {
      message:
        'Completed or cancelled tickets cannot have status updated directly. Owner must reopen the ticket.',
    })
  }

  if (status === 'WAITING_FOR_APPROVAL') {
    throw new HTTPException(400, {
      message: 'Use Request Customer Approval to send an estimate for approval.',
    })
  }

  // Execute status update and status history logging in transaction
  const updated = await db.transaction(async (tx) => {
    const [res] = await tx
      .update(repairs)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))
      .returning()

    await tx.insert(repairStatusHistory).values({
      id: crypto.randomUUID(),
      repairId: id,
      fromStatus: existing.status,
      toStatus: status,
      changedBy: userId,
      note: note || null,
    })

    return res
  })

  return updated
}

export async function requestCustomerApproval({
  shopId,
  userRole,
  userId,
  id,
}: {
  shopId: string
  userRole: string
  userId: string
  id: string
}) {
  if (userRole === 'OWNER') {
    throw new HTTPException(403, {
      message:
        'Owner cannot change repair status directly. Status changes belong to the technicians and staff working on the repair.',
    })
  }

  const [existing] = await db
    .select({
      id: repairs.id,
      status: repairs.status,
      diagnosis: repairs.diagnosis,
      estimatedCost: repairs.estimatedCost,
      assignedTechnicianId: repairs.assignedTechnicianId,
    })
    .from(repairs)
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Repair ticket not found' })
  }

  if (userRole === 'TECHNICIAN' && existing.assignedTechnicianId !== userId) {
    throw new HTTPException(403, {
      message: 'Forbidden: Technicians can only change status on repairs assigned to them.',
    })
  }

  if (['COMPLETED', 'CANCELLED'].includes(existing.status)) {
    throw new HTTPException(400, {
      message:
        'Completed or cancelled tickets cannot have status updated directly. Owner must reopen the ticket.',
    })
  }

  if (!existing.diagnosis?.trim()) {
    throw new HTTPException(400, {
      message: 'Add a diagnosis before requesting customer approval',
    })
  }

  if (existing.estimatedCost === null) {
    throw new HTTPException(400, {
      message: 'Set an estimated cost before requesting customer approval',
    })
  }

  const [pendingApproval] = await db
    .select({ id: repairApprovals.id })
    .from(repairApprovals)
    .where(and(eq(repairApprovals.repairId, id), eq(repairApprovals.status, 'PENDING')))
    .limit(1)

  if (pendingApproval) {
    throw new HTTPException(400, {
      message: 'Customer approval is already pending for this repair',
    })
  }

  const requestedAt = new Date()
  const diagnosisSnapshot = existing.diagnosis.trim()

  await db.transaction(async (tx) => {
    await tx.insert(repairApprovals).values({
      repairId: id,
      status: 'PENDING',
      diagnosisSnapshot,
      additionalEstimatedCost: existing.estimatedCost!,
      requestedBy: userId,
      requestedAt,
    })

    await tx
      .update(repairs)
      .set({
        status: 'WAITING_FOR_APPROVAL',
        updatedAt: new Date(),
      })
      .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))

    await tx.insert(repairStatusHistory).values({
      id: crypto.randomUUID(),
      repairId: id,
      fromStatus: existing.status,
      toStatus: 'WAITING_FOR_APPROVAL',
      changedBy: userId,
      actorType: 'STAFF',
    })
  })

  // Sprint 3 (Gmail): send "Repair Approval Required" transactional email via the shop's
  // connected Gmail account. Do not call sendEmail until feature/send-for-approval (Gmail) merges.
  // Pattern: staff.service.ts invite flow → buildXxxHtml + sendEmail + console.warn on failure.

  return getRepairById({ shopId, userRole, userId, id })
}

export async function reopenRepairTicket({
  shopId,
  userRole,
  userId,
  id,
  note,
}: {
  shopId: string
  userRole: string
  userId: string
  id: string
  note?: string
}) {
  // Only OWNER can reopen a closed ticket
  if (userRole !== 'OWNER') {
    throw new HTTPException(403, {
      message: 'Only the shop owner can reopen completed or cancelled tickets.',
    })
  }

  const [existing] = await db
    .select({ id: repairs.id, status: repairs.status })
    .from(repairs)
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Repair ticket not found' })
  }

  if (!['COMPLETED', 'CANCELLED'].includes(existing.status)) {
    throw new HTTPException(400, {
      message: 'Only completed or cancelled tickets can be reopened.',
    })
  }

  const updated = await db.transaction(async (tx) => {
    const [res] = await tx
      .update(repairs)
      .set({
        status: 'IN_REPAIR',
        updatedAt: new Date(),
      })
      .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))
      .returning()

    await tx.insert(repairStatusHistory).values({
      id: crypto.randomUUID(),
      repairId: id,
      fromStatus: existing.status,
      toStatus: 'IN_REPAIR',
      changedBy: userId,
      note: note || 'Ticket reopened by Owner',
    })

    return res
  })

  return updated
}

export async function reassignTechnician({
  shopId,
  userRole,
  id,
  technicianId,
}: {
  shopId: string
  userRole: string
  id: string
  technicianId: string | null
}) {
  // OWNER and STAFF only
  if (['OWNER', 'STAFF'].includes(userRole) === false) {
    throw new HTTPException(403, {
      message: 'Only Owner and Staff can assign or reassign technicians.',
    })
  }

  const [existing] = await db
    .select({ id: repairs.id })
    .from(repairs)
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Repair ticket not found' })
  }

  if (technicianId) {
    const [tech] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, technicianId),
          eq(users.shopId, shopId),
          inArray(users.role, ['TECHNICIAN', 'STAFF']),
          eq(users.status, 'ACTIVE'),
        ),
      )

    if (!tech) {
      throw new HTTPException(400, {
        message: 'Invalid technician selection: User is not an active technician in your shop.',
      })
    }
  }

  const [updated] = await db
    .update(repairs)
    .set({
      assignedTechnicianId: technicianId || null,
      updatedAt: new Date(),
    })
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))
    .returning()

  return updated
}

export async function updateDiagnosis({
  shopId,
  userRole,
  userId,
  id,
  diagnosis,
}: {
  shopId: string
  userRole: string
  userId: string
  id: string
  diagnosis: string
}) {
  const [existing] = await db
    .select({ id: repairs.id, assignedTechnicianId: repairs.assignedTechnicianId })
    .from(repairs)
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Repair ticket not found' })
  }

  if (userRole === 'TECHNICIAN' && existing.assignedTechnicianId !== userId) {
    throw new HTTPException(403, {
      message: 'Forbidden: Technicians can only edit diagnosis on repairs assigned to them.',
    })
  }

  const [updated] = await db
    .update(repairs)
    .set({
      diagnosis: diagnosis.trim() || null,
      updatedAt: new Date(),
    })
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))
    .returning()

  return updated
}

export async function updateEstimatedCost({
  shopId,
  userRole,
  userId,
  id,
  estimatedCostRupees,
}: {
  shopId: string
  userRole: string
  userId: string
  id: string
  estimatedCostRupees: number | null
}) {
  const [existing] = await db
    .select({
      id: repairs.id,
      assignedTechnicianId: repairs.assignedTechnicianId,
      approvalPending: repairApprovals.id,
    })
    .from(repairs)
    .leftJoin(
      repairApprovals,
      and(eq(repairApprovals.repairId, repairs.id), eq(repairApprovals.status, 'PENDING')),
    )
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Repair ticket not found' })
  }

  if (userRole === 'TECHNICIAN' && existing.assignedTechnicianId !== userId) {
    throw new HTTPException(403, {
      message: 'Forbidden: Technicians can only edit repairs assigned to them.',
    })
  }

  if (existing.approvalPending) {
    throw new HTTPException(400, {
      message: 'Estimated cost cannot be changed while customer approval is pending.',
    })
  }

  const estimatedCostPaise =
    estimatedCostRupees != null ? Math.round(estimatedCostRupees * 100) : null

  const [updated] = await db
    .update(repairs)
    .set({
      estimatedCost: estimatedCostPaise,
      updatedAt: new Date(),
    })
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))
    .returning()

  return updated
}

export async function addRepairNote({
  shopId,
  userRole,
  userId,
  id,
  note,
}: {
  shopId: string
  userRole: string
  userId: string
  id: string
  note: string
}) {
  if (!note || note.trim().length === 0) {
    throw new HTTPException(400, { message: 'Note content cannot be empty.' })
  }

  const [existing] = await db
    .select({ id: repairs.id, assignedTechnicianId: repairs.assignedTechnicianId })
    .from(repairs)
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Repair ticket not found' })
  }

  if (userRole === 'TECHNICIAN' && existing.assignedTechnicianId !== userId) {
    throw new HTTPException(403, {
      message: 'Forbidden: Technicians can only add notes to repairs assigned to them.',
    })
  }

  const noteId = crypto.randomUUID()
  const [createdNote] = await db
    .insert(repairNotes)
    .values({
      id: noteId,
      repairId: id,
      authorId: userId,
      note: note.trim(),
    })
    .returning()

  return createdNote
}

export async function updateExpectedCompletionDate({
  shopId,
  userRole,
  userId,
  id,
  expectedCompletionDate,
}: {
  shopId: string
  userRole: string
  userId: string
  id: string
  expectedCompletionDate?: string | null
}) {
  const [existing] = await db
    .select({ id: repairs.id, assignedTechnicianId: repairs.assignedTechnicianId })
    .from(repairs)
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Repair ticket not found' })
  }

  if (userRole === 'TECHNICIAN' && existing.assignedTechnicianId !== userId) {
    throw new HTTPException(403, {
      message:
        'Forbidden: Technicians can only update the expected completion date on repairs assigned to them.',
    })
  }

  if (
    expectedCompletionDate &&
    expectedCompletionDate.trim().length > 0 &&
    isExpectedCompletionDateInPast(expectedCompletionDate)
  ) {
    throw new HTTPException(400, {
      message: 'Expected completion date must not be in the past',
    })
  }

  const completionDateObj = expectedCompletionDate && expectedCompletionDate.trim().length > 0
    ? new Date(expectedCompletionDate)
    : null

  const [updated] = await db
    .update(repairs)
    .set({
      expectedCompletionDate: completionDateObj,
      updatedAt: new Date(),
    })
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))
    .returning()

  return updated
}

export async function regenerateTrackingToken({
  shopId,
  userRole,
  repairId,
}: {
  shopId: string
  userRole: string
  repairId: string
}) {
  if (!['OWNER', 'STAFF'].includes(userRole)) {
    throw new HTTPException(403, {
      message: 'Not authorized to regenerate tracking links',
    })
  }

  const [existing] = await db
    .select({ id: repairs.id })
    .from(repairs)
    .where(and(eq(repairs.id, repairId), eq(repairs.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Repair ticket not found' })
  }

  let retries = 5
  while (retries > 0) {
    const trackingToken = generateTrackingToken()
    try {
      const [updated] = await db
        .update(repairs)
        .set({ trackingToken, updatedAt: new Date() })
        .where(and(eq(repairs.id, repairId), eq(repairs.shopId, shopId)))
        .returning({ trackingToken: repairs.trackingToken })

      if (updated) {
        return updated
      }
    } catch {
      retries -= 1
    }
  }

  throw new HTTPException(500, { message: 'Failed to regenerate tracking link' })
}

