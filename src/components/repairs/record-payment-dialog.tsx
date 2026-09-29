'use client'

import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useRecordPayment } from '@/features/payments/mutations'
import {
  PAYMENT_MESSAGES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  recordPaymentSchema,
  REFERENCE_PLACEHOLDERS,
  type RecordPaymentInput,
} from '@/features/payments/schemas'
import { getApiErrorMessage } from '@/lib/api-error'
import { formatRupees } from '@/lib/format-money'
import { paiseToRupees, rupeesToPaise } from '@/lib/money'

type RecordPaymentDialogProps = {
  repairId: string
  /** Balance due in paise; null when there is no bill total yet (no cap). */
  balance: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type RecordPaymentFormProps = {
  repairId: string
  balance: number | null
  recordPayment: ReturnType<typeof useRecordPayment>
  onClose: () => void
}

export function RecordPaymentDialog({ repairId, balance, open, onOpenChange }: RecordPaymentDialogProps) {
  const recordPayment = useRecordPayment(repairId)
  const isPending = recordPayment.isPending

  const handleOpenChange = (next: boolean) => {
    if (isPending) return
    if (!next) recordPayment.reset()
    onOpenChange(next)
  }

  // Dialog unmounts its children when closed, so the form starts fresh on every open.
  return (
    <Dialog open={open} onOpenChange={handleOpenChange} preventDismiss={isPending}>
      <DialogHeader>
        <DialogTitle>Record payment</DialogTitle>
        <DialogDescription>
          {balance != null
            ? `Balance due: ${formatRupees(Math.max(balance, 0))}`
            : 'No bill yet. This payment is recorded as an advance.'}
        </DialogDescription>
      </DialogHeader>
      <RecordPaymentForm
        repairId={repairId}
        balance={balance}
        recordPayment={recordPayment}
        onClose={() => handleOpenChange(false)}
      />
    </Dialog>
  )
}

function RecordPaymentForm({ repairId, balance, recordPayment, onClose }: RecordPaymentFormProps) {
  const isPending = recordPayment.isPending
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RecordPaymentInput>({
    resolver: zodResolver(recordPaymentSchema) as Resolver<RecordPaymentInput>,
    defaultValues: {
      repairId,
      amount: balance != null && balance > 0 ? paiseToRupees(balance) : undefined,
      method: 'CASH',
      reference: '',
      note: '',
    },
  })
  const method = useWatch({ control, name: 'method' })

  const onSubmit = (values: RecordPaymentInput) => {
    if (balance != null && rupeesToPaise(values.amount) > balance) {
      setError('amount', { message: PAYMENT_MESSAGES.exceedsBalance })
      return
    }
    recordPayment.mutate(values, { onSuccess: onClose })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="payment-amount">Amount (₹)</Label>
        <Input
          id="payment-amount"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          placeholder="0"
          disabled={isPending}
          aria-invalid={errors.amount ? true : undefined}
          {...register('amount')}
        />
        <FieldError message={errors.amount?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="payment-method">Method</Label>
        <Controller
          name="method"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
              <SelectTrigger id="payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {PAYMENT_METHOD_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {method !== 'CASH' ? (
        <div className="space-y-1.5">
          <Label htmlFor="payment-reference">Reference (optional)</Label>
          <Input
            id="payment-reference"
            placeholder={REFERENCE_PLACEHOLDERS[method]}
            maxLength={100}
            disabled={isPending}
            {...register('reference')}
          />
          <FieldError message={errors.reference?.message} />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="payment-note">Note (optional)</Label>
        <Textarea id="payment-note" rows={2} maxLength={500} disabled={isPending} {...register('note')} />
        <FieldError message={errors.note?.message} />
      </div>

      {recordPayment.error ? (
        <Alert className="p-3 text-xs font-medium">
          {getApiErrorMessage(recordPayment.error, 'Failed to record payment')}
        </Alert>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={isPending} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isPending ? 'Recording…' : 'Record Payment'}
        </Button>
      </DialogFooter>
    </form>
  )
}
