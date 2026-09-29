import { AmountRow } from '@/components/repairs/pricing-breakdown-rows'
import type { Invoice } from '@/features/invoices/queries'

type InvoiceAmounts = Pick<
  Invoice,
  'laborCharges' | 'partsCharges' | 'additionalCharges' | 'taxPercent' | 'taxAmount' | 'total'
>

/** Renders the amounts stored on the invoice; never recalculates, so the bill matches what was issued. */
export function InvoiceSummary({ invoice }: { invoice: InvoiceAmounts }) {
  return (
    <div className="space-y-2">
      <AmountRow label="Labor" valuePaise={invoice.laborCharges} />
      <AmountRow label="Parts" valuePaise={invoice.partsCharges} />
      <AmountRow label="Additional" valuePaise={invoice.additionalCharges} />
      <AmountRow label={`Tax (${invoice.taxPercent}%)`} valuePaise={invoice.taxAmount} />
      <div className="border-t border-border pt-2">
        <AmountRow label="Total" valuePaise={invoice.total} emphasize />
      </div>
    </div>
  )
}
