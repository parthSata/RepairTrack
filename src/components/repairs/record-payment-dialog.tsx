'use client'

import Link from 'next/link'
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowUpRight, CheckCircle2, Loader2, QrCode } from 'lucide-react'
import { UpiPayCard } from '@/components/payments/upi-pay-card'
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
import type { ShopUpi } from '@/features/payments/upi'
import { getApiErrorMessage } from '@/lib/api-error'
import { formatRupees } from '@/lib/format-money'
import { paiseToRupees, rupeesToPaise } from '@/lib/money'

type RecordPaymentDialogProps = {
  repairId: string
  ticketNumber: string
  balance: number | null
  upi: ShopUpi | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type RecordPaymentFormProps = {
  repairId: string
  ticketNumber: string
  balance: number | null
  upi: ShopUpi | null
  recordPayment: ReturnType<typeof useRecordPayment>
  onClose: () => void
}

export function RecordPaymentDialog({
  repairId,
  ticketNumber,
  balance,
  upi,
  open,
  onOpenChange,
}: RecordPaymentDialogProps) {
  const recordPayment = useRecordPayment(repairId)
  const isPending = recordPayment.isPending

  const handleOpenChange = (next: boolean) => {
    if (isPending) return
    if (!next) recordPayment.reset()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} preventDismiss={isPending}>
      <DialogHeader>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogDescription>
          {balance != null
            ? `Full & final settlement: ${formatRupees(Math.max(balance, 0))}`
            : 'Finalize the bill first to record payment.'}
        </DialogDescription>
      </DialogHeader>
      <RecordPaymentForm
        repairId={repairId}
        ticketNumber={ticketNumber}
        balance={balance}
        upi={upi}
        recordPayment={recordPayment}
        onClose={() => handleOpenChange(false)}
      />
    </Dialog>
  )
}

function RecordPaymentForm({
  repairId,
  ticketNumber,
  balance,
  upi,
  recordPayment,
  onClose,
}: RecordPaymentFormProps) {
  const isPending = recordPayment.isPending
  const fullAmountRupees = balance != null && balance > 0 ? paiseToRupees(balance) : 0

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
      amount: fullAmountRupees,
      method: 'CASH',
      reference: '',
      note: '',
    },
  })
  const method = useWatch({ control, name: 'method' })

  const onSubmit = (values: RecordPaymentInput) => {
    if (balance == null || balance <= 0) {
      setError('amount', { message: PAYMENT_MESSAGES.billNotFinalized })
      return
    }
    if (rupeesToPaise(values.amount) !== balance) {
      setError('amount', { message: PAYMENT_MESSAGES.fullPaymentRequired })
      return
    }
    if (values.method === 'UPI' && !values.reference?.trim()) {
      setError('reference', { message: PAYMENT_MESSAGES.upiReferenceRequired })
      return
    }
    recordPayment.mutate(values, { onSuccess: onClose })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Amount displayed clearly as full & final settlement */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="payment-amount">Payment Amount (₹)</Label>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Full Settlement
          </span>
        </div>
        <Input
          id="payment-amount"
          type="number"
          readOnly
          value={fullAmountRupees}
          disabled={isPending}
          className="bg-muted/40 font-semibold cursor-not-allowed"
          {...register('amount')}
        />
        <FieldError message={errors.amount?.message} />
      </div>

      {/* Payment Method Selector */}
      <div className="space-y-1.5">
        <Label htmlFor="payment-method">Payment Method</Label>
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

      {/* Integrated Live UPI QR Code when UPI is selected */}
      {method === 'UPI' ? (
        <div className="space-y-3">
          {upi ? (
            <UpiPayCard
              upi={upi}
              amountPaise={balance ?? 0}
              ticketNumber={ticketNumber}
              className="w-full"
              showNote={true}
            />
          ) : (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
              <QrCode className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">UPI ID Not Configured</p>
                <p>
                  Add a UPI ID in your shop settings to display payment QR codes automatically.
                </p>
                <Link
                  href="/settings/shop"
                  className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:opacity-80"
                >
                  Configure UPI in Shop Settings <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="payment-reference">
              UPI Transaction ID / UTR <span className="text-destructive">*</span>
            </Label>
            <Input
              id="payment-reference"
              placeholder={REFERENCE_PLACEHOLDERS.UPI}
              maxLength={100}
              disabled={isPending}
              aria-invalid={errors.reference ? true : undefined}
              {...register('reference')}
            />
            <p className="text-[11px] text-muted-foreground">
              Enter the 12-digit UTR or Transaction reference from the customer&apos;s UPI confirmation.
            </p>
            <FieldError message={errors.reference?.message} />
          </div>
        </div>
      ) : null}

      {/* Optional Note */}
      <div className="space-y-1.5">
        <Label htmlFor="payment-note">Note (optional)</Label>
        <Textarea
          id="payment-note"
          rows={2}
          maxLength={500}
          placeholder="Any additional remarks..."
          disabled={isPending}
          {...register('note')}
        />
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
          {isPending
            ? 'Recording…'
            : method === 'UPI'
              ? 'Verify & Record UPI Payment'
              : 'Record Cash Payment'}
        </Button>
      </DialogFooter>
    </form>
  )
}
