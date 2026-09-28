import { eq, sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import type { TxClient } from '@/server/db'
import { invoices } from '@/server/db/schema/invoices'
import { shops } from '@/server/db/schema/users'

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
