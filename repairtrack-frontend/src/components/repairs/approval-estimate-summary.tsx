import { ClipboardList } from 'lucide-react'
import { formatINR, formatINRFromPaise, storedCostToRupees } from '@/features/repairs/money'
import { cn } from '@/lib/utils'

type ApprovalEstimateBreakdownProps = {
  diagnosis: string
  initialEstimatePaise?: number
  additionalCostPaise?: number
  revisedTotalPaise?: number
  initialEstimateRupees?: number
  additionalCostRupees?: number
  revisedTotalRupees?: number
  variant?: 'default' | 'prominent'
  className?: string
}

function resolveRupees(paise?: number, rupees?: number): number | null {
  if (rupees != null) return rupees
  if (paise != null) return storedCostToRupees(paise)
  return null
}

function CostRow({
  label,
  amount,
  amountClassName,
  isTotal = false,
}: {
  label: string
  amount: string
  amountClassName?: string
  isTotal?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between min-[420px]:gap-4',
        isTotal && 'pt-0.5',
      )}
    >
      <span
        className={cn(
          'text-sm text-muted-foreground',
          isTotal && 'font-semibold text-foreground',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'shrink-0 font-medium text-foreground min-[420px]:text-right',
          amountClassName,
        )}
      >
        {amount}
      </span>
    </div>
  )
}

export function ApprovalEstimateBreakdown({
  diagnosis,
  initialEstimatePaise,
  additionalCostPaise,
  revisedTotalPaise,
  initialEstimateRupees,
  additionalCostRupees,
  revisedTotalRupees,
  variant = 'default',
  className,
}: ApprovalEstimateBreakdownProps) {
  const initial = resolveRupees(initialEstimatePaise, initialEstimateRupees)
  const additional = resolveRupees(additionalCostPaise, additionalCostRupees)
  const revisedFromParts =
    initial != null && additional != null ? initial + additional : null
  const revised =
    revisedFromParts ??
    resolveRupees(revisedTotalPaise, revisedTotalRupees)

  const isProminent = variant === 'prominent'

  return (
    <div
      className={cn(
        'rounded-xl border space-y-4',
        isProminent
          ? 'border-amber-400/60 bg-gradient-to-br from-amber-50 via-amber-50/80 to-orange-50/40 p-4 sm:p-5 shadow-[0_8px_24px_rgba(245,158,11,0.12)] dark:border-amber-700/50 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-orange-950/10'
          : 'border-amber-200/70 bg-amber-50/50 p-3 sm:p-4 dark:border-amber-900/40 dark:bg-amber-950/20',
        className,
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex shrink-0 items-center justify-center rounded-lg',
              isProminent
                ? 'h-10 w-10 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                : 'h-8 w-8 bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
            )}
          >
            <ClipboardList className={isProminent ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p
              className={cn(
                'font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200',
                isProminent ? 'text-xs' : 'text-[11px]',
              )}
            >
              Technician Diagnosis
            </p>
            <p
              className={cn(
                'leading-relaxed text-foreground whitespace-pre-wrap break-words',
                isProminent ? 'text-base' : 'text-sm',
              )}
            >
              {diagnosis}
            </p>
          </div>
        </div>
      ) : null}

        {initial != null && additional != null && revised != null ? (
          <div
            className={cn(
              'rounded-lg border border-amber-300/50 bg-white/70 dark:border-amber-800/50 dark:bg-background/40',
              isProminent ? 'p-3 sm:p-4' : 'p-3',
            )}
          >
            <div className="space-y-2.5 text-sm">
              <CostRow label="Original Estimate" amount={formatINR(initial)} />
              <CostRow label="Additional Repair Cost" amount={`+ ${formatINR(additional)}`} />
              <div className="border-t border-amber-200/80 pt-2.5 dark:border-amber-800/50 space-y-1">
                <CostRow
                  label="Revised Estimated Total"
                  amount={formatINR(revised)}
                  isTotal
                  amountClassName={cn(
                    'font-bold text-amber-950 dark:text-amber-100 text-lg sm:text-xl',
                    isProminent && 'text-xl sm:text-2xl tracking-tight',
                  )}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Amounts in Indian Rupees (₹)</p>
          </div>
        </dl>
      </div>
    </div>
  )
}

/** @deprecated Use ApprovalEstimateBreakdown */
export function ApprovalEstimateSummary({
  diagnosis,
  estimatedCostPaise,
  estimatedCostRupees,
  variant = 'default',
  className,
}: {
  diagnosis: string
  estimatedCostPaise?: number
  estimatedCostRupees?: number
  variant?: 'default' | 'prominent'
  className?: string
}) {
  const revised =
    estimatedCostRupees ?? (estimatedCostPaise != null ? storedCostToRupees(estimatedCostPaise) : null)

  return (
    <ApprovalEstimateBreakdown
      diagnosis={diagnosis}
      initialEstimateRupees={revised ?? 0}
      additionalCostRupees={0}
      revisedTotalRupees={revised ?? 0}
      variant={variant}
      className={className}
    />
  )
}

export function formatBreakdownFromPaise({
  initialEstimatePaise,
  additionalCostPaise,
  revisedTotalPaise,
}: {
  initialEstimatePaise: number
  additionalCostPaise: number
  revisedTotalPaise: number
}) {
  return {
    initialLabel: formatINRFromPaise(initialEstimatePaise),
    additionalLabel: formatINRFromPaise(additionalCostPaise),
    revisedLabel: formatINRFromPaise(revisedTotalPaise),
  }
}
