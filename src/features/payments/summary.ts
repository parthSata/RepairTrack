export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID'

export interface PaymentSummary {
  totalPaid: number
  /** Negative when the customer has overpaid. */
  balance: number
  status: PaymentStatus
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
