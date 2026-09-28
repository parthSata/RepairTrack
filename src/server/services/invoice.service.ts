import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db, type TxClient } from '@/server/db'
import { customers } from '@/server/db/schema/customers'
import { invoiceItems, invoices } from '@/server/db/schema/invoices'
import { devices, repairs } from '@/server/db/schema/repairs'
import { shops, users } from '@/server/db/schema/users'
import { calculateRepairTotal, sumPartsCharges } from '@/features/repairs/pricing-calc'
import { isFinalBillConfirmed } from '@/features/repairs/pricing-rules'
import {
  INVOICE_MESSAGES,
  type InvoiceFilterInput,
  type InvoiceSortField,
} from '@/features/invoices/schemas'
import { getOffset, toPaginatedResult } from '@/lib/pagination'
import { toContainsPattern } from '@/server/lib/sql-search'
import { hasIssuedInvoice } from '@/server/services/invoice-lock.helpers'
import { listRepairParts } from '@/server/services/repair-parts.service'

const INVOICE_NUMBER_PREFIX = 'INV-'
const INVOICE_NUMBER_DIGITS = 6
const SEQUENCE_START = INVOICE_NUMBER_PREFIX.length + 1

// Locking the shop row serializes concurrent invoice creation per shop so two
// transactions cannot read the same max; the (shop_id, invoice_number) unique
// index is the backstop.
export async function generateInvoiceNumber(tx: TxClient, shopId: string): Promise<string> {
  const [shop] = await tx
    .select({ id: shops.id })
    .from(shops)
    .where(eq(shops.id, shopId))
    .for('update')

  if (!shop) {
    throw new HTTPException(404, { message: 'Shop not found' })
  }

  const [row] = await tx
    .select({
      maxSequence: sql<number>`coalesce(max(cast(substring(${invoices.invoiceNumber} from ${SEQUENCE_START}::integer) as integer)), 0)`,
    })
    .from(invoices)
    .where(eq(invoices.shopId, shopId))

  const nextSequence = Number(row?.maxSequence ?? 0) + 1
  return `${INVOICE_NUMBER_PREFIX}${String(nextSequence).padStart(INVOICE_NUMBER_DIGITS, '0')}`
}

export type CreatedInvoice = {
  id: string
  invoiceNumber: string
}

export async function createInvoiceFromRepair({
  shopId,
  repairId,
  createdBy,
}: {
  shopId: string
  repairId: string
  createdBy: string
}): Promise<CreatedInvoice> {
  return db.transaction(async (tx) => {
    // Row lock prevents two concurrent requests for the same repair from both passing the
    // "already invoiced" check.
    const [repair] = await tx
      .select({
        customerId: repairs.customerId,
        laborCharges: repairs.laborCharges,
        additionalCharges: repairs.additionalCharges,
        taxPercent: repairs.taxPercent,
        finalTotal: repairs.finalTotal,
      })
      .from(repairs)
      .where(and(eq(repairs.id, repairId), eq(repairs.shopId, shopId)))
      .for('update')

    if (!repair) {
      throw new HTTPException(404, { message: INVOICE_MESSAGES.repairNotFound })
    }

    if (!isFinalBillConfirmed(repair.finalTotal)) {
      throw new HTTPException(409, { message: INVOICE_MESSAGES.finalBillRequired })
    }

    if (await hasIssuedInvoice({ client: tx, shopId, repairId })) {
      throw new HTTPException(409, { message: INVOICE_MESSAGES.alreadyExists })
    }

    const parts = await listRepairParts({ client: tx, shopId, repairId })
    const totals = calculateRepairTotal({
      laborCharges: repair.laborCharges,
      partsCharges: sumPartsCharges(parts),
      additionalCharges: repair.additionalCharges,
      taxPercent: repair.taxPercent,
    })

    if (totals.total !== repair.finalTotal) {
      throw new HTTPException(409, { message: INVOICE_MESSAGES.billOutOfDate })
    }

    const invoiceId = crypto.randomUUID()
    const invoiceNumber = await generateInvoiceNumber(tx, shopId)

    await tx.insert(invoices).values({
      id: invoiceId,
      shopId,
      repairId,
      customerId: repair.customerId,
      invoiceNumber,
      laborCharges: repair.laborCharges,
      partsCharges: totals.partsCharges,
      additionalCharges: repair.additionalCharges,
      taxPercent: repair.taxPercent,
      taxAmount: totals.taxAmount,
      total: totals.total,
      createdBy,
    })

    if (parts.length > 0) {
      await tx.insert(invoiceItems).values(
        parts.map((part) => ({
          id: crypto.randomUUID(),
          shopId,
          invoiceId,
          partName: part.partName,
          quantity: part.quantity,
          unitPrice: part.unitSellingPrice,
        })),
      )
    }

    return { id: invoiceId, invoiceNumber }
  })
}

const INVOICE_SORT_COLUMNS = {
  createdAt: invoices.createdAt,
  invoiceNumber: invoices.invoiceNumber,
  total: invoices.total,
} satisfies Record<InvoiceSortField, unknown>

