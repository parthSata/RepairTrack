import { z } from 'zod'

export const createInvoiceSchema = z.object({
  repairId: z.string().trim().min(1, { message: 'Repair is required' }),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>

export const CANCELLATION_REASON_MIN = 3
export const CANCELLATION_REASON_MAX = 500

export const cancelInvoiceSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(CANCELLATION_REASON_MIN, {
      message: `Enter a reason (at least ${CANCELLATION_REASON_MIN} characters)`,
    })
    .max(CANCELLATION_REASON_MAX, {
      message: `Reason cannot exceed ${CANCELLATION_REASON_MAX} characters`,
    }),
})

export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>

export type InvoiceStatus = 'ISSUED' | 'CANCELLED'

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  ISSUED: 'Issued',
  CANCELLED: 'Cancelled',
}

export const INVOICE_MESSAGES = {
  repairNotFound: 'Repair ticket not found',
  invoiceNotFound: 'Invoice not found',
  forbidden: 'Not authorized to manage invoices',
  finalBillRequired: 'Finalize the bill before generating an invoice.',
  alreadyExists: 'An invoice has already been issued for this repair.',
  alreadyCancelled: 'This invoice is already cancelled.',
  billOutOfDate:
    'Charges or parts changed after the bill was finalized. Finalize the bill again.',
} as const
