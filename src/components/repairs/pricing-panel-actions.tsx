'use client'

import { IndianRupee, LockOpen, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PricingPanelActionsProps = {
  mode: 'editEstimate' | 'finalize'
  isUnlocked: boolean
  isFinalized: boolean
  isPending: boolean
  canSubmit: boolean
  onUnlock: () => void
  onCancel: () => void
}

/** Footer buttons for the pricing panel. Submit buttons post the surrounding form. */
export function PricingPanelActions({
  mode,
  isUnlocked,
  isFinalized,
  isPending,
  canSubmit,
  onUnlock,
  onCancel,
}: PricingPanelActionsProps) {
  if (mode === 'editEstimate') {
    return (
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending || !canSubmit} className="gap-1.5">
          <IndianRupee className="h-3.5 w-3.5" aria-hidden />
          {isPending ? 'Saving…' : 'Save estimate'}
        </Button>
      </div>
    )
  }

  const finalizeLabel = isFinalized ? 'Update final bill' : 'Finalize Bill'
  const showFinalize = isUnlocked || !isFinalized

  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {isUnlocked ? (
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onUnlock}
          disabled={isPending}
          className="gap-1.5"
        >
          <LockOpen className="h-3.5 w-3.5" aria-hidden />
          Unlock to edit
        </Button>
      )}
      {showFinalize ? (
        <Button type="submit" size="sm" disabled={isPending || !canSubmit} className="gap-1.5">
          <Receipt className="h-3.5 w-3.5" aria-hidden />
          {isPending ? 'Finalizing…' : finalizeLabel}
        </Button>
      ) : null}
    </div>
  )
}
