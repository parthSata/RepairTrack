import { and, eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db } from '@/server/db'
import { customers } from '@/server/db/schema/customers'
import { devices, repairNotes, repairs } from '@/server/db/schema/repairs'
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

  // 4. Verify Technician (if provided) is an active TECHNICIAN in current shop
  if (data.assignedTechnicianId) {
    const [tech] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, data.assignedTechnicianId),
          eq(users.shopId, shopId),
          eq(users.role, 'TECHNICIAN'),
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

export async function getRepairById({ shopId, id }: { shopId: string; id: string }) {
  const result = await db
    .select({
      id: repairs.id,
      shopId: repairs.shopId,
      customerId: repairs.customerId,
      deviceId: repairs.deviceId,
      ticketNumber: repairs.ticketNumber,
      status: repairs.status,
      assignedTechnicianId: repairs.assignedTechnicianId,
      issueDescription: repairs.issueDescription,
      estimatedCost: repairs.estimatedCost,
      finalCost: repairs.finalCost,
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
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))

  const repair = result[0]
  if (!repair) throw new HTTPException(404, { message: 'Repair ticket not found' })

  return repair
}

export async function updateRepairStatus({
  shopId,
  id,
  status,
}: {
  shopId: string
  id: string
  status: typeof repairs.$inferSelect.status
}) {
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

  // TRANSITION GATE: DIAGNOSING -> WAITING_FOR_APPROVAL
  // Block if linked device model is unverified (modelVerified: false) AND technician is assigned
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

  const [updated] = await db
    .update(repairs)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))
    .returning()

  return updated
}
