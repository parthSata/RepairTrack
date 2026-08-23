'use client'

import * as React from 'react'
import { AlertTriangle, Check, ShieldAlert } from 'lucide-react'
import { useUpdateDevice } from '@/features/devices/mutations'
import type { Device } from '@/features/devices/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/sonner'

interface ModelConfirmationCardProps {
  device: Device
  onConfirmed?: () => void
}

export function ModelConfirmationCard({ device, onConfirmed }: ModelConfirmationCardProps) {
  const updateMutation = useUpdateDevice()
  const [showOverrideForm, setShowOverrideForm] = React.useState(false)
  const [brand, setBrand] = React.useState(device.brand || '')
  const [model, setModel] = React.useState(device.model || '')
  const [overrideReason, setOverrideReason] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!brand.trim()) {
      setError('Brand is required')
      return
    }
    if (!model.trim()) {
      setError('Model is required to confirm the device model')
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: device.id,
        data: {
          customerId: device.customerId,
          brand: brand.trim(),
          model: model.trim(),
          deviceType: device.deviceType,
          condition: device.condition,
          serialNumber: device.serialNumber,
          accessories: device.accessories,
        },
      })
      toast.success('Device model confirmed successfully')
      if (onConfirmed) onConfirmed()
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string }
      const msg = errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to confirm model'
      setError(msg)
      toast.error(msg)
    }
  }

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!overrideReason.trim()) {
      setError('A reason is required to proceed without confirmed model')
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: device.id,
        data: {
          customerId: device.customerId,
          brand: device.brand,
          model: device.model,
          deviceType: device.deviceType,
          condition: device.condition,
          serialNumber: device.serialNumber,
          accessories: device.accessories,
          modelVerificationOverrideReason: overrideReason.trim(),
        },
      })
      toast.success('Model verification overridden')
      if (onConfirmed) onConfirmed()
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string }
      const msg = errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to override model verification'
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 shadow-xs space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Confirm Device Model
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Inspect the physical device to confirm the exact brand and model before preparing the repair estimate.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive font-medium">
          {error}
        </div>
      )}

      {!showOverrideForm ? (
        <form onSubmit={handleConfirm} className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="card-brand" className="text-xs font-medium text-muted-foreground">
                Brand
              </label>
              <Input
                id="card-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Apple, Samsung"
                disabled={updateMutation.isPending}
                className="h-9 text-xs"
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
                placeholder="e.g. iPhone 14 Pro, Galaxy S23"
                disabled={updateMutation.isPending}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <Button
              type="submit"
              variant="accent"
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto gap-1.5 h-8 text-xs"
            >
              <Check className="h-3.5 w-3.5" />
              {updateMutation.isPending ? 'Saving...' : 'Confirm Model'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowOverrideForm(true)}
              disabled={updateMutation.isPending}
              className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              Proceed without confirmed model...
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleOverride} className="space-y-3 pt-1 border-t border-amber-500/20">
          <div className="space-y-1">
            <label htmlFor="override-reason" className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              Mandatory Override Reason <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="override-reason"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Device won't power on, serial/IMEI tag removed by user"
              rows={2}
              disabled={updateMutation.isPending}
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowOverrideForm(false)}
              disabled={updateMutation.isPending}
              className="h-8 text-xs"
            >
              Back to Confirm
            </Button>

            <Button
              type="submit"
              variant="outline"
              disabled={updateMutation.isPending}
              className="h-8 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Override'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
