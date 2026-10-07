import { and, asc, desc, eq, gte, ilike, isNotNull, lte, ne, or, sql, count, type SQL } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db, type DbClient } from '@/server/db'
import { customers } from '@/server/db/schema/customers'
import { invoices } from '@/server/db/schema/invoices'
import { payments } from '@/server/db/schema/payments'
import { repairs } from '@/server/db/schema/repairs'
import { shops, users } from '@/server/db/schema/users'
import {
  PAYMENT_MESSAGES,
  type PaymentFilterInput,
  type RecordPaymentInput,
} from '@/features/payments/schemas'
import { getBillTotal, getPaymentSummary } from '@/features/payments/summary'
import { getOffset, toPaginatedResult } from '@/lib/pagination'
import { rupeesToPaise } from '@/lib/money'
import { buildPaymentReceivedEmail, type PaymentReceivedEmailData } from '@/server/email/templates/payment-received'
import { toContainsPattern } from '@/server/lib/sql-search'
import { queueShopEmail } from '@/server/services/email.service'
import { getShopUpi } from '@/server/services/shop.service'

type RepairScope = { shopId: string; repairId: string }

export async function getTotalPaid({
  client = db,
  shopId,
  repairId,
}: RepairScope & { client?: DbClient }): Promise<number> {
  const [row] = await client
    .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(and(eq(payments.shopId, shopId), eq(payments.repairId, repairId)))
  // Postgres returns sum() as bigint, which the driver hands back as a string.
  return Number(row?.total ?? 0)
}

async function findRepairForPayment(
  client: DbClient,
  { shopId, repairId, lock = false }: RepairScope & { lock?: boolean },
) {
  const query = client
    .select({
      customerId: repairs.customerId,
      status: repairs.status,
      finalTotal: repairs.finalTotal,
      estimatedTotal: repairs.estimatedTotal,
    })
    .from(repairs)
    .where(and(eq(repairs.id, repairId), eq(repairs.shopId, shopId)))

  const [repair] = lock ? await query.for('update') : await query
  if (!repair) throw new HTTPException(404, { message: PAYMENT_MESSAGES.repairNotFound })
  return repair
}

export async function listRepairPayments({ shopId, repairId }: RepairScope) {
  const repair = await findRepairForPayment(db, { shopId, repairId })
  const paymentRows = db
    .select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      reference: payments.reference,
      note: payments.note,
      paidAt: payments.paidAt,
      receivedByName: users.name,
    })
    .from(payments)
    .leftJoin(users, eq(users.id, payments.receivedBy))
    .where(and(eq(payments.shopId, shopId), eq(payments.repairId, repairId)))
    .orderBy(desc(payments.paidAt), desc(payments.createdAt))
  const [rows, upi] = await Promise.all([paymentRows, getShopUpi(shopId)])

  const billTotal = getBillTotal(repair)
  const summary = getPaymentSummary({ billTotal: billTotal ?? 0, payments: rows })
  const hasBill = billTotal != null

  return {
    payments: rows,
    billTotal,
    totalPaid: summary.totalPaid,
    balance: hasBill ? summary.balance : null,
    status: hasBill ? summary.status : null,
    repairStatus: repair.status,
    upi,
  }
}

function buildPaymentListWhere({
  shopId,
  search,
  method,
  startDate,
  endDate,
}: {
  shopId: string
  search?: string
  method?: PaymentFilterInput['method']
  startDate?: string
  endDate?: string
}): SQL {
  const conditions: SQL[] = [eq(payments.shopId, shopId)]

  if (method) {
    conditions.push(eq(payments.method, method as typeof payments.$inferSelect.method))
  }

  if (startDate) {
    const start = new Date(startDate)
    if (!Number.isNaN(start.getTime())) {
      start.setHours(0, 0, 0, 0)
      conditions.push(gte(payments.paidAt, start))
    }
  }

  if (endDate) {
    const end = new Date(endDate)
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999)
      conditions.push(lte(payments.paidAt, end))
    }
  }

  const pattern = toContainsPattern(search)
  if (pattern) {
    const searchCondition = or(
      ilike(repairs.ticketNumber, pattern),
      ilike(customers.name, pattern),
      ilike(customers.phone, pattern),
    )
    if (searchCondition) conditions.push(searchCondition)
  }

  return and(...conditions)!
}

