import { formatRupees } from '@/lib/format-money'
import { revisedEstimatedTotalPaise } from '@/features/repairs/money'
import { cn } from '@/lib/utils'

type ApprovalEstimateBreakdownProps = {
  diagnosis?: string | null
  originalEstimatedCostPaise: number | null
  additionalEstimatedCostPaise: number | null
  /** Hide diagnosis when the parent already shows it (e.g. Repair Details). */
  showDiagnosis?: boolean
  className?: string
}

export function ApprovalEstimateBreakdown({
  diagnosis,
  originalEstimatedCostPaise,
  additionalEstimatedCostPaise,
  showDiagnosis = true,
  className,
}: ApprovalEstimateBreakdownProps) {
  const original = originalEstimatedCostPaise
  const additional = additionalEstimatedCostPaise
  const showOriginal = original != null && original !== 0
  const showAdditional = additional != null && additional !== 0
  const revised = revisedEstimatedTotalPaise(original, additional)
  const diagnosisText = diagnosis?.trim()

  return (
    <div className={cn('space-y-3', className)}>
      {showDiagnosis && diagnosisText ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Technician Diagnosis
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {diagnosisText}
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          'rounded-lg border border-border bg-muted/30',
          showDiagnosis && diagnosisText ? 'mt-1' : undefined,
        )}
      >
        <dl className="divide-y divide-border">
          {showOriginal && original != null ? (
            <div className="flex items-baseline justify-between gap-4 px-3.5 py-2.5 text-sm">
              <dt className="text-muted-foreground">Original Estimate</dt>
              <dd className="tabular-nums font-medium text-foreground">
                {formatRupees(original)}
              </dd>
            </div>
          ) : null}

          {showAdditional && additional != null ? (
            <div className="flex items-baseline justify-between gap-4 px-3.5 py-2.5 text-sm">
              <dt className="text-muted-foreground">Additional Repair Cost</dt>
              <dd className="tabular-nums font-medium text-foreground">
                {showOriginal ? `+ ${formatRupees(additional)}` : formatRupees(additional)}
              </dd>
            </div>
          ) : null}

          <div className="flex items-baseline justify-between gap-4 px-3.5 py-3">
            <dt className="text-sm font-semibold text-foreground">Revised Estimated Total</dt>
            <dd className="text-lg font-bold tabular-nums tracking-tight text-foreground">
              {formatRupees(revised)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
