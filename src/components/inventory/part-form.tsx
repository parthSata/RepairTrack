'use client'

import * as React from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Package, Tag, Hash, Warehouse, Truck } from 'lucide-react'
import { partSchema, type PartFormInput } from '@/features/inventory/schemas'
import { useCreatePart, useUpdatePart } from '@/features/inventory/mutations'
import type { Part } from '@/features/inventory/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field-error'
import { PaisePriceField } from '@/components/ui/paise-price-field'
import { toast } from '@/components/ui/sonner'
import { getApiErrorMessage } from '@/lib/api-error'

interface PartFormProps {
  mode: 'create' | 'edit'
  partId?: string
  initialData?: Partial<PartFormInput>
  onSuccess: (part?: Part) => void
  onCancel?: () => void
  onPendingChange?: (pending: boolean) => void
}

export function PartForm({
  mode,
  partId,
  initialData,
  onSuccess,
  onCancel,
  onPendingChange,
}: PartFormProps) {
  const createMutation = useCreatePart()
  const updateMutation = useUpdatePart()
  const isPending = createMutation.isPending || updateMutation.isPending

  React.useEffect(() => {
    onPendingChange?.(isPending)
  }, [isPending, onPendingChange])

  const {
    register,
    handleSubmit, 
    control,
    setError,
    formState: { errors },
  } = useForm<PartFormInput>({
    // partSchema uses z.coerce; cast keeps RHF aligned with PartFormInput (output type)
    resolver: zodResolver(partSchema) as Resolver<PartFormInput>,
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: initialData?.name ?? '',
      sku: initialData?.sku ?? '',
      quantity: initialData?.quantity ?? 0,
      stockAlert: initialData?.stockAlert ?? 0,
      purchasePrice: initialData?.purchasePrice ?? 0,
      sellingPrice: initialData?.sellingPrice ?? 0,
      supplier: initialData?.supplier ?? '',
    },
  })

  const onSubmit = async (values: PartFormInput) => {
    const payload: PartFormInput = {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4 text-muted-foreground" />
          Part name <span className="font-bold text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="e.g. iPhone 13 LCD"
          disabled={isPending}
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
          disabled={isPending}
          className={errors.sku ? 'border-destructive focus-visible:ring-destructive' : ''}
          {...register('sku')}
        />
        <FieldError message={errors.sku?.message} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="quantity" className="flex items-center gap-2 text-sm font-medium">
            <Hash className="h-4 w-4 text-muted-foreground" />
            Quantity
          </Label>
          <Input
            id="quantity"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            disabled={isPending}
            className={errors.quantity ? 'border-destructive focus-visible:ring-destructive' : ''}
            {...register('quantity')}
          />
          <FieldError message={errors.quantity?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stockAlert" className="flex items-center gap-2 text-sm font-medium">
            <Warehouse className="h-4 w-4 text-muted-foreground" />
            Stock alert
          </Label>
          <Input
            id="stockAlert"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            disabled={isPending}
            className={
              errors.stockAlert ? 'border-destructive focus-visible:ring-destructive' : ''
            }
            {...register('stockAlert')}
          />
          <FieldError message={errors.stockAlert?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PaisePriceField
          name="purchasePrice"
          label="Purchase price"
          control={control}
          errors={errors}
          disabled={isPending}
        />
        <PaisePriceField
          name="sellingPrice"
          label="Selling price"
          control={control}
          errors={errors}
          disabled={isPending}
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
          disabled={isPending}
          className={errors.supplier ? 'border-destructive focus-visible:ring-destructive' : ''}
          {...register('supplier', {
            setValueAs: (v: string) => {
              const trimmed = typeof v === 'string' ? v.trim() : ''
              return trimmed.length > 0 ? trimmed : null
            },
          })}
        />
        <FieldError message={errors.supplier?.message} />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" variant="accent" disabled={isPending}>
          {isPending
            ? mode === 'create'
              ? 'Adding…'
              : 'Saving…'
            : mode === 'create'
              ? 'Add Part'
              : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
