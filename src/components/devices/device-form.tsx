'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  deviceSchema,
  DEVICE_TYPES,
  DEVICE_CONDITIONS,
  type DeviceFormInput,
} from '@/features/devices/schemas'
import { useCreateDevice, useUpdateDevice } from '@/features/devices/mutations'
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
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DeviceFormInput>({
    resolver: zodResolver(deviceSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      customerId: initialData?.customerId ?? initialCustomer?.id ?? '',
      brand: initialData?.brand ?? '',
      model: initialData?.model ?? '',
      serialNumber: initialData?.serialNumber ?? '',
      deviceType: initialData?.deviceType ?? 'PHONE',
      condition: initialData?.condition ?? 'GOOD',
      accessories: initialData?.accessories ?? '',
    },
  })

  const currentDeviceType = watch('deviceType')
  const customerId = watch('customerId')

  const createMutation = useCreateDevice()
  const updateMutation = useUpdateDevice()

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting

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
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string }
      const message = errorObj?.response?.data?.error?.message || errorObj?.message || 'An unexpected error occurred'
      toast.error(message)
    }
  }

  const serialLabel = currentDeviceType === 'PHONE' ? 'IMEI / Serial Number' : 'Serial Number'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2" noValidate>
      {/* Customer Picker */}
      <CustomerPicker
        value={customerId}
        selectedCustomer={selectedCustomer}
        onChange={(id, cust) => {
          setValue('customerId', id, { shouldValidate: true })
          if (cust) setSelectedCustomer(cust)
        }}
        error={errors.customerId?.message}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Brand */}
        <div className="space-y-1">
          <label htmlFor="brand" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Brand <span className="text-destructive">*</span>
          </label>
          <Input
            id="brand"
            placeholder="e.g. Apple, Samsung, Dell"
            {...register('brand')}
            disabled={isPending}
            className={errors.brand ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.brand && (
            <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.brand.message}
            </p>
          )}
        </div>

        {/* Model */}
        <div className="space-y-1">
          <label htmlFor="model" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Model <span className="text-xs font-normal text-muted-foreground">(Optional at intake)</span>
          </label>
          <Input
            id="model"
            placeholder="e.g. iPhone 14 Pro, XPS 15 (leave empty if unconfirmed)"
            {...register('model')}
            disabled={isPending}
            className={errors.model ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.model && (
            <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.model.message}
            </p>
          )}

          {watch('model')?.trim() ? (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="markUnverified"
                {...register('markUnverified')}
                disabled={isPending}
                className="h-3.5 w-3.5 rounded border-input bg-background text-accent focus:ring-accent"
              />
              <label htmlFor="markUnverified" className="text-xs text-muted-foreground cursor-pointer select-none">
                Low confidence — mark as unverified
              </label>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Device Type */}
        <div className="space-y-1">
          <label htmlFor="deviceType" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Device Type <span className="text-destructive">*</span>
          </label>
          <select
            id="deviceType"
            {...register('deviceType')}
            disabled={isPending}
            className={`w-full h-10 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
              errors.deviceType ? 'border-destructive focus:ring-destructive' : 'border-input'
            }`}
          >
            {DEVICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === 'PHONE'
                  ? 'Phone / Mobile'
                  : type === 'LAPTOP'
                  ? 'Laptop'
                  : type === 'TABLET'
                  ? 'Tablet'
                  : type === 'DESKTOP'
                  ? 'Desktop / PC'
                  : 'Other'}
              </option>
            ))}
          </select>
          {errors.deviceType && (
            <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.deviceType.message}
            </p>
          )}
        </div>

        {/* Condition */}
        <div className="space-y-1">
          <label htmlFor="condition" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Condition <span className="text-destructive">*</span>
          </label>
          <select
            id="condition"
            {...register('condition')}
            disabled={isPending}
            className={`w-full h-10 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
              errors.condition ? 'border-destructive focus:ring-destructive' : 'border-input'
            }`}
          >
            {DEVICE_CONDITIONS.map((cond) => (
              <option key={cond} value={cond}>
                {cond === 'GOOD' ? 'Good (Minor wear)' : cond === 'FAIR' ? 'Fair (Scratches/Dents)' : 'Poor (Damaged/Broken)'}
              </option>
            ))}
          </select>
          {errors.condition && (
            <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.condition.message}
            </p>
          )}
        </div>
      </div>

      {/* Serial Number */}
      <div className="space-y-1">
        <label htmlFor="serialNumber" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {serialLabel}
        </label>
        <Input
          id="serialNumber"
          placeholder="e.g. SN1234567890 or IMEI"
          {...register('serialNumber')}
          disabled={isPending}
          className={errors.serialNumber ? 'border-destructive focus-visible:ring-destructive' : ''}
        />
        {errors.serialNumber && (
          <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.serialNumber.message}
          </p>
        )}
      </div>

      {/* Accessories */}
      <div className="space-y-1">
        <label htmlFor="accessories" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Accessories Received
        </label>
        <Textarea
          id="accessories"
          placeholder="e.g. Charger, protective case, SIM card tray"
          rows={2}
          {...register('accessories')}
          disabled={isPending}
          className={errors.accessories ? 'border-destructive focus-visible:ring-destructive' : ''}
        />
        {errors.accessories && (
          <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.accessories.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
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
