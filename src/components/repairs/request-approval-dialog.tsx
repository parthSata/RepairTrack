'use client'

import * as React from 'react'
import { Info, Send } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PricingFormSection } from '@/components/repairs/pricing-form-section'
import { TicketSummaryGrid } from '@/components/repairs/ticket-summary-grid'
import { formatINR, paiseToRupees } from '@/features/repairs/money'
import { approvalDiagnosisSchema } from '@/features/repairs/schemas'
import type { RepairPricingFieldsInput } from '@/features/repairs/pricing-schemas'
import { useRequestCustomerApproval } from '@/features/repairs/pricing-mutations'
import { usePricingForm } from '@/features/repairs/use-pricing-form'
import type { RepairPartLine } from '@/features/repairs/queries'
import { getApiErrorMessage } from '@/lib/api-error'

export type RequestApprovalDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  repairId: string
  ticketNumber: string
  statusLabel: string
  customerName: string
  deviceSummary: string
  savedDiagnosis: string | null
  parts: RepairPartLine[]
  savedPricing: RepairPricingFieldsInput
  /** Paise copied into Labor from the intake estimate, or null when Labor is the saved value. */
  laborPrefilledFromIntake?: number | null
  onSent?: () => void
}

/** AlertDialog unmounts its children when closed, so every open starts from the saved values. */
export function RequestApprovalDialog({ open, onOpenChange, ...formProps }: RequestApprovalDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange} contentClassName="max-w-xl sm:max-w-2xl p-5 sm:p-7">
      <RequestApprovalForm {...formProps} onClose={() => onOpenChange(false)} />
    </AlertDialog>
  )
}

function RequestApprovalForm({
  repairId,
  ticketNumber,
  statusLabel,
  customerName,
  deviceSummary,
  savedDiagnosis,
  parts,
  savedPricing,
  laborPrefilledFromIntake = null,
  onSent,
  onClose,
}: Omit<RequestApprovalDialogProps, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const pricing = usePricingForm({ parts, saved: savedPricing })
  const requestMutation = useRequestCustomerApproval(repairId)
  const [diagnosis, setDiagnosis] = React.useState(savedDiagnosis ?? '')
  const [isDiagnosisTouched, setIsDiagnosisTouched] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const diagnosisResult = approvalDiagnosisSchema.safeParse(diagnosis)
  const diagnosisError = isDiagnosisTouched ? diagnosisResult.error?.issues[0]?.message : undefined
  const isPending = requestMutation.isPending
  const canSend = pricing.form.formState.isValid && diagnosisResult.success && !isPending

  const handleSend = pricing.form.handleSubmit(async (values) => {
    if (!diagnosisResult.success) {
      setIsDiagnosisTouched(true)
      return
    }
    setSubmitError(null)
    try {
      await requestMutation.mutateAsync({ ...values, diagnosis: diagnosisResult.data })
      onClose()
      onSent?.()
    } catch (err) {
      // Keep the dialog open with the technician's input so they can fix and resend.
      setSubmitError(getApiErrorMessage(err, 'Failed to send estimate for approval'))
    }
  })

  return (
    <form onSubmit={handleSend} noValidate>
      <AlertDialogHeader className="mb-5">
        <AlertDialogTitle className="text-xl">Send estimate for customer approval</AlertDialogTitle>
        <AlertDialogDescription>
          The customer reviews this diagnosis and breakdown on their tracking page.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="space-y-5">
        <TicketSummaryGrid
          ticketNumber={ticketNumber}
          statusLabel={statusLabel}
          customerName={customerName}
          deviceSummary={deviceSummary}
        />

        <div className="space-y-1.5">
          <Label htmlFor={`approval-diagnosis-${repairId}`} className="text-sm font-medium">
            Diagnosis <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id={`approval-diagnosis-${repairId}`}
            placeholder="What did you find, and what needs to be fixed?"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            onBlur={() => setIsDiagnosisTouched(true)}
            rows={3}
            disabled={isPending}
            aria-invalid={Boolean(diagnosisError)}
            className="rounded-xl text-sm"
          />
          <FieldError message={diagnosisError} />
        </div>

        <PricingFormSection
          pricing={pricing}
          totalLabel="Estimated total"
          taxFieldId={`approval-tax-${repairId}`}
          disabled={isPending}
        />

        {laborPrefilledFromIntake != null ? (
          <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              Labor was pre-filled from the intake estimate (
              {formatINR(paiseToRupees(laborPrefilledFromIntake))}). Edit it if the diagnosis changed the
              price.
            </span>
          </p>
        ) : null}

        {submitError ? <Alert className="p-3 text-xs font-medium">{submitError}</Alert> : null}
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel onClick={onClose} disabled={isPending}>
          Cancel
        </AlertDialogCancel>
        <Button
          type="submit"
          disabled={!canSend}
          className="h-10 gap-1.5 bg-amber-600 text-white hover:bg-amber-700"
        >
          <Send className="h-3.5 w-3.5" aria-hidden />
          {isPending ? 'Sending…' : 'Send to Customer'}
        </Button>
      </AlertDialogFooter>
    </form>
  )
}