async function getPaymentTotals(whereClause: SQL) {
  const [row] = await db
    .select({
      total: count(),
      totalAmount: sql<string>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .innerJoin(repairs, eq(repairs.id, payments.repairId))
    .innerJoin(customers, eq(customers.id, payments.customerId))
    .where(whereClause)

  return {
    total: Number(row?.total ?? 0),
    totalAmount: Number(row?.totalAmount ?? 0),
  }
}

export async function listPayments({
  shopId,
  search,
  method,
  startDate,
  endDate,
  page,
  limit,
  sortOrder,
}: PaymentFilterInput & { shopId: string }) {
  const whereClause = buildPaymentListWhere({ shopId, search, method, startDate, endDate })
  const direction = sortOrder === 'asc' ? asc : desc

  const rows = await db
    .select({
      payment: {
        id: payments.id,
        amount: payments.amount,
        method: payments.method,
        reference: payments.reference,
        note: payments.note,
        paidAt: payments.paidAt,
      },
      repair: {
        id: repairs.id,
        ticketNumber: repairs.ticketNumber,
      },
      customer: {
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
      },
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
      },
      receivedByName: users.name,
      matchCount: sql<number>`count(*) over ()`.mapWith(Number),
      totalAmount: sql<number>`coalesce(sum(${payments.amount}) over (), 0)`.mapWith(Number),
    })
    .from(payments)
    .innerJoin(repairs, eq(repairs.id, payments.repairId))
    .innerJoin(customers, eq(customers.id, payments.customerId))
    .leftJoin(users, eq(users.id, payments.receivedBy))
    .leftJoin(
      invoices,
      and(
        eq(invoices.repairId, payments.repairId),
        eq(invoices.status, 'ISSUED'),
      ),
    )
    .where(whereClause)
    .orderBy(direction(payments.paidAt), direction(payments.id))
    .limit(limit)
    .offset(getOffset(page, limit))

  const items = rows.map((r) => ({
    ...r.payment,
    paidAt: r.payment.paidAt.toISOString(),
    repair: r.repair,
    customer: r.customer,
    invoice: r.invoice?.id ? { id: r.invoice.id, invoiceNumber: r.invoice.invoiceNumber } : null,
    receivedByName: r.receivedByName,
  }))

  const firstRow = rows[0]
  let total = firstRow?.matchCount ?? 0
  let totalAmount = firstRow?.totalAmount ?? 0

  if (!firstRow && page > 1) {
    const totals = await getPaymentTotals(whereClause)
    total = totals.total
    totalAmount = totals.totalAmount
  }

  return {
    ...toPaginatedResult(items, total, page, limit),
    totalAmount,
  }
}

async function findPaymentEmailContext(client: DbClient, { shopId, repairId }: RepairScope) {
  const [context] = await client
    .select({
      ticketNumber: repairs.ticketNumber,
      trackingToken: repairs.trackingToken,
      customerName: customers.name,
      customerEmail: customers.email,
      shopName: shops.name,
    })
    .from(repairs)
    .innerJoin(customers, eq(customers.id, repairs.customerId))
    .innerJoin(shops, eq(shops.id, repairs.shopId))
    .where(and(eq(repairs.id, repairId), eq(repairs.shopId, shopId)))
  if (!context) throw new HTTPException(404, { message: PAYMENT_MESSAGES.repairNotFound })
  return context
}

export async function recordPayment({
  shopId,
  userId,
  repairId,
  amount: amountRupees,
  method,
  reference,
  note,
}: RecordPaymentInput & { shopId: string; userId: string }) {
  const { payment, customerEmail, email } = await db.transaction(async (tx) => {
    // Same row lock as finalizing the bill, so a payment and a new final total can't race.
    const repair = await findRepairForPayment(tx, { shopId, repairId, lock: true })
    if (repair.status === 'CANCELLED') {
      throw new HTTPException(409, { message: PAYMENT_MESSAGES.repairCancelled })
    }
    if (repair.finalTotal == null) {
      throw new HTTPException(400, { message: PAYMENT_MESSAGES.billNotFinalized })
    }

    const amount = rupeesToPaise(amountRupees)
    const [totalPaid, context] = await Promise.all([
      getTotalPaid({ client: tx, shopId, repairId }),
      findPaymentEmailContext(tx, { shopId, repairId }),
    ])
    const balance = repair.finalTotal - totalPaid

    if (balance <= 0) {
      throw new HTTPException(409, { message: PAYMENT_MESSAGES.exceedsBalance })
    }
    if (amount !== balance) {
      throw new HTTPException(400, { message: PAYMENT_MESSAGES.fullPaymentRequired })
    }
    if (method === 'UPI') {
      const cleanReference = reference?.trim()
      if (!cleanReference) {
        throw new HTTPException(400, { message: PAYMENT_MESSAGES.upiUtrRequired })
      }

      const [existing] = await tx
        .select({ id: payments.id })
        .from(payments)
        .where(
          and(
            eq(payments.shopId, shopId),
            eq(payments.method, 'UPI'),
            eq(payments.reference, cleanReference),
          ),
        )
        .limit(1)

      if (existing) {
        throw new HTTPException(409, { message: 'This UTR is already recorded' })
      }
    }

    const [payment] = await tx
      .insert(payments)
      .values({
        id: crypto.randomUUID(),
        shopId,
        repairId,
        customerId: repair.customerId,
        amount,
        method,
        reference: method === 'CASH' ? null : reference?.trim() || null,
        note: note || null,
        receivedBy: userId,
      })
      .returning({
        id: payments.id,
        amount: payments.amount,
        method: payments.method,
        reference: payments.reference,
        paidAt: payments.paidAt,
      })
    if (!payment) throw new HTTPException(500, { message: 'Failed to record payment.' })

    const email: PaymentReceivedEmailData = {
      shopName: context.shopName,
      customerName: context.customerName,
      ticketNumber: context.ticketNumber,
      payment,
      billTotal: repair.finalTotal,
      totalPaid: totalPaid + payment.amount,
      trackingToken: context.trackingToken,
    }
    return { payment, customerEmail: context.customerEmail, email }
  })

  queueShopEmail({
    shopId,
    repairId,
    type: 'PAYMENT_RECEIVED',
    to: customerEmail,
    dedupeKey: `PAYMENT_RECEIVED:${payment.id}`,
    email: () => buildPaymentReceivedEmail(email),
  })
  return { id: payment.id, amount: payment.amount }
}

export async function getPendingPayments(shopId: string) {
  const paymentsSubquery = db
    .select({
      repairId: payments.repairId,
      totalPaid: sql<number>`coalesce(sum(${payments.amount}), 0)`.mapWith(Number).as('total_paid'),
    })
    .from(payments)
    .where(eq(payments.shopId, shopId))
    .groupBy(payments.repairId)
    .as('payments_summary')

  const billTotalExpr = sql<number>`${repairs.finalTotal}`
  const totalPaidExpr = sql<number>`coalesce(${paymentsSubquery.totalPaid}, 0)`
  const balanceExpr = sql<number>`(${billTotalExpr} - ${totalPaidExpr})`

  const [rows, upi] = await Promise.all([
    db
      .select({
        repairId: repairs.id,
        ticketNumber: repairs.ticketNumber,
        status: repairs.status,
        billTotal: billTotalExpr.mapWith(Number),
        balance: balanceExpr.mapWith(Number),
        customer: {
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
        },
      })
      .from(repairs)
      .innerJoin(customers, eq(customers.id, repairs.customerId))
      .leftJoin(paymentsSubquery, eq(repairs.id, paymentsSubquery.repairId))
      .where(
        and(
          eq(repairs.shopId, shopId),
          ne(repairs.status, 'CANCELLED'),
          isNotNull(repairs.finalTotal),
          sql`${balanceExpr} > 0`,
        ),
      )
      .orderBy(desc(balanceExpr), desc(repairs.createdAt)),
    getShopUpi(shopId),
  ])

  const items = rows.map((r) => ({
    repairId: r.repairId,
    ticketNumber: r.ticketNumber,
    customer: r.customer,
    status: r.status,
    billTotal: r.billTotal,
    balance: r.balance,
  }))

  const totalOutstanding = items.reduce((acc, curr) => acc + curr.balance, 0)

  return {
    items,
    totalOutstanding,
    upi,
  }
}
