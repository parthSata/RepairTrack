import { and, desc, eq, sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db, type DbClient } from '@/server/db'
import { payments } from '@/server/db/schema/payments'
import { repairs } from '@/server/db/schema/repairs'
import { users } from '@/server/db/schema/users'
import { PAYMENT_MESSAGES, type RecordPaymentInput } from '@/features/payments/schemas'
import { getBillTotal, getPaymentSummary } from '@/features/payments/summary'
import { rupeesToPaise } from '@/lib/money'
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
      type: payments.type,
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

export async function recordPayment({
  shopId,
  userId,
  repairId,
  amount: amountRupees,
  method,
  reference,
  note,
}: RecordPaymentInput & { shopId: string; userId: string }) {
  return db.transaction(async (tx) => {
    // Same row lock as finalizing the bill, so a payment and a new final total can't race.
    const repair = await findRepairForPayment(tx, { shopId, repairId, lock: true })
    if (repair.status === 'CANCELLED') {
      throw new HTTPException(409, { message: PAYMENT_MESSAGES.repairCancelled })
    }
    if (repair.finalTotal == null) {
      throw new HTTPException(400, { message: PAYMENT_MESSAGES.billNotFinalized })
    }

    const amount = rupeesToPaise(amountRupees)
    const totalPaid = await getTotalPaid({ client: tx, shopId, repairId })
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
        type: 'PAYMENT',
        reference: method === 'CASH' ? null : reference?.trim() || null,
        note: note || null,
        receivedBy: userId,
      })
      .returning({ id: payments.id, amount: payments.amount, type: payments.type })

    return payment
  })
}
