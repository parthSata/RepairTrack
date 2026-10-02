import { z } from 'zod'

export const PAYMENT_METHODS = ['CASH', 'UPI'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod | 'CARD' | 'BANK_TRANSFER', string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank transfer',
}

export const REFERENCE_PLACEHOLDERS: Record<PaymentMethod, string> = {
  CASH: '',
  UPI: '12-digit UTR number',
}

export const UPI_UTR_REGEX = /^\d{12}$/

/** ₹1 crore keeps the paise value well inside a Postgres integer. */
const MAX_PAYMENT_RUPEES = 10_000_000

const hasAtMostTwoDecimals = (value: number) =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-6

export const recordPaymentSchema = z
  .object({
    repairId: z.string().trim().min(1, { message: 'Repair is required' }),
    amount: z.coerce
      .number({ message: 'Enter an amount' })
      .positive({ message: 'Amount must be more than 0' })
      .max(MAX_PAYMENT_RUPEES, { message: 'Amount is too large' })
      .refine(hasAtMostTwoDecimals, { message: 'Amount can have at most 2 decimals' }),
    method: z.enum(PAYMENT_METHODS, { message: 'Select a payment method' }),
    reference: z.string().trim().max(100, { message: 'Reference cannot exceed 100 characters' }).optional(),
    note: z.string().trim().max(500, { message: 'Note cannot exceed 500 characters' }).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === 'UPI') {
      const ref = data.reference?.trim()
      if (!ref || !UPI_UTR_REGEX.test(ref)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reference'],
          message: 'Enter the 12-digit UTR from your bank app',
        })
      }
    }
  })

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>

export const repairPaymentsQuerySchema = z.object({
  repairId: z.string().trim().min(1, { message: 'Repair is required' }).max(100, { message: 'Invalid repair id' }),
})

export const PAYMENT_FILTER_METHODS = PAYMENT_METHODS
export type PaymentFilterMethod = (typeof PAYMENT_FILTER_METHODS)[number]

export const paymentFilterSchema = z
  .object({
    repairId: z.string().trim().max(100).optional(),
    search: z.string().trim().max(100).optional(),
    method: z.enum(PAYMENT_FILTER_METHODS).optional(),
    startDate: z.string().trim().max(30).optional(),
    endDate: z.string().trim().max(30).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })

export type PaymentFilterInput = z.infer<typeof paymentFilterSchema>

export type PaymentType = 'ADVANCE' | 'PAYMENT'

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  ADVANCE: 'Advance',
  PAYMENT: 'Payment',
}

export const PAYMENT_STATUS_LABELS = {
  UNPAID: 'Unpaid',
  PARTIAL: 'Partial',
  PAID: 'Paid',
} as const

export const PAYMENT_MESSAGES = {
  forbidden: 'Not authorized to record payments',
  repairNotFound: 'Repair ticket not found',
  repairCancelled: 'Cannot record a payment on a cancelled repair.',
  billNotFinalized: 'Bill must be finalized before recording payment.',
  fullPaymentRequired: 'Only full payment of the remaining balance is allowed.',
  exceedsBalance: 'Amount is more than the balance due',
  upiReferenceRequired: 'Enter the 12-digit UTR from your bank app',
  upiUtrRequired: 'Enter the 12-digit UTR from your bank app',
  utrDuplicate: 'This UTR is already recorded',
  finalBelowPaid: 'Final total cannot be less than the amount already paid.',
} as const
