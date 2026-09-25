'use client'

import * as React from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Package, Tag, Warehouse, Truck } from 'lucide-react'
import {
  adjustStockSchema,
  MANUAL_STOCK_IN_REASONS,
  MANUAL_STOCK_OUT_REASONS,
  partDetailsSchema,
  STOCK_REASON_LABELS,
  type AdjustStockInput,
  type PartDetailsInput,
} from '@/features/inventory/schemas'
import { useAdjustStock, useCreatePart, useUpdatePart } from '@/features/inventory/mutations'
import type { Part } from '@/features/inventory/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field-error'
import { PaisePriceField } from '@/components/ui/paise-price-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'

type ManageTab = 'details' | 'stock'

interface PartFormProps {
  mode: 'create' | 'edit'
  partId?: string
  initialData?: Partial<PartDetailsInput> & { quantity?: number }
  initialTab?: ManageTab
  onSuccess: (part?: Part) => void
  onCancel?: () => void
  onPendingChange?: (pending: boolean) => void
  /** Called when stock adjust succeeds so parent can refresh displayed quantity. */
  onStockAdjusted?: (part: Part) => void
}

export function PartForm({
  mode,
  partId,
  initialData,
  initialTab = 'details',
  onSuccess,
  onCancel,
  onPendingChange,
  onStockAdjusted,
}: PartFormProps) {
  const [tab, setTab] = React.useState<ManageTab>(mode === 'create' ? 'details' : initialTab)
  const [quantityOverride, setQuantityOverride] = React.useState<number | null>(null)
  const currentQuantity = quantityOverride ?? initialData?.quantity ?? 0

  const createMutation = useCreatePart()
  const updateMutation = useUpdatePart()
  const adjustMutation = useAdjustStock(partId ?? '')

  const detailsPending = createMutation.isPending || updateMutation.isPending
  const stockPending = adjustMutation.isPending
  const isPending = detailsPending || stockPending

  React.useEffect(() => {
    onPendingChange?.(isPending)
  }, [isPending, onPendingChange])

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<PartDetailsInput>({
    resolver: zodResolver(partDetailsSchema) as Resolver<PartDetailsInput>,
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: initialData?.name ?? '',
      sku: initialData?.sku ?? '',
      stockAlert: initialData?.stockAlert ?? 0,
      purchasePrice: initialData?.purchasePrice ?? 0,
      sellingPrice: initialData?.sellingPrice ?? 0,
      supplier: initialData?.supplier ?? '',
    },
  })
  const [direction, setDirection] = React.useState<'IN' | 'OUT'>('IN')
  const [adjustQty, setAdjustQty] = React.useState('1')
  const [reason, setReason] = React.useState<AdjustStockInput['reason']>('PURCHASE')
  const [stockError, setStockError] = React.useState<string | null>(null)

  const reasonOptions = direction === 'IN' ? MANUAL_STOCK_IN_REASONS : MANUAL_STOCK_OUT_REASONS
  const resolvedReason = (reasonOptions as readonly string[]).includes(reason)
    ? reason
    : reasonOptions[0]

  const handleDirectionChange = (next: 'IN' | 'OUT') => {
    setDirection(next)
    const options = next === 'IN' ? MANUAL_STOCK_IN_REASONS : MANUAL_STOCK_OUT_REASONS
    setReason(options[0])
  }

  const parsedAdjustQty = Number.parseInt(adjustQty, 10)
  const validAdjustQty = Number.isFinite(parsedAdjustQty) && parsedAdjustQty > 0 ? parsedAdjustQty : 0
  const previewQuantity =
    direction === 'IN' ? currentQuantity + validAdjustQty : currentQuantity - validAdjustQty

  const onSubmitDetails = async (values: PartDetailsInput) => {
    const payload: PartDetailsInput = {
      ...values,
      supplier: values.supplier?.trim() ? values.supplier.trim() : null,
    }

    try {
      if (mode === 'create') {
        const saved = await createMutation.mutateAsync(payload)
        toast.success('Part added')
        onSuccess(saved)
        return
      }

      if (!partId) {
        toast.error('Missing part id. Please try again.')
        return
      }

      const saved = await updateMutation.mutateAsync({ id: partId, data: payload })
      toast.success('Part updated')
      onSuccess(saved)
    } catch (err: unknown) {
      const fallback =
        mode === 'create'
          ? 'Failed to add part. Please try again.'
          : 'Failed to update part. Please try again.'
      const message = getApiErrorMessage(err, fallback)

      if (/sku/i.test(message)) {
        setError('sku', { type: 'manual', message })
      }

      toast.error(message, { duration: 5000 })
    }
  }

  const onSubmitStock = async (e: React.FormEvent) => {
    e.preventDefault()
    setStockError(null)

    if (!partId) {
      toast.error('Missing part id. Please try again.')
      return
    }

    const parsed = adjustStockSchema.safeParse({
      direction,
      quantity: adjustQty,
      reason: resolvedReason,
    })

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Invalid stock adjustment'
      setStockError(msg)
      return
    }

    if (parsed.data.direction === 'OUT' && parsed.data.quantity > currentQuantity) {
      const msg = `Insufficient stock. Current quantity is ${currentQuantity}.`
      setStockError(msg)
      toast.error(msg)
      return
    }

    try {
      const updated = await adjustMutation.mutateAsync(parsed.data)
      setQuantityOverride(updated.quantity)
      onStockAdjusted?.(updated)
      toast.success(parsed.data.direction === 'IN' ? 'Stock added' : 'Stock removed')
      setAdjustQty('1')
      onSuccess(updated)
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Failed to adjust stock')
      setStockError(message)
      toast.error(message)
    }
  }

  return (
    <div className="space-y-4 pt-2">
      {mode === 'edit' ? (
        <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === 'details'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setTab('details')}
            disabled={isPending}
          >
            Details
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === 'stock'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setTab('stock')}
            disabled={isPending}
          >
            Stock
          </button>
        </div>
      ) : null}

      {tab === 'details' || mode === 'create' ? (
        <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-muted-foreground" />
              Part name <span className="font-bold text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. iPhone 13 LCD"
              disabled={detailsPending}
              className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
              {...register('name')}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sku" className="flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4 text-muted-foreground" />
              SKU <span className="font-bold text-destructive">*</span>
            </Label>
            <Input
              id="sku"
              placeholder="e.g. LCD-IP13"
              disabled={detailsPending}
              className={errors.sku ? 'border-destructive focus-visible:ring-destructive' : ''}
              {...register('sku')}
            />
            <FieldError message={errors.sku?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stockAlert" className="flex items-center gap-2 text-sm font-medium">
              <Warehouse className="h-4 w-4 text-muted-foreground" />
              Stock alert (minimum)
            </Label>
            <Input
              id="stockAlert"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              disabled={detailsPending}
              className={
                errors.stockAlert ? 'border-destructive focus-visible:ring-destructive' : ''
              }
              {...register('stockAlert', {
                setValueAs: (v) => {
                  if (v === '' || v == null) return 0
                  const n = typeof v === 'number' ? v : Number(v)
                  return Number.isFinite(n) ? n : 0
                },
              })}
            />
            <p className="text-xs text-muted-foreground">
              Low Stock warning appears when quantity reaches this level or below.
            </p>
            <FieldError message={errors.stockAlert?.message} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PaisePriceField
              name="purchasePrice"
              label="Purchase price"
              control={control}
              errors={errors}
              disabled={detailsPending}
            />
            <PaisePriceField
              name="sellingPrice"
              label="Selling price"
              control={control}
              errors={errors}
              disabled={detailsPending}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="supplier" className="flex items-center gap-2 text-sm font-medium">
                <Truck className="h-4 w-4 text-muted-foreground" />
                Supplier
              </Label>
              <span className="text-[11px] text-muted-foreground">Optional</span>
            </div>
            <Input
              id="supplier"
              placeholder="e.g. PartsHub India"
              disabled={detailsPending}
              className={errors.supplier ? 'border-destructive focus-visible:ring-destructive' : ''}
              {...register('supplier')}
            />
            <FieldError message={errors.supplier?.message} />
          </div>

          {mode === 'create' ? (
            <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              New parts start with 1 in stock. Use Manage Part → Stock to add or remove more.
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel} disabled={detailsPending}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" variant="accent" disabled={detailsPending}>
              {detailsPending
                ? mode === 'create'
                  ? 'Adding…'
                  : 'Saving…'
                : mode === 'create'
                  ? 'Add Part'
                  : 'Save Details'}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={onSubmitStock} className="space-y-4" noValidate>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current stock
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {currentQuantity}
            </p>
          </div>

          <div className="flex gap-1 rounded-lg border border-border p-1">
            <button
              type="button"
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                direction === 'IN'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => handleDirectionChange('IN')}
              disabled={stockPending}
            >
              Add Stock
            </button>
            <button
              type="button"
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                direction === 'OUT'
                  ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => handleDirectionChange('OUT')}
              disabled={stockPending}
            >
              Remove Stock
            </button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adjustQty">Quantity</Label>
            <Input
              id="adjustQty"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={adjustQty || ''}
              onChange={(e) => setAdjustQty(e.target.value)}
              disabled={stockPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select
              key={direction}
              value={resolvedReason}
              onValueChange={(v) => setReason(v as AdjustStockInput['reason'])}
              disabled={stockPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {reasonOptions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {STOCK_REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-dashed border-border px-3 py-2 text-sm">
            <span className="text-muted-foreground">New stock preview: </span>
            <span
              className={cn(
                'font-semibold tabular-nums',
                previewQuantity < 0 ? 'text-destructive' : 'text-foreground',
              )}
            >
              {validAdjustQty > 0 ? previewQuantity : currentQuantity}
            </span>
          </div>

          {stockError ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
              {stockError}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel} disabled={stockPending}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" variant="accent" disabled={stockPending || validAdjustQty < 1}>
              {stockPending
                ? 'Updating…'
                : direction === 'IN'
                  ? 'Add Stock'
                  : 'Remove Stock'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
