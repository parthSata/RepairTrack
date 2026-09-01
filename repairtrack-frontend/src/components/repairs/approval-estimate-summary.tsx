import { ClipboardList, IndianRupee } from 'lucide-react'
import { formatINR, formatINRFromPaise } from '@/features/repairs/money'
import { cn } from '@/lib/utils'

type ApprovalEstimateSummaryProps = {
  diagnosis: string
  /** Cost in paise (internal dashboard). */
  estimatedCostPaise?: number
  /** Cost in rupees (public tracking API). */
  estimatedCostRupees?: number
  variant?: 'default' | 'prominent'
  className?: string
}

export function ApprovalEstimateSummary({
  diagnosis,
  estimatedCostPaise,
  estimatedCostRupees,
  variant = 'default',
  className,
}: ApprovalEstimateSummaryProps) {
  const costLabel =
    estimatedCostRupees != null
      ? formatINR(estimatedCostRupees)
      : estimatedCostPaise != null
        ? formatINRFromPaise(estimatedCostPaise)
        : null

  const isProminent = variant === 'prominent'

  return (
    <div
      className={cn(
        'rounded-xl border space-y-4',
        isProminent
          ? 'border-amber-400/60 bg-gradient-to-br from-amber-50 via-amber-50/80 to-orange-50/40 p-5 shadow-[0_8px_24px_rgba(245,158,11,0.12)] dark:border-amber-700/50 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-orange-950/10'
          : 'border-amber-200/70 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20',
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
                'leading-relaxed text-foreground whitespace-pre-wrap',
                isProminent ? 'text-base' : 'text-sm',
              )}
            >
              {diagnosis}
            </p>
          </div>
        </div>

        {costLabel ? (
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg border border-amber-300/50 bg-white/70 px-4 dark:border-amber-800/50 dark:bg-background/40',
              isProminent ? 'py-4' : 'py-3',
            )}
          >
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full bg-amber-500 text-white',
                isProminent ? 'h-11 w-11' : 'h-9 w-9',
              )}
            >
              <IndianRupee className={isProminent ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Estimated repair cost
              </p>
              <p
                className={cn(
                  'font-bold text-amber-950 dark:text-amber-100',
                  isProminent ? 'text-2xl sm:text-3xl tracking-tight' : 'text-xl',
                )}
              >
                {costLabel}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Amount in Indian Rupees (₹)</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
