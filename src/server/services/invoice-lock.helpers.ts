import { and, eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db, type DbClient } from '@/server/db'
import { invoices } from '@/server/db/schema/invoices'
import { PRICING_MESSAGES } from '@/features/repairs/pricing-rules'

export async function hasIssuedInvoice({
  client = db,
  shopId,
  repairId,
}: {
  client?: DbClient
  shopId: string
  repairId: string
}): Promise<boolean> {
  const [row] = await client
    .select({ id: invoices.id })
    .from(invoices)
    .where(
      and(
        eq(invoices.shopId, shopId),
        eq(invoices.repairId, repairId),
        eq(invoices.status, 'ISSUED'),
      ),
    )
    .limit(1)
  return Boolean(row)
}

/** Charges and parts are frozen while an issued invoice exists; cancel the invoice to change them. */
export async function assertNoIssuedInvoice(params: {
  client?: DbClient
  shopId: string
  repairId: string
}): Promise<void> {
  if (await hasIssuedInvoice(params)) {
    throw new HTTPException(409, { message: PRICING_MESSAGES.invoiceIssued })
  }
}
