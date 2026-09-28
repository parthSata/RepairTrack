'use client'

import * as React from 'react'
import { Ban, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError } from '@/components/ui/field-error'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCancelInvoice } from '@/features/invoices/mutations'
import { CANCELLATION_REASON_MAX, cancelInvoiceSchema } from '@/features/invoices/schemas'

interface CancelInvoiceDialogProps {
  invoiceId: string
  invoiceNumber: string
}

export function CancelInvoiceDialog({ invoiceId, invoiceNumber }: CancelInvoiceDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState('')
  const [reasonError, setReasonError] = React.useState<string | undefined>()
  const cancelMutation = useCancelInvoice(invoiceId)
  const isPending = cancelMutation.isPending

  const handleOpenChange = (next: boolean) => {
    if (isPending) return
    setOpen(next)
    if (!next) {
      setReason('')
      setReasonError(undefined)
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = cancelInvoiceSchema.safeParse({ reason })
    if (!parsed.success) {
      setReasonError(parsed.error.issues[0]?.message)
      return
    }
    setReasonError(undefined)
    cancelMutation.mutate(parsed.data, { onSuccess: () => handleOpenChange(false) })
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Ban className="h-4 w-4" aria-hidden />
        Cancel Invoice
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange} preventDismiss={isPending}>
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Cancel invoice {invoiceNumber}?</DialogTitle>
            <DialogDescription>
              The invoice stays on record as Cancelled and its number is never reused. Charges and
              parts on the repair unlock so you can finalize the bill and generate a new invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="cancel-invoice-reason">Reason</Label>
            <Textarea
              id="cancel-invoice-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={CANCELLATION_REASON_MAX}
              rows={3}
              placeholder="e.g. Customer approved an extra part after the bill was issued"
              aria-invalid={reasonError ? true : undefined}
              disabled={isPending}
            />
            <FieldError message={reasonError} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              Keep invoice
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {isPending ? 'Cancelling…' : 'Cancel Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
