import { z } from 'zod'

export const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank transfer',
}

export const REFERENCE_PLACEHOLDERS: Record<PaymentMethod, string> = {
  CASH: '',
  UPI: 'UPI transaction ID',
  CARD: 'Last 4 card digits',
  BANK_TRANSFER: 'Bank reference',
}

/** ₹1 crore keeps the paise value well inside a Postgres integer. */
const MAX_PAYMENT_RUPEES = 10_000_000

const hasAtMostTwoDecimals = (value: number) =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-6

export const recordPaymentSchema = z.object({
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

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>

export const PAYMENT_MESSAGES = {
  forbidden: 'Not authorized to record payments',
  repairNotFound: 'Repair ticket not found',
  repairCancelled: 'Cannot record a payment on a cancelled repair.',
  exceedsBalance: 'Amount is more than the balance due',
  finalBelowPaid: 'Final total cannot be less than the amount already paid.',
} as const
