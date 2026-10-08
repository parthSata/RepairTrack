import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db } from '@/server/db'
import { emailLogs, repairApprovals, repairs, type EmailType } from '@/server/db/schema'
import {
  REPAIR_EMAIL_MESSAGES,
  REPAIR_EMAIL_TYPES,
  type RepairEmailLog,
  type RepairEmailType,
  type ResendEmailResult,
} from '@/features/emails/schemas'
import { buildApprovalRequiredEmail } from '@/server/email/templates/approval-required'
import { buildInvoiceGeneratedEmail } from '@/server/email/templates/invoice-generated'
import { buildPaymentReceivedEmail } from '@/server/email/templates/payment-received'
import { buildRepairReceivedEmail } from '@/server/email/templates/repair-received'
import {
  getEmailOutcomeReason,
  isAlreadySent,
  sendAndLogShopEmail,
  type ShopEmailInput,
} from '@/server/services/email.service'
import { getInvoiceById } from '@/server/services/invoice.service'
import { getTotalPaid, listRepairPayments } from '@/server/services/payment.service'
import {
  buildStatusEmail,
  findRepairEmailContext,
  repairEmailBase,
  resolveRepairPricingTotal,
  type RepairEmailContext,
  type StatusEmailType,
} from '@/server/services/repair.service'

type RepairScope = { shopId: string; repairId: string }
type RebuildContext = RepairScope & { entityId: string; repair: RepairEmailContext }
type RebuiltEmail = { to: string | null; email: ShopEmailInput['email'] }

const repairEmailTypes = new Set<string>(REPAIR_EMAIL_TYPES satisfies readonly EmailType[])

function isRepairEmailType(type: string): type is RepairEmailType {
  return repairEmailTypes.has(type)
}

function fail(status: 404 | 409, message: string): never {
  throw new HTTPException(status, { message })
}

/** `error` is stored as `<reason>: <message>`; only the reason code leaves the server. */
function toLogReason(row: { status: string; skipReason: string | null; error: string | null }) {
  if (row.status === 'SKIPPED') return row.skipReason
  if (row.status === 'FAILED') return row.error?.split(':', 1)[0] ?? null
  return null
}

export async function listRepairEmails({ shopId, repairId }: RepairScope): Promise<RepairEmailLog[]> {
  const [[repair], rows] = await Promise.all([
    db
      .select({ id: repairs.id })
      .from(repairs)
      .where(and(eq(repairs.id, repairId), eq(repairs.shopId, shopId))),
    db
      .select({
        id: emailLogs.id,
        type: emailLogs.type,
        recipient: emailLogs.recipient,
        status: emailLogs.status,
        skipReason: emailLogs.skipReason,
        error: emailLogs.error,
        dedupeKey: emailLogs.dedupeKey,
        createdAt: emailLogs.createdAt,
      })
      .from(emailLogs)
      .where(and(eq(emailLogs.shopId, shopId), eq(emailLogs.repairId, repairId)))
      .orderBy(desc(emailLogs.createdAt)),
  ])
  if (!repair) fail(404, REPAIR_EMAIL_MESSAGES.repairNotFound)

  const sentKeys = new Set(rows.filter((row) => row.status === 'SENT').map((row) => row.dedupeKey))
  return rows.flatMap((row) =>
    isRepairEmailType(row.type)
      ? [
          {
            id: row.id,
            type: row.type,
            recipient: row.recipient,
            status: row.status,
            reason: toLogReason(row),
            createdAt: row.createdAt.toISOString(),
            canResend: row.status !== 'SENT' && row.dedupeKey != null && !sentKeys.has(row.dedupeKey),
          },
        ]
      : [],
  )
}

function rebuildStatusEmail(type: StatusEmailType) {
  return async ({ shopId, repairId, repair }: RebuildContext): Promise<RebuiltEmail> => ({
    to: repair.customerEmail,
    email: buildStatusEmail(type, repair, await getTotalPaid({ shopId, repairId })),
  })
}

async function rebuildApprovalRequired({ shopId, repairId, entityId, repair }: RebuildContext): Promise<RebuiltEmail> {
  const [approval] = await db
    .select({ status: repairApprovals.status, diagnosis: repairApprovals.diagnosisSnapshot })
    .from(repairApprovals)
    .where(and(eq(repairApprovals.id, entityId), eq(repairApprovals.repairId, repairId)))
  if (!approval) fail(404, REPAIR_EMAIL_MESSAGES.approvalNotFound)
  if (approval.status !== 'PENDING') fail(409, REPAIR_EMAIL_MESSAGES.approvalNotPending)

  const { laborCharges, additionalCharges, taxPercent } = repair
  const { partsCharges, taxAmount, total } = await resolveRepairPricingTotal({
    shopId,
    repairId,
    laborCharges,
    additionalCharges,
    taxPercent,
  })
  return {
    to: repair.customerEmail,
    email: buildApprovalRequiredEmail({
      ...repairEmailBase(repair),
      diagnosis: approval.diagnosis,
      charges: { laborCharges, partsCharges, additionalCharges, taxPercent, taxAmount, total },
    }),
  }
}

