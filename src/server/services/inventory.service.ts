import { and, count, desc, eq, ilike, ne, or, sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db } from '@/server/db'
import { inventory } from '@/server/db/schema/inventory'
import { stockMovements } from '@/server/db/schema/stock-movements'
import { repairParts } from '@/server/db/schema/repair-parts'
import { repairs } from '@/server/db/schema/repairs'
import type {
  AdjustStockInput,
  PartDetailsInput,
  PartFilterInput,
  StockMovementFilterInput,
} from '@/features/inventory/schemas'
import { REORDER_THRESHOLD } from '@/features/inventory/stock-status'

type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0]
type DbClient = typeof db | TxClient

type StockMovementReason =
  | 'PURCHASE'
  | 'RETURN'
  | 'DAMAGED'
  | 'LOST'
  | 'CORRECTION'
  | 'REPAIR_USAGE'
  | 'REPAIR_REVERSAL'

export async function applyStockDelta({
  client = db,
  shopId,
  inventoryId,
  delta,
  reason,
  createdBy,
  repairId,
  note,
}: {
  client?: DbClient
  shopId: string
  inventoryId: string
  delta: number
  reason: StockMovementReason
  createdBy?: string | null
  repairId?: string | null
  note?: string | null
}) {
  if (delta === 0) {
    throw new HTTPException(400, { message: 'Stock delta must not be zero' })
  }

  const [existing] = await client
    .select({
      id: inventory.id,
      quantity: inventory.quantity,
    })
    .from(inventory)
    .where(and(eq(inventory.id, inventoryId), eq(inventory.shopId, shopId)))
    .limit(1)
    .for('update')

  if (!existing) {
    throw new HTTPException(404, { message: 'Part not found' })
  }

  const nextQuantity = existing.quantity + delta
  if (nextQuantity < 0) {
    throw new HTTPException(400, {
      message: `Insufficient stock. Current quantity is ${existing.quantity}.`,
    })
  }

  const [updated] = await client
    .update(inventory)
    .set({
      quantity: nextQuantity,
      updatedAt: new Date(),
    })
    .where(and(eq(inventory.id, inventoryId), eq(inventory.shopId, shopId)))
    .returning()

  await client.insert(stockMovements).values({
    id: crypto.randomUUID(),
    shopId,
    inventoryId,
    delta,
    quantityAfter: nextQuantity,
    reason,
    note: note ?? null,
    repairId: repairId ?? null,
    createdBy: createdBy ?? null,
  })

  return updated
}

export async function createPart({
  shopId,
  data,
  createdBy,
}: {
  shopId: string
  data: PartDetailsInput
  createdBy?: string | null
}) {
  const existingSku = await db
    .select({ id: inventory.id })
    .from(inventory)
    .where(and(eq(inventory.shopId, shopId), eq(inventory.sku, data.sku)))
    .limit(1)

  if (existingSku.length > 0) {
    throw new HTTPException(400, {
      message: 'A part with this SKU already exists in your shop',
    })
  }

  const id = crypto.randomUUID()
  const initialQuantity = 1

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(inventory)
      .values({
        id,
        shopId,
        name: data.name,
        sku: data.sku,
        quantity: initialQuantity,
        stockAlert: data.stockAlert,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        supplier: data.supplier?.trim() ? data.supplier.trim() : null,
      })
      .returning()

    await tx.insert(stockMovements).values({
      id: crypto.randomUUID(),
      shopId,
      inventoryId: id,
      delta: initialQuantity,
      quantityAfter: initialQuantity,
      reason: 'PURCHASE',
      note: 'Initial stock on create',
      repairId: null,
      createdBy: createdBy ?? null,
    })

    return created
  })
}

export async function updatePart({
  shopId,
  id,
  data,
}: {
  shopId: string
  id: string
  data: PartDetailsInput
}) {
  const [existing] = await db
    .select({ id: inventory.id })
    .from(inventory)
    .where(and(eq(inventory.id, id), eq(inventory.shopId, shopId)))
    .limit(1)

  if (!existing) {
    throw new HTTPException(404, { message: 'Part not found' })
  }

  const existingSku = await db
    .select({ id: inventory.id })
    .from(inventory)
    .where(
      and(eq(inventory.shopId, shopId), eq(inventory.sku, data.sku), ne(inventory.id, id)),
    )
    .limit(1)

  if (existingSku.length > 0) {
    throw new HTTPException(400, {
      message: 'A part with this SKU already exists in your shop',
    })
  }

  const [updated] = await db
    .update(inventory)
    .set({
      name: data.name,
      sku: data.sku,
      stockAlert: data.stockAlert,
      purchasePrice: data.purchasePrice,
      sellingPrice: data.sellingPrice,
      supplier: data.supplier?.trim() ? data.supplier.trim() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(inventory.id, id), eq(inventory.shopId, shopId)))
    .returning()

  return updated
}

export async function adjustStock({
  shopId,
  id,
  data,
  createdBy,
}: {
  shopId: string
  id: string
  data: AdjustStockInput
  createdBy: string
}) {
  const delta = data.direction === 'IN' ? data.quantity : -data.quantity

  return db.transaction(async (tx) => {
    return applyStockDelta({
      client: tx,
      shopId,
      inventoryId: id,
      delta,
      reason: data.reason,
      createdBy,
    })
  })
}

