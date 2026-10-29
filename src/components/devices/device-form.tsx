'use client'

import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ShieldAlert } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ListFilterSelect } from '@/components/ui/list-filter-select'
import { Textarea } from '@/components/ui/textarea'
import {
  deviceSchema,
  DEVICE_TYPES,
  DEVICE_CONDITIONS,
  type DeviceFormInput,
} from '@/features/devices/schemas'
import { useCreateDevice, useUpdateDevice } from '@/features/devices/mutations'
import { cn } from '@/lib/utils'
import { CustomerPicker } from './customer-picker'
import type { Device, LinkedCustomer } from '@/features/devices/queries'

interface DeviceFormProps {
  mode: 'create' | 'edit'
  deviceId?: string
  initialData?: Partial<DeviceFormInput>
  initialCustomer?: LinkedCustomer | null
  onSuccess: (device?: Device) => void
  onCancel: () => void
}

function FieldLabel({
  htmlFor,
  required,
  children,
  hint,
}: {
  htmlFor: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
    >
      {children}
      {required ? <span className="text-destructive"> *</span> : null}
      {hint ? (
        <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground/80">
          ({hint})
        </span>
      ) : null}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="flex items-center gap-1 text-xs font-medium text-destructive">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  )
}

export function DeviceForm({
  mode,
  deviceId,
  initialData,
  initialCustomer,
  onSuccess,
  onCancel,
}: DeviceFormProps) {
  const [selectedCustomer, setSelectedCustomer] = React.useState<LinkedCustomer | null>(
    initialCustomer ?? null,
  )

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DeviceFormInput>({
    resolver: zodResolver(deviceSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      customerId: initialData?.customerId ?? initialCustomer?.id ?? '',
      brand: initialData?.brand ?? '',
      model: initialData?.model ?? '',
      markUnverified: initialData?.markUnverified ?? false,
      serialNumber: initialData?.serialNumber ?? '',
      deviceType: initialData?.deviceType ?? 'PHONE',
      condition: initialData?.condition ?? 'GOOD',
      accessories: initialData?.accessories ?? '',
    },
  })

  const currentDeviceType = useWatch({ control, name: 'deviceType' })
  const currentCondition = useWatch({ control, name: 'condition' })
  const customerId = useWatch({ control, name: 'customerId' })
  const watchedModel = useWatch({ control, name: 'model' })
  const markUnverified = useWatch({ control, name: 'markUnverified' })

  const createMutation = useCreateDevice()
  const updateMutation = useUpdateDevice()

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting
  const hasModel = Boolean(watchedModel?.trim())
  const serialLabel = currentDeviceType === 'PHONE' ? 'IMEI / Serial Number' : 'Serial Number'

  // Checkbox is hidden when model is blank — clear stale low-confidence flag.
  React.useEffect(() => {
    if (!hasModel && markUnverified) {
      setValue('markUnverified', false)
    }
  }, [hasModel, markUnverified, setValue])

  const onSubmit = async (data: DeviceFormInput) => {
    try {
      let savedDevice: Device | undefined
      if (mode === 'create') {
        savedDevice = await createMutation.mutateAsync(data)
        toast.success('Device added')
      } else if (mode === 'edit' && deviceId) {
        savedDevice = await updateMutation.mutateAsync({ id: deviceId, data })
        toast.success('Device updated')
      }
      onSuccess(savedDevice)
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { error?: { message?: string } } }
        message?: string
      }
      const message =
        errorObj?.response?.data?.error?.message ||
        errorObj?.message ||
        'An unexpected error occurred'
      toast.error(message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2" noValidate>
      <CustomerPicker
        value={customerId}
        selectedCustomer={selectedCustomer}
        onChange={(id, cust) => {
          setValue('customerId', id, { shouldValidate: true })
          if (cust) setSelectedCustomer(cust)
        }}
        error={errors.customerId?.message}
      />

      {/* Brand + Model stay equal height — verification lives on its own row below */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="brand" required>
            Brand
          </FieldLabel>
          <Input
            id="brand"
            placeholder="e.g. Apple, Samsung, Dell"
            {...register('brand')}
            disabled={isPending}
            className={errors.brand ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          <FieldError message={errors.brand?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="model" hint="optional at intake">
            Model
          </FieldLabel>
          <Input
            id="model"
            placeholder="e.g. iPhone 14 Pro, XPS 15"
            {...register('model')}
            disabled={isPending}
            className={errors.model ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          <FieldError message={errors.model?.message} />
        </div>
      </div>

      {hasModel ? (
        <label
          htmlFor="markUnverified"
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors',
            markUnverified
              ? 'border-amber-300/80 bg-amber-50/90 dark:border-amber-800/60 dark:bg-amber-950/25'
              : 'border-border/80 bg-muted/30 hover:bg-muted/50',
          )}
        >
          <input
            type="checkbox"
            id="markUnverified"
            {...register('markUnverified')}
            disabled={isPending}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-input bg-background text-accent focus:ring-accent"
          />
          <span className="min-w-0 space-y-0.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <ShieldAlert
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  markUnverified ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
                )}
              />
              Low confidence — mark as unverified
            </span>
            <span className="block text-xs leading-relaxed text-muted-foreground">
              Use when the model might be wrong. Staff or the assigned tech must confirm it before
              parts or estimates.
            </span>
          </span>
        </label>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="deviceType" required>
            Device Type
          </FieldLabel>
          <ListFilterSelect
            id="deviceType"
            value={currentDeviceType}
            onValueChange={(value) =>
              setValue('deviceType', value as DeviceFormInput['deviceType'], { shouldValidate: true })
            }
            disabled={isPending}
            aria-label="Device type"
            className={errors.deviceType ? 'border-destructive focus:ring-destructive' : undefined}
            options={DEVICE_TYPES.map((type) => ({
              value: type,
              label:
                type === 'PHONE'
                  ? 'Phone / Mobile'
                  : type === 'LAPTOP'
                    ? 'Laptop'
                    : type === 'TABLET'
                      ? 'Tablet'
                      : type === 'DESKTOP'
                        ? 'Desktop / PC'
                        : 'Other',
            }))}
          />
          <FieldError message={errors.deviceType?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="condition" required>
            Condition
          </FieldLabel>
          <ListFilterSelect
            id="condition"
            value={currentCondition}
            onValueChange={(value) =>
              setValue('condition', value as DeviceFormInput['condition'], { shouldValidate: true })
            }
            disabled={isPending}
            aria-label="Device condition"
            className={errors.condition ? 'border-destructive focus:ring-destructive' : undefined}
            options={DEVICE_CONDITIONS.map((cond) => ({
              value: cond,
              label:
                cond === 'GOOD'
                  ? 'Good (Minor wear)'
                  : cond === 'FAIR'
                    ? 'Fair (Scratches/Dents)'
                    : 'Poor (Damaged/Broken)',
            }))}
          />
          <FieldError message={errors.condition?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="serialNumber">{serialLabel}</FieldLabel>
        <Input
          id="serialNumber"
          placeholder="e.g. SN1234567890 or IMEI"
          {...register('serialNumber')}
          disabled={isPending}
          className={
            errors.serialNumber ? 'border-destructive focus-visible:ring-destructive' : ''
          }
        />
        <FieldError message={errors.serialNumber?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="accessories">Accessories Received</FieldLabel>
        <Textarea
          id="accessories"
          placeholder="e.g. Charger, protective case, SIM card tray"
          rows={2}
          {...register('accessories')}
          disabled={isPending}
          className={
            errors.accessories ? 'border-destructive focus-visible:ring-destructive' : ''
          }
        />
        <FieldError message={errors.accessories?.message} />
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="accent" disabled={isPending}>
          {isPending ? 'Saving...' : mode === 'create' ? 'Add Device' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
