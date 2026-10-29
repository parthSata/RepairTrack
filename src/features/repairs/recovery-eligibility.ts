import type { RepairInvoiceSummary } from '@/features/repairs/queries'

export type RecoveryCase = 'A' | 'B' | 'C'

/** Case A: no Issued invoice. B: Issued unpaid. C: Issued with any lifetime payments. */
export function getRecoveryCase({
  issuedInvoice,
  lifetimeTotalPaid,
}: {
  issuedInvoice: RepairInvoiceSummary | null | undefined
  lifetimeTotalPaid: number
}): RecoveryCase {
  if (!issuedInvoice) return 'A'
  if (lifetimeTotalPaid > 0) return 'C'
  return 'B'
}
