import { and, count, desc, eq, gt, ilike, lte, or } from 'drizzle-orm'
import { db } from '@/server/db'
import { inventory } from '@/server/db/schema/inventory'
import type { PartFilterInput } from '@/features/inventory/schemas'
import { REORDER_THRESHOLD } from '@/features/inventory/stock-status'

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

  const outOfStockWhere = and(whereClause, eq(inventory.quantity, 0))
  const lowStockWhere = and(
    whereClause,
    gt(inventory.quantity, 0),
    or(
      lte(inventory.quantity, REORDER_THRESHOLD),
      lte(inventory.quantity, inventory.minimumStock),
    ),
  )

  const [countResult, items, outOfStockResult, lowStockResult] = await Promise.all([
    db.select({ total: count() }).from(inventory).where(whereClause),
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
    db.select({ total: count() }).from(inventory).where(outOfStockWhere),
    db.select({ total: count() }).from(inventory).where(lowStockWhere),
  ])

  const total = countResult[0]?.total ?? 0
  const totalPages = Math.ceil(total / limit) || 1

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    outOfStockCount: outOfStockResult[0]?.total ?? 0,
    lowStockCount: lowStockResult[0]?.total ?? 0,
  }
}
