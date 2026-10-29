'use client'

import * as React from 'react'
import { AlertCircle, Check, ShieldAlert } from 'lucide-react'
import { useConfirmRepairModel } from '@/features/repairs/mutations'
import { confirmRepairModelSchema } from '@/features/repairs/schemas'
import type { RepairDevice } from '@/features/repairs/queries'
import { getApiErrorMessage } from '@/lib/api-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ModelConfirmationCardProps {
  repairId: string
  device: Pick<RepairDevice, 'brand' | 'model'>
  onConfirmed?: () => void
  onCancel?: () => void
}

export function ModelConfirmationCard({
  repairId,
  device,
  onConfirmed,
  onCancel,
}: ModelConfirmationCardProps) {
  const confirmMutation = useConfirmRepairModel(repairId)
  const [brand, setBrand] = React.useState(device.brand || '')
  const [model, setModel] = React.useState(device.model || '')
  const [error, setError] = React.useState<string | null>(null)

  const isPending = confirmMutation.isPending

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const parsed = confirmRepairModelSchema.safeParse({
      brand: brand.trim(),
      model: model.trim(),
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid model confirmation')
      return
    }

    try {
      await confirmMutation.mutateAsync(parsed.data)
      onConfirmed?.()
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to confirm device model'))
    }
  }

  return (
    <form onSubmit={(e) => void handleConfirm(e)} className="space-y-3.5">
      <div className="flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-500/5 px-3 py-2.5 dark:border-amber-800/40">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-[11px] leading-snug text-amber-900 dark:text-amber-200">
          Model is required. Confirm before parts or a customer estimate — wrong models risk wrong
          parts and repairs.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-2 text-xs font-medium text-destructive"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="card-brand" className="text-xs font-medium text-muted-foreground">
            Brand <span className="text-destructive">*</span>
          </label>
          <Input
            id="card-brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Apple"
            disabled={isPending}
            className="h-9 text-xs"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="card-model" className="text-xs font-medium text-muted-foreground">
            Model <span className="text-destructive">*</span>
          </label>
          <Input
            id="card-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. iPhone 14 Pro"
            disabled={isPending}
            className="h-9 text-xs"
            autoFocus
            autoComplete="off"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5">
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
            className="h-8 px-3 text-xs"
          >
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="accent"
          disabled={isPending}
          className="h-8 gap-1.5 px-3 text-xs"
        >
          <Check className="h-3.5 w-3.5" />
          {isPending ? 'Saving…' : 'Confirm model'}
        </Button>
      </div>
    </form>
  )
}
