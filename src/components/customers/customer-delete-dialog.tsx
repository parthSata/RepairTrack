'use client'

import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useDeleteCustomer } from '@/features/customers/mutations'
import { type Customer } from '@/features/customers/queries'
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

interface CustomerDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onSuccess?: () => void
}

export function CustomerDeleteDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDeleteDialogProps) {
  const deleteMutation = useDeleteCustomer()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setErrorMessage(null)
    }
    onOpenChange(newOpen)
  }


  if (!customer) return null

  const hasRepairs = (customer.totalRepairs ?? 0) > 0

  const handleDelete = async () => {
    setErrorMessage(null)
    try {
      await deleteMutation.mutateAsync(customer.id)
      toast.success('Customer deleted successfully')
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err && (err as { response?: { data?: { message?: string; error?: { message?: string } } } }).response?.data?.error?.message
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : (err as Error).message || 'Failed to delete customer'

      const finalMsg = message ?? 'Failed to delete customer'
      setErrorMessage(finalMsg)
      toast.error(finalMsg)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Delete Customer
        </AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete <strong className="text-foreground">{customer.name}</strong> ({customer.phone})?
        </AlertDialogDescription>
      </AlertDialogHeader>

      {hasRepairs ? (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-400 my-2">
          <strong>Warning:</strong> This customer has <strong>{customer.totalRepairs}</strong> repair record(s). Customers with active or past repairs cannot be deleted to preserve repair history.
        </div>
      ) : (
        <p className="text-xs text-muted-foreground my-2">
          This action cannot be undone. This will permanently remove the customer record from your shop database.
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
          {deleteMutation.isPending ? 'Deleting...' : 'Delete Customer'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialog>
  )
}
