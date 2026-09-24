'use client'

import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useDeletePart } from '@/features/inventory/mutations'
import type { Part } from '@/features/inventory/queries'
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
import { getApiErrorMessage } from '@/lib/api-error'

interface PartDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  part: Part | null
  onSuccess?: () => void
}

export function PartDeleteDialog({
  open,
  onOpenChange,
  part,
  onSuccess,
}: PartDeleteDialogProps) {
  const deleteMutation = useDeletePart()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setErrorMessage(null)
    }
    onOpenChange(newOpen)
  }

  if (!part) return null

  const handleDelete = async () => {
    setErrorMessage(null)
    try {
      await deleteMutation.mutateAsync(part.id)
      toast.success('Part deleted')
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      const finalMsg = getApiErrorMessage(err, 'Failed to delete part')
      setErrorMessage(finalMsg)
      toast.error(finalMsg)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Delete Part
        </AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete{' '}
          <strong className="text-foreground">{part.name}</strong> ({part.sku})?
        </AlertDialogDescription>
      </AlertDialogHeader>

      <p className="my-2 text-xs text-muted-foreground">
        This action cannot be undone. This will permanently remove the part from your shop
        inventory.
      </p>

      {errorMessage ? (
        <div className="my-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? 'Deleting...' : 'Delete Part'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialog>
  )
}
