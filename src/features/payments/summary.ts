export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID'

export interface PaymentSummary {
  totalPaid: number
  /** Negative when the customer has overpaid. */
  balance: number
  status: PaymentStatus
}

/** The confirmed bill wins; before finalizing, the estimate is the bill. Null = nothing to bill yet. */
export function getBillTotal({
  finalTotal,
  estimatedTotal,
}: {
  finalTotal: number | null
  estimatedTotal: number | null
}): number | null {
  return finalTotal ?? estimatedTotal ?? null
}

/** A null bill total has no cap (advance before any estimate). */
export function exceedsBill({
  billTotal,
  totalPaid,
  amount,
}: {
  billTotal: number | null
  totalPaid: number
  amount: number
}): boolean {
  return billTotal != null && totalPaid + amount > billTotal
}

/** All amounts are integer paise. */
export function getPaymentSummary({
  billTotal,
  payments,
}: {
  billTotal: number
  payments: { amount: number }[]
}): PaymentSummary {
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const balance = billTotal - totalPaid
  const status: PaymentStatus =
    totalPaid <= 0 ? 'UNPAID' : totalPaid >= billTotal ? 'PAID' : 'PARTIAL'

  return { totalPaid, balance, status }
}
