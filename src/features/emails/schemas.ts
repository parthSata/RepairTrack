import { z } from 'zod'
import type { BadgeProps } from '@/components/ui/badge'
import { idParamSchema } from '@/lib/validation'

/** Email types written with a `repair_id`, each rebuildable from its `<TYPE>:<entityId>` dedupe key. */
export const REPAIR_EMAIL_TYPES = [
  'REPAIR_RECEIVED',
  'APPROVAL_REQUIRED',
  'REPAIR_STARTED',
  'READY_FOR_PICKUP',
  'REPAIR_COMPLETED',
  'INVOICE_GENERATED',
  'PAYMENT_RECEIVED',
] as const

export type RepairEmailType = (typeof REPAIR_EMAIL_TYPES)[number]
export type EmailLogStatus = 'SENT' | 'FAILED' | 'SKIPPED'

export type RepairEmailLog = {
  id: string
  type: RepairEmailType
  recipient: string | null
  status: EmailLogStatus
  /** Skip or failure code, never the raw provider error. */
  reason: string | null
  createdAt: string
  canResend: boolean
}

export type ResendEmailResult = {
  status: EmailLogStatus
  reason: string | null
  recipient: string | null
}

export const repairEmailParamSchema = idParamSchema.extend({
  logId: z.uuid({ message: 'Invalid email id' }),
})

export const EMAIL_TYPE_LABELS: Record<RepairEmailType, string> = {
  REPAIR_RECEIVED: 'Repair received',
  APPROVAL_REQUIRED: 'Approval required',
  REPAIR_STARTED: 'Repair started',
  READY_FOR_PICKUP: 'Ready for pickup',
  REPAIR_COMPLETED: 'Repair completed',
  INVOICE_GENERATED: 'Invoice generated',
  PAYMENT_RECEIVED: 'Payment received',
}

export const EMAIL_STATUS_UI: Record<
  EmailLogStatus,
  { label: string; variant: NonNullable<BadgeProps['variant']> }
> = {
  SENT: { label: 'Sent', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'destructive' },
  SKIPPED: { label: 'Skipped', variant: 'warning' },
}

const EMAIL_REASON_LABELS: Record<string, string> = {
  no_customer_email: 'No customer email',
  gmail_not_connected: 'Gmail not connected',
  already_sent: 'Already sent',
  invalid_grant: 'Gmail access revoked',
  send_failed: 'Gmail could not send',
  not_configured: 'Gmail not configured',
  unexpected: 'Unexpected error',
}

export function getEmailReasonLabel(reason: string | null): string | null {
  if (!reason) return null
  return EMAIL_REASON_LABELS[reason] ?? EMAIL_REASON_LABELS.unexpected
}

export const REPAIR_EMAIL_MESSAGES = {
  forbidden: 'Not authorized to manage repair emails',
  repairNotFound: 'Repair ticket not found',
  emailNotFound: 'Email not found',
  alreadySent: 'This email was already sent.',
  notResendable: 'This email cannot be resent.',
  approvalNotPending: 'This approval request is no longer pending, so its email cannot be resent.',
  approvalNotFound: 'The approval request for this email no longer exists.',
  invoiceCancelled: 'This invoice was cancelled, so its email cannot be resent.',
  invoiceNotFound: 'The invoice for this email no longer exists.',
  paymentNotFound: 'The payment for this email no longer exists.',
} as const