export async function getPartById({ shopId, id }: { shopId: string; id: string }) {
  const [part] = await db
    .select({
      id: inventory.id,
      shopId: inventory.shopId,
      name: inventory.name,
      sku: inventory.sku,
      quantity: inventory.quantity,
      stockAlert: inventory.stockAlert,
      purchasePrice: inventory.purchasePrice,
      sellingPrice: inventory.sellingPrice,
      supplier: inventory.supplier,
      createdAt: inventory.createdAt,
      updatedAt: inventory.updatedAt,
    })
    .from(inventory)
    .where(and(eq(inventory.id, id), eq(inventory.shopId, shopId)))
    .limit(1)

  if (!part) {
    throw new HTTPException(404, { message: 'Part not found' })
  }

  return part
}

export async function listStockMovements({
  shopId,
  inventoryId,
  page = 1,
  limit = 20,
}: StockMovementFilterInput & { shopId: string; inventoryId: string }) {
  const [part] = await db
    .select({ id: inventory.id })
    .from(inventory)
    .where(and(eq(inventory.id, inventoryId), eq(inventory.shopId, shopId)))
    .limit(1)

  if (!part) {
    throw new HTTPException(404, { message: 'Part not found' })
  }

  const offset = (page - 1) * limit
  const whereClause = and(
    eq(stockMovements.shopId, shopId),
    eq(stockMovements.inventoryId, inventoryId),
  )

  const [items, totalResult] = await Promise.all([
    db
      .select({
        id: stockMovements.id,
        shopId: stockMovements.shopId,
        inventoryId: stockMovements.inventoryId,
        delta: stockMovements.delta,
        quantityAfter: stockMovements.quantityAfter,
        reason: stockMovements.reason,
        note: stockMovements.note,
        repairId: stockMovements.repairId,
        createdBy: stockMovements.createdBy,
        createdAt: stockMovements.createdAt,
      })
      .from(stockMovements)
      .where(whereClause)
      .orderBy(desc(stockMovements.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(stockMovements).where(whereClause),
  ])

  const total = Number(totalResult[0]?.total) || 0

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  }
}

export async function deletePart({ shopId, id }: { shopId: string; id: string }) {
  const [existing] = await db
    .select({ id: inventory.id })
    .from(inventory)
    .where(and(eq(inventory.id, id), eq(inventory.shopId, shopId)))
    .limit(1)

  if (!existing) {
    throw new HTTPException(404, { message: 'Part not found' })
  }

  const [inUse] = await db
    .select({ id: repairParts.id })
    .from(repairParts)
    .where(and(eq(repairParts.inventoryId, id), eq(repairParts.shopId, shopId)))
    .limit(1)

  if (inUse) {
    throw new HTTPException(400, {
      message: 'Cannot delete this part because it has been used on a repair.',
    })
  }

  await db.delete(inventory).where(and(eq(inventory.id, id), eq(inventory.shopId, shopId)))

  return { success: true as const }
}

export async function listParts({
  shopId,
  search,
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: PartFilterInput & { shopId: string }) {
  const offset = (page - 1) * limit

  const searchCondition = search
    ? or(ilike(inventory.name, `%${search}%`), ilike(inventory.sku, `%${search}%`))
    : undefined

  const whereClause = searchCondition
    ? and(eq(inventory.shopId, shopId), searchCondition)
    : eq(inventory.shopId, shopId)

  const sortColumn =
    sortBy === 'name'
      ? inventory.name
      : sortBy === 'sku'
        ? inventory.sku
        : sortBy === 'quantity'
          ? inventory.quantity
          : sortBy === 'updatedAt'
            ? inventory.updatedAt
            : inventory.createdAt

  const [items, statsResult] = await Promise.all([
    db
      .select({
        id: inventory.id,
        shopId: inventory.shopId,
        name: inventory.name,
        sku: inventory.sku,
        quantity: inventory.quantity,
        stockAlert: inventory.stockAlert,
        purchasePrice: inventory.purchasePrice,
        sellingPrice: inventory.sellingPrice,
        supplier: inventory.supplier,
        createdAt: inventory.createdAt,
        updatedAt: inventory.updatedAt,
      })
      .from(inventory)
      .where(whereClause)
      .orderBy(sortOrder === 'asc' ? sortColumn : desc(sortColumn))
      .limit(limit)
      .offset(offset),
    db
      .select({
        total: count(),
        outOfStockCount: sql<number>`count(*) filter (where ${inventory.quantity} = 0)::int`,
        lowStockCount: sql<number>`count(*) filter (where ${inventory.quantity} > 0 and (${inventory.quantity} <= ${REORDER_THRESHOLD} or ${inventory.quantity} <= ${inventory.stockAlert}))::int`,
      })
      .from(inventory)
      .where(whereClause),
  ])

  const stats = statsResult[0] ?? { total: 0, outOfStockCount: 0, lowStockCount: 0 }
  const total = Number(stats.total) || 0
  const totalPages = Math.ceil(total / limit) || 1

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    outOfStockCount: Number(stats.outOfStockCount) || 0,
    lowStockCount: Number(stats.lowStockCount) || 0,
  }
}