export async function listInvoices({
  shopId,
  search,
  page,
  limit,
  sortBy,
  sortOrder,
}: InvoiceFilterInput & { shopId: string }) {
  const pattern = toContainsPattern(search)
  const shopScope = eq(invoices.shopId, shopId)
  const searchCondition: SQL | undefined = pattern
    ? or(
        ilike(invoices.invoiceNumber, pattern),
        ilike(customers.name, pattern),
        ilike(customers.phone, pattern),
      )
    : undefined
  const whereClause = searchCondition ? and(shopScope, searchCondition) : shopScope

  const sortColumn = INVOICE_SORT_COLUMNS[sortBy]
  const direction = sortOrder === 'asc' ? asc : desc

  // `count(*) over ()` returns the filtered total on every row, so one round-trip on one
  // connection serves both the page and the pagination total.
  const rows = await db
    .select({
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        total: invoices.total,
        createdAt: invoices.createdAt,
        repairId: invoices.repairId,
        ticketNumber: repairs.ticketNumber,
      },
      customer: {
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
      },
      device: {
        brand: devices.brand,
        model: devices.model,
      },
      matchCount: sql<number>`count(*) over ()`.mapWith(Number),
    })
    .from(invoices)
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .innerJoin(repairs, eq(repairs.id, invoices.repairId))
    .innerJoin(devices, eq(devices.id, repairs.deviceId))
    .where(whereClause)
    .orderBy(direction(sortColumn), direction(invoices.id))
    .limit(limit)
    .offset(getOffset(page, limit))

  const items = rows.map(({ invoice, customer, device }) => ({ ...invoice, customer, device }))
  const total = rows[0]?.matchCount ?? (page > 1 ? await countInvoices(whereClause) : 0)

  return toPaginatedResult(items, total, page, limit)
}

/** Only needed when a page past the end returns no rows (so no window count came back). */
async function countInvoices(whereClause: SQL | undefined): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(invoices)
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .where(whereClause)
  return Number(row?.total ?? 0)
}

export async function getInvoiceById({ shopId, id }: { shopId: string; id: string }) {
  const [invoice] = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      repairId: invoices.repairId,
      laborCharges: invoices.laborCharges,
      partsCharges: invoices.partsCharges,
      additionalCharges: invoices.additionalCharges,
      taxPercent: invoices.taxPercent,
      taxAmount: invoices.taxAmount,
      total: invoices.total,
      status: invoices.status,
      cancellationReason: invoices.cancellationReason,
      cancelledAt: invoices.cancelledAt,
      cancelledBy: invoices.cancelledBy,
      createdAt: invoices.createdAt,
      ticketNumber: repairs.ticketNumber,
      customer: {
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
      },
    })
    .from(invoices)
    .innerJoin(repairs, eq(repairs.id, invoices.repairId))
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .where(and(eq(invoices.id, id), eq(invoices.shopId, shopId)))
    .limit(1)

  if (!invoice) {
    throw new HTTPException(404, { message: INVOICE_MESSAGES.invoiceNotFound })
  }

  const { cancelledBy, ...invoiceFields } = invoice
  const [items, cancellerResult] = await Promise.all([
    db
      .select({
        id: invoiceItems.id,
        partName: invoiceItems.partName,
        quantity: invoiceItems.quantity,
        unitPrice: invoiceItems.unitPrice,
      })
      .from(invoiceItems)
      .where(and(eq(invoiceItems.invoiceId, id), eq(invoiceItems.shopId, shopId)))
      .orderBy(asc(invoiceItems.partName)),
    cancelledBy
      ? db.select({ name: users.name }).from(users).where(eq(users.id, cancelledBy)).limit(1)
      : Promise.resolve([]),
  ])

  return {
    ...invoiceFields,
    cancelledByName: cancellerResult[0]?.name ?? null,
    items,
  }
}

export async function cancelInvoice({
  shopId,
  id,
  reason,
  cancelledBy,
}: {
  shopId: string
  id: string
  reason: string
  cancelledBy: string
}): Promise<{ id: string; invoiceNumber: string; repairId: string }> {
  return db.transaction(async (tx) => {
    const [invoice] = await tx
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        repairId: invoices.repairId,
        status: invoices.status,
      })
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.shopId, shopId)))
      .for('update')

    if (!invoice) {
      throw new HTTPException(404, { message: INVOICE_MESSAGES.invoiceNotFound })
    }

    if (invoice.status === 'CANCELLED') {
      throw new HTTPException(409, { message: INVOICE_MESSAGES.alreadyCancelled })
    }

    const now = new Date()
    await tx
      .update(invoices)
      .set({
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: now,
        cancelledBy,
        updatedAt: now,
      })
      .where(and(eq(invoices.id, id), eq(invoices.shopId, shopId)))

    return { id: invoice.id, invoiceNumber: invoice.invoiceNumber, repairId: invoice.repairId }
  })
}