async function rebuildInvoiceGenerated({ shopId, repairId, entityId, repair }: RebuildContext): Promise<RebuiltEmail> {
  const [invoice, totalPaid] = await Promise.all([
    getInvoiceById({ shopId, id: entityId }),
    getTotalPaid({ shopId, repairId }),
  ])
  if (invoice.repairId !== repairId) fail(404, REPAIR_EMAIL_MESSAGES.invoiceNotFound)
  if (invoice.status === 'CANCELLED') fail(409, REPAIR_EMAIL_MESSAGES.invoiceCancelled)

  return {
    to: repair.customerEmail,
    email: buildInvoiceGeneratedEmail({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.createdAt,
      ticketNumber: invoice.ticketNumber,
      shop: { name: repair.shopName, address: repair.shopAddress, phone: repair.shopPhone, email: repair.shopEmail },
      customer: invoice.customer,
      device: invoice.device,
      items: invoice.items,
      charges: {
        laborCharges: invoice.laborCharges,
        partsCharges: invoice.partsCharges,
        additionalCharges: invoice.additionalCharges,
        taxPercent: invoice.taxPercent,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
      },
      totalPaid,
      trackingToken: repair.trackingToken,
    }),
  }
}

async function rebuildPaymentReceived({ shopId, repairId, entityId, repair }: RebuildContext): Promise<RebuiltEmail> {
  const { payments, billTotal, totalPaid } = await listRepairPayments({ shopId, repairId })
  const payment = payments.find((row) => row.id === entityId)
  if (!payment) fail(404, REPAIR_EMAIL_MESSAGES.paymentNotFound)

  const { shopName, customerName, ticketNumber, trackingToken } = repairEmailBase(repair)
  return {
    to: repair.customerEmail,
    email: buildPaymentReceivedEmail({
      shopName,
      customerName,
      ticketNumber,
      payment,
      billTotal: billTotal ?? totalPaid,
      totalPaid,
      trackingToken,
    }),
  }
}

/** Rebuilds each email type from current data with the same template its trigger uses. */
const REPAIR_EMAIL_REBUILDERS: Record<RepairEmailType, (context: RebuildContext) => Promise<RebuiltEmail>> = {
  REPAIR_RECEIVED: async ({ repair }) => ({
    to: repair.customerEmail,
    email: buildRepairReceivedEmail({
      ...repairEmailBase(repair),
      problemDescription: repair.problemDescription,
      expectedCompletionDate: repair.expectedCompletionDate,
    }),
  }),
  APPROVAL_REQUIRED: rebuildApprovalRequired,
  REPAIR_STARTED: rebuildStatusEmail('REPAIR_STARTED'),
  READY_FOR_PICKUP: rebuildStatusEmail('READY_FOR_PICKUP'),
  REPAIR_COMPLETED: rebuildStatusEmail('REPAIR_COMPLETED'),
  INVOICE_GENERATED: rebuildInvoiceGenerated,
  PAYMENT_RECEIVED: rebuildPaymentReceived,
}

/**
 * Resends a FAILED or SKIPPED repair email. The attempt is logged as a new row under the same
 * dedupe key, so once any attempt is SENT every older row for that email returns 409.
 */
export async function resendRepairEmail({
  shopId,
  repairId,
  logId,
}: RepairScope & { logId: string }): Promise<ResendEmailResult> {
  const [log] = await db
    .select({ type: emailLogs.type, status: emailLogs.status, dedupeKey: emailLogs.dedupeKey })
    .from(emailLogs)
    .where(and(eq(emailLogs.id, logId), eq(emailLogs.shopId, shopId), eq(emailLogs.repairId, repairId)))
  if (!log) fail(404, REPAIR_EMAIL_MESSAGES.emailNotFound)
  if (log.status === 'SENT') fail(409, REPAIR_EMAIL_MESSAGES.alreadySent)

  const { type, dedupeKey } = log
  const keyPrefix = `${type}:`
  if (!isRepairEmailType(type) || !dedupeKey?.startsWith(keyPrefix)) {
    fail(409, REPAIR_EMAIL_MESSAGES.notResendable)
  }

  const [alreadySent, repair] = await Promise.all([
    isAlreadySent(shopId, dedupeKey),
    findRepairEmailContext(shopId, repairId),
  ])
  if (alreadySent) fail(409, REPAIR_EMAIL_MESSAGES.alreadySent)
  if (!repair) fail(404, REPAIR_EMAIL_MESSAGES.repairNotFound)

  const { to, email } = await REPAIR_EMAIL_REBUILDERS[type]({
    shopId,
    repairId,
    entityId: dedupeKey.slice(keyPrefix.length),
    repair,
  })
  const outcome = await sendAndLogShopEmail({ shopId, repairId, type, to, email, dedupeKey })
  return { status: outcome.status, reason: getEmailOutcomeReason(outcome), recipient: to?.trim() || null }
}
