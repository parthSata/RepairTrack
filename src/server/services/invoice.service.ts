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
import { buildInvoiceGeneratedEmail, type InvoiceGeneratedEmailData } from '@/server/email/templates/invoice-generated'
import { toContainsPattern } from '@/server/lib/sql-search'
import { queueShopEmail } from '@/server/services/email.service'
import { hasIssuedInvoice } from '@/server/services/invoice-lock.helpers'
import { getTotalPaid } from '@/server/services/payment.service'
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

type InvoiceEmail = InvoiceGeneratedEmailData & { invoiceId: string }

export async function createInvoiceFromRepair({
  shopId,
  repairId,
  createdBy,
}: {
  shopId: string
  repairId: string
  createdBy: string
}): Promise<CreatedInvoice> {
  const { email, customerEmail } = await db.transaction(async (tx) => {
    // Locks only the repair row: prevents two concurrent requests for the same repair from both
    // passing the "already invoiced" check without blocking edits to the joined customer/device.
    const [repair] = await tx
      .select({
        customerId: repairs.customerId,
        laborCharges: repairs.laborCharges,
        additionalCharges: repairs.additionalCharges,
        taxPercent: repairs.taxPercent,
        finalTotal: repairs.finalTotal,
        ticketNumber: repairs.ticketNumber,
        trackingToken: repairs.trackingToken,
        customer: { name: customers.name, phone: customers.phone, email: customers.email },
        device: { brand: devices.brand, model: devices.model, serialNumber: devices.serialNumber },
        shop: { name: shops.name, address: shops.address, phone: shops.phone, email: shops.email },
      })
      .from(repairs)
      .innerJoin(customers, eq(customers.id, repairs.customerId))
      .innerJoin(devices, eq(devices.id, repairs.deviceId))
      .innerJoin(shops, eq(shops.id, repairs.shopId))
      .where(and(eq(repairs.id, repairId), eq(repairs.shopId, shopId)))
      .for('update', { of: repairs })

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
    const [invoiceNumber, totalPaid] = await Promise.all([
      generateInvoiceNumber(tx, shopId),
      getTotalPaid({ client: tx, shopId, repairId }),
    ])
    const charges = {
      laborCharges: repair.laborCharges,
      partsCharges: totals.partsCharges,
      additionalCharges: repair.additionalCharges,
      taxPercent: repair.taxPercent,
      taxAmount: totals.taxAmount,
      total: totals.total,
    }

    const [inserted] = await tx
      .insert(invoices)
      .values({ id: invoiceId, shopId, repairId, customerId: repair.customerId, invoiceNumber, ...charges, createdBy })
      .returning({ createdAt: invoices.createdAt })

    const items = parts.map((part) => ({
      partName: part.partName,
      quantity: part.quantity,
      unitPrice: part.unitSellingPrice,
    }))
    if (items.length > 0) {
      await tx
        .insert(invoiceItems)
        .values(items.map((item) => ({ id: crypto.randomUUID(), shopId, invoiceId, ...item })))
    }

    const email: InvoiceEmail = {
      invoiceId,
      invoiceNumber,
      issuedAt: inserted?.createdAt ?? new Date(),
      ticketNumber: repair.ticketNumber,
      shop: repair.shop,
      customer: repair.customer,
      device: repair.device,
      items,
      charges,
      totalPaid,
      trackingToken: repair.trackingToken,
    }
    return { email, customerEmail: repair.customer.email }
  })

  queueShopEmail({
    shopId,
    repairId,
    type: 'INVOICE_GENERATED',
    to: customerEmail,
    dedupeKey: `INVOICE_GENERATED:${email.invoiceId}`,
    email: () => buildInvoiceGeneratedEmail(email),
  })
  return { id: email.invoiceId, invoiceNumber: email.invoiceNumber }
}

const INVOICE_SORT_COLUMNS = {
  createdAt: invoices.createdAt,
  invoiceNumber: invoices.invoiceNumber,
  total: invoices.total,
} satisfies Record<InvoiceSortField, unknown>

function buildInvoiceListWhere({
  shopId,
  customerId,
  search,
}: Pick<InvoiceFilterInput, 'customerId' | 'search'> & { shopId: string }): SQL | undefined {
  const conditions: SQL[] = [eq(invoices.shopId, shopId)]
  if (customerId) conditions.push(eq(invoices.customerId, customerId))

  const pattern = toContainsPattern(search)
  if (pattern) {
    const searchCondition = or(
      ilike(invoices.invoiceNumber, pattern),
      ilike(customers.name, pattern),
      ilike(customers.phone, pattern),
    )
    if (searchCondition) conditions.push(searchCondition)
  }

  return and(...conditions)
}

export async function listInvoices({
  shopId,
  customerId,
  search,
  page,
  limit,
  sortBy,
  sortOrder,
}: InvoiceFilterInput & { shopId: string }) {
  const whereClause = buildInvoiceListWhere({ shopId, customerId, search })

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
      shop: {
        name: shops.name,
        address: shops.address,
        phone: shops.phone,
      },
      customer: {
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
      },
      device: {
        brand: devices.brand,
        model: devices.model,
        serialNumber: devices.serialNumber,
      },
    })
    .from(invoices)
    .innerJoin(shops, eq(shops.id, invoices.shopId))
    .innerJoin(repairs, eq(repairs.id, invoices.repairId))
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .innerJoin(devices, eq(devices.id, repairs.deviceId))
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
