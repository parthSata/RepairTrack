import Link from 'next/link'
import { Ban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Invoice } from '@/features/invoices/queries'
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@/features/invoices/schemas'

export function formatInvoiceDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date)
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge variant={status === 'CANCELLED' ? 'destructive' : 'success'}>
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  )
}

export function InvoiceCancelledBanner({ invoice }: { invoice: Invoice }) {
  const cancelledBy = invoice.cancelledByName ?? 'a team member'
  const cancelledOn = invoice.cancelledAt ? ` on ${formatInvoiceDate(invoice.cancelledAt)}` : ''

  return (
    <div
      role="status"
      className="space-y-1.5 rounded-xl border border-rose-200/80 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
    >
      <p className="flex items-center gap-2 font-semibold">
        <Ban className="h-4 w-4 shrink-0" aria-hidden />
        This invoice was cancelled by {cancelledBy}
        {cancelledOn}.
      </p>
      {invoice.cancellationReason ? (
        <p className="break-words">Reason: {invoice.cancellationReason}</p>
      ) : null}
      <p>
        It is kept for your records only.{' '}
        <Link
          href={`/repairs/${invoice.repairId}`}
          className="font-medium underline underline-offset-2"
        >
          Go to the repair
        </Link>{' '}
        to finalize the bill and generate a new invoice.
      </p>
    </div>
  )
}
