import { and, count, desc, eq, ilike, ne, or, sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db } from '@/server/db'
import { inventory } from '@/server/db/schema/inventory'
import type { PartFilterInput, PartFormInput } from '@/features/inventory/schemas'
import { REORDER_THRESHOLD } from '@/features/inventory/stock-status'

export async function createPart({
  shopId,
  data,
}: {
  shopId: string
  data: PartFormInput
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
  const [created] = await db
    .insert(inventory)
    .values({
      id,
      shopId,
      name: data.name,
      sku: data.sku,
      quantity: data.quantity,
      minimumStock: data.minimumStock,
      purchasePrice: data.purchasePrice,
      sellingPrice: data.sellingPrice,
      supplier: data.supplier?.trim() ? data.supplier.trim() : null,
    })
    .returning()

  return created
}

export async function updatePart({
  shopId,
  id,
  data,
}: {
  shopId: string
  id: string
  data: PartFormInput
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
      quantity: data.quantity,
      minimumStock: data.minimumStock,
      purchasePrice: data.purchasePrice,
      sellingPrice: data.sellingPrice,
      supplier: data.supplier?.trim() ? data.supplier.trim() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(inventory.id, id), eq(inventory.shopId, shopId)))
    .returning()

  return updated
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
        minimumStock: inventory.minimumStock,
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
        lowStockCount: sql<number>`count(*) filter (where ${inventory.quantity} > 0 and (${inventory.quantity} <= ${REORDER_THRESHOLD} or ${inventory.quantity} <= ${inventory.minimumStock}))::int`,
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
