import { and, eq, inArray, or, ilike, desc, asc, count, gte, lte, SQL } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db } from '@/server/db'
import { customers } from '@/server/db/schema/customers'
import { devices, repairNotes, repairStatusHistory, repairs } from '@/server/db/schema/repairs'
import { users } from '@/server/db/schema/users'
import type { CreateRepairInput } from '@/features/repairs/schemas'

function generateTicketNumber(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const num = 1000000000 + (array[0] % 9000000000)
  return num.toString()
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
            status: 'RECEIVED',
            problemDescription: data.problemDescription,
            issueDescription: data.problemDescription,
            initialCondition: data.initialCondition,
            estimatedCost: data.estimatedCost ?? null,
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
  technicianId?: string
  startDate?: string
  endDate?: string
  search?: string
  page?: number
  limit?: number
}) {
  const conditions: SQL[] = [eq(repairs.shopId, shopId)]

  // Strict Technician Scoping: TECHNICIAN only ever sees repairs assigned to them
  if (userRole === 'TECHNICIAN') {
    conditions.push(eq(repairs.assignedTechnicianId, userId))
  } else if (technicianId) {
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

  const [{ count: totalCount }] = await db
    .select({ count: count() })
    .from(repairs)
    .leftJoin(customers, eq(customers.id, repairs.customerId))
    .where(whereClause)

  const total = Number(totalCount)
  const offset = (page - 1) * limit

  const items = await db
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
    .offset(offset)

  return {
    items,
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

  // Strict Technician Scoping
  if (userRole === 'TECHNICIAN') {
    conditions.push(eq(repairs.assignedTechnicianId, userId))
  }

  const result = await db
    .select({
      id: repairs.id,
      shopId: repairs.shopId,
      customerId: repairs.customerId,
      deviceId: repairs.deviceId,
      ticketNumber: repairs.ticketNumber,
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

  // Fetch creator info
  let creator = null
  if (repair.createdBy) {
    const [c] = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, repair.createdBy))
    creator = c || null
  }

  // Fetch assigned technician info
  let assignedTechnician = null
  if (repair.assignedTechnicianId) {
    const [t] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, repair.assignedTechnicianId))
    assignedTechnician = t || null
  }

  // Fetch repair notes
  const notes = await db
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
    .orderBy(asc(repairNotes.createdAt))

  // Fetch status history
  const statusHistory = await db
    .select({
      id: repairStatusHistory.id,
      fromStatus: repairStatusHistory.fromStatus,
      toStatus: repairStatusHistory.toStatus,
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
    .orderBy(asc(repairStatusHistory.createdAt))

  return {
    ...repair,
    creator,
    assignedTechnician,
    notes,
    statusHistory,
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
      deviceId: repairs.deviceId,
      assignedTechnicianId: repairs.assignedTechnicianId,
      modelVerified: devices.modelVerified,
    })
    .from(repairs)
    .leftJoin(devices, eq(devices.id, repairs.deviceId))
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

  // TRANSITION GATE: DIAGNOSING -> WAITING_FOR_APPROVAL
  if (
    existing.status === 'DIAGNOSING' &&
    status === 'WAITING_FOR_APPROVAL' &&
    existing.modelVerified === false &&
    Boolean(existing.assignedTechnicianId)
  ) {
    throw new HTTPException(400, {
      message: 'Confirm the device model before sending an estimate',
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
