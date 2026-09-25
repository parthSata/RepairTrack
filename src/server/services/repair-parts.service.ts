import { and, asc, eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db } from '@/server/db'
import { inventory } from '@/server/db/schema/inventory'
import { repairParts } from '@/server/db/schema/repair-parts'
import { repairs } from '@/server/db/schema/repairs'
import { applyStockDelta } from '@/server/services/inventory.service'

async function assertCanRecordParts({
  shopId,
  repairId,
  userRole,
  userId,
}: {
  shopId: string
  repairId: string
  userRole: string
  userId: string
}) {
  const [repair] = await db
    .select({
      id: repairs.id,
      assignedTechnicianId: repairs.assignedTechnicianId,
      status: repairs.status,
    })
    .from(repairs)
    .where(and(eq(repairs.id, repairId), eq(repairs.shopId, shopId)))
    .limit(1)

  if (!repair) {
    throw new HTTPException(404, { message: 'Repair ticket not found' })
  }

  if (userRole === 'OWNER' || userRole === 'STAFF') {
    return repair
  }

  if (userRole === 'TECHNICIAN') {
    if (repair.assignedTechnicianId !== userId) {
      throw new HTTPException(403, {
        message: 'Forbidden: Technicians can only record parts on repairs assigned to them.',
      })
    }
    return repair
  }

  throw new HTTPException(403, { message: 'Not authorized to record parts used' })
}

export async function listRepairParts({
  shopId,
  repairId,
}: {
  shopId: string
  repairId: string
}) {
  return db
    .select({
      id: repairParts.id,
      shopId: repairParts.shopId,
      repairId: repairParts.repairId,
      inventoryId: repairParts.inventoryId,
      quantity: repairParts.quantity,
      unitSellingPrice: repairParts.unitSellingPrice,
      createdAt: repairParts.createdAt,
      updatedAt: repairParts.updatedAt,
      partName: inventory.name,
      partSku: inventory.sku,
    })
    .from(repairParts)
    .innerJoin(inventory, eq(inventory.id, repairParts.inventoryId))
    .where(and(eq(repairParts.shopId, shopId), eq(repairParts.repairId, repairId)))
    .orderBy(asc(repairParts.createdAt))
}

export async function addRepairPart({
  shopId,
  repairId,
  userRole,
  userId,
  inventoryId,
  quantity,
}: {
  shopId: string
  repairId: string
  userRole: string
  userId: string
  inventoryId: string
  quantity: number
}) {
  await assertCanRecordParts({ shopId, repairId, userRole, userId })

  if (quantity < 1) {
    throw new HTTPException(400, { message: 'Quantity must be at least 1' })
  }

  const [part] = await db
    .select({
      id: inventory.id,
      sellingPrice: inventory.sellingPrice,
      quantity: inventory.quantity,
    })
    .from(inventory)
    .where(and(eq(inventory.id, inventoryId), eq(inventory.shopId, shopId)))
    .limit(1)

  if (!part) {
    throw new HTTPException(404, { message: 'Part not found' })
  }

  return db.transaction(async (tx) => {
    const [existingLine] = await tx
      .select({
        id: repairParts.id,
        quantity: repairParts.quantity,
      })
      .from(repairParts)
      .where(
        and(
          eq(repairParts.shopId, shopId),
          eq(repairParts.repairId, repairId),
          eq(repairParts.inventoryId, inventoryId),
        ),
      )
      .limit(1)
      .for('update')

    await applyStockDelta({
      client: tx,
      shopId,
      inventoryId,
      delta: -quantity,
      reason: 'REPAIR_USAGE',
      createdBy: userId,
      repairId,
    })

    if (existingLine) {
      const [updated] = await tx
        .update(repairParts)
        .set({
          quantity: existingLine.quantity + quantity,
          updatedAt: new Date(),
        })
        .where(and(eq(repairParts.id, existingLine.id), eq(repairParts.shopId, shopId)))
        .returning()
      return updated
    }

    const [created] = await tx
      .insert(repairParts)
      .values({
        id: crypto.randomUUID(),
        shopId,
        repairId,
        inventoryId,
        quantity,
        unitSellingPrice: part.sellingPrice,
      })
      .returning()

    return created
  })
}

export async function updateRepairPartQuantity({
  shopId,
  repairId,
  partRowId,
  userRole,
  userId,
  quantity,
}: {
  shopId: string
  repairId: string
  partRowId: string
  userRole: string
  userId: string
  quantity: number
}) {
  await assertCanRecordParts({ shopId, repairId, userRole, userId })

  if (quantity < 1) {
    throw new HTTPException(400, { message: 'Quantity must be at least 1' })
  }

  return db.transaction(async (tx) => {
    const [existingLine] = await tx
      .select({
        id: repairParts.id,
        inventoryId: repairParts.inventoryId,
        quantity: repairParts.quantity,
      })
      .from(repairParts)
      .where(
        and(
          eq(repairParts.id, partRowId),
          eq(repairParts.repairId, repairId),
          eq(repairParts.shopId, shopId),
        ),
      )
      .limit(1)
      .for('update')

    if (!existingLine) {
      throw new HTTPException(404, { message: 'Repair part line not found' })
    }

    const delta = quantity - existingLine.quantity
    if (delta === 0) {
      return existingLine
    }

    await applyStockDelta({
      client: tx,
      shopId,
      inventoryId: existingLine.inventoryId,
      delta: -delta,
      reason: delta > 0 ? 'REPAIR_USAGE' : 'REPAIR_REVERSAL',
      createdBy: userId,
      repairId,
    })

    const [updated] = await tx
      .update(repairParts)
      .set({
        quantity,
        updatedAt: new Date(),
      })
      .where(and(eq(repairParts.id, partRowId), eq(repairParts.shopId, shopId)))
      .returning()

    return updated
  })
}

export async function removeRepairPart({
  shopId,
  repairId,
  partRowId,
  userRole,
  userId,
}: {
  shopId: string
  repairId: string
  partRowId: string
  userRole: string
  userId: string
}) {
  await assertCanRecordParts({ shopId, repairId, userRole, userId })

  return db.transaction(async (tx) => {
    const [existingLine] = await tx
      .select({
        id: repairParts.id,
        inventoryId: repairParts.inventoryId,
        quantity: repairParts.quantity,
      })
      .from(repairParts)
      .where(
        and(
          eq(repairParts.id, partRowId),
          eq(repairParts.repairId, repairId),
          eq(repairParts.shopId, shopId),
        ),
      )
      .limit(1)
      .for('update')

    if (!existingLine) {
      throw new HTTPException(404, { message: 'Repair part line not found' })
    }

    await applyStockDelta({
      client: tx,
      shopId,
      inventoryId: existingLine.inventoryId,
      delta: existingLine.quantity,
      reason: 'REPAIR_REVERSAL',
      createdBy: userId,
      repairId,
    })

    await tx
      .delete(repairParts)
      .where(and(eq(repairParts.id, partRowId), eq(repairParts.shopId, shopId)))

    return { success: true as const }
  })
}
