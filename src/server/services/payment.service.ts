import { and, eq, sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db, type DbClient } from '@/server/db'
import { payments } from '@/server/db/schema/payments'
import { repairs } from '@/server/db/schema/repairs'
import { PAYMENT_MESSAGES, type RecordPaymentInput } from '@/features/payments/schemas'
import { exceedsBill, getBillTotal } from '@/features/payments/summary'
import { rupeesToPaise } from '@/lib/money'

export async function getTotalPaid({
  client = db,
  shopId,
  repairId,
}: {
  client?: DbClient
  shopId: string
  repairId: string
}): Promise<number> {
  const [row] = await client
    .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(and(eq(payments.shopId, shopId), eq(payments.repairId, repairId)))
  // Postgres returns sum() as bigint, which the driver hands back as a string.
  return Number(row?.total ?? 0)
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
    const [repair] = await tx
      .select({
        customerId: repairs.customerId,
        status: repairs.status,
        finalTotal: repairs.finalTotal,
        estimatedTotal: repairs.estimatedTotal,
      })
      .from(repairs)
      .where(and(eq(repairs.id, repairId), eq(repairs.shopId, shopId)))
      .for('update')

    if (!repair) throw new HTTPException(404, { message: PAYMENT_MESSAGES.repairNotFound })
    if (repair.status === 'CANCELLED') {
      throw new HTTPException(409, { message: PAYMENT_MESSAGES.repairCancelled })
    }

    const amount = rupeesToPaise(amountRupees)
    const totalPaid = await getTotalPaid({ client: tx, shopId, repairId })
    if (exceedsBill({ billTotal: getBillTotal(repair), totalPaid, amount })) {
      throw new HTTPException(409, { message: PAYMENT_MESSAGES.exceedsBalance })
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
        type: repair.finalTotal == null ? 'ADVANCE' : 'PAYMENT',
        reference: method === 'CASH' ? null : reference || null,
        note: note || null,
        receivedBy: userId,
      })
      .returning({ id: payments.id, amount: payments.amount, type: payments.type })

    return payment
  })
}
