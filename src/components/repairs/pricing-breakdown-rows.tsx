import { formatRupees } from '@/lib/format-money'
import type { CalculateRepairTotalResult } from '@/features/repairs/pricing-calc'

function PricingRow({
  label,
  valuePaise,
  emphasize,
}: {
  label: string
  valuePaise: number
  emphasize?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={emphasize ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
      <span
        className={emphasize ? 'text-base font-bold text-foreground' : 'font-medium text-foreground'}
      >
        {formatRupees(valuePaise)}
      </span>
    </div>
  )
}

type PricingBreakdownRowsProps = {
  laborCharges: number
  partsCharges: number
  additionalCharges: number
  taxPercent: number
  totals: CalculateRepairTotalResult | null
  totalLabel: string
  emptyMessage?: string
}

export function PricingBreakdownRows({
  laborCharges,
  partsCharges,
  additionalCharges,
  taxPercent,
  totals,
  totalLabel,
  emptyMessage = 'Total not available.',
}: PricingBreakdownRowsProps) {
  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-muted/15 px-3.5 py-3">
      <PricingRow label="Labor charges" valuePaise={laborCharges} />
      <PricingRow label="Parts charges" valuePaise={partsCharges} />
      <PricingRow label="Additional charges" valuePaise={additionalCharges} />
      {totals ? (
        <>
          <PricingRow label="Taxable value" valuePaise={totals.taxableValue} />
          <PricingRow label={`Tax (${taxPercent}%)`} valuePaise={totals.taxAmount} />
          <div className="border-t border-border/70 pt-2">
            <PricingRow label={totalLabel} valuePaise={totals.total} emphasize />
          </div>
        </>
      ) : (
        <p className="text-sm italic text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  )
}
