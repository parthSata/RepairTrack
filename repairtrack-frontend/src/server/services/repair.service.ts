import { and, eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db } from '@/server/db'
import { customers } from '@/server/db/schema/customers'
import { devices, repairs } from '@/server/db/schema/repairs'

export async function getRepairById({ shopId, id }: { shopId: string; id: string }) {
  const result = await db
    .select({
      id: repairs.id,
      shopId: repairs.shopId,
      customerId: repairs.customerId,
      deviceId: repairs.deviceId,
      ticketNumber: repairs.ticketNumber,
      status: repairs.status,
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
      modelVerified: devices.modelVerified,
    })
    .from(repairs)
    .leftJoin(devices, eq(devices.id, repairs.deviceId))
    .where(and(eq(repairs.id, id), eq(repairs.shopId, shopId)))

  if (!existing) {
    throw new HTTPException(404, { message: 'Repair ticket not found' })
  }

  // TRANSITION GATE: DIAGNOSING -> WAITING_FOR_APPROVAL
  // Block if linked device model is unverified (modelVerified: false)
  if (
    existing.status === 'DIAGNOSING' &&
    status === 'WAITING_FOR_APPROVAL' &&
    existing.modelVerified === false
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
