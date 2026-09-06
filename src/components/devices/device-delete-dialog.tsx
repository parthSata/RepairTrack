'use client'

import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useDeleteDevice } from '@/features/devices/mutations'
import type { Device } from '@/features/devices/queries'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/ui/sonner'

interface DeviceDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: Device | null
  onSuccess?: () => void
}

export function DeviceDeleteDialog({
  open,
  onOpenChange,
  device,
  onSuccess,
}: DeviceDeleteDialogProps) {
  const deleteMutation = useDeleteDevice()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setErrorMessage(null)
    }
    onOpenChange(newOpen)
  }

  if (!device) return null

  const hasRepairs = (device.totalRepairs ?? 0) > 0

  const handleDelete = async () => {
    setErrorMessage(null)
    try {
      await deleteMutation.mutateAsync({ id: device.id, customerId: device.customerId })
      toast.success('Device deleted successfully')
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string }
      const finalMsg = errorObj?.response?.data?.error?.message || errorObj?.message || 'Failed to delete device'
      setErrorMessage(finalMsg)
      toast.error(finalMsg)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Delete Device
        </AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete <strong className="text-foreground">{device.brand} {device.model}</strong>{device.serialNumber ? ` (SN: ${device.serialNumber})` : ''}?
        </AlertDialogDescription>
      </AlertDialogHeader>

      {hasRepairs ? (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-400 my-2">
          <strong>Warning:</strong> This device has <strong>{device.totalRepairs}</strong> repair record(s). Devices with active or past repair history cannot be deleted to preserve audit trails.
        </div>
      ) : (
        <p className="text-xs text-muted-foreground my-2">
          This action cannot be undone. This will permanently remove the device record from your shop database.
        </p>
      )}

      {errorMessage && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive my-2 font-medium">
          {errorMessage}
        </div>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={handleDelete}
          disabled={deleteMutation.isPending || hasRepairs}
          className={hasRepairs ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Delete Device'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialog>
  )
}
