'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CancelInvoiceDialog } from '@/components/invoices/cancel-invoice-dialog'
import { InvoiceDetailsSkeleton } from '@/components/invoices/invoice-details-skeleton'
import { InvoiceHeader } from '@/components/invoices/invoice-header'
import { customerRows, deviceRows, InvoiceParty } from '@/components/invoices/invoice-party'
import { InvoicePartsTable } from '@/components/invoices/invoice-parts-table'
import { InvoicePayments } from '@/components/invoices/invoice-payments'
import { InvoiceCancelledBanner } from '@/components/invoices/invoice-status'
import { InvoiceSummary } from '@/components/invoices/invoice-summary'
import { PrintButton } from '@/components/ui/print-button'
import { QueryErrorState } from '@/components/ui/query-error-state'
import { invoiceFileTitle } from '@/features/invoices/format'
import { useInvoice } from '@/features/invoices/queries'

const INVOICES_HREF = '/invoices'

function BackToInvoicesLink() {
  return (
    <Link
      href={INVOICES_HREF}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back to invoices
    </Link>
  )
}

export function InvoiceDetails({ invoiceId }: { invoiceId: string }) {
  const { data: invoice, isPending, isError, error, refetch } = useInvoice(invoiceId)

  if (isPending) return <InvoiceDetailsSkeleton />

  if (isError) {
    return (
      <QueryErrorState
        className="mx-auto w-full max-w-3xl"
        error={error}
        fallback="Failed to load invoice."
        forbiddenMessage="You don't have access to invoices."
        notFoundMessage="Invoice not found. It may have been removed or belong to another shop."
        onRetry={() => void refetch()}
        action={<BackToInvoicesLink />}
      />
    )
  }

  const fileTitle = invoiceFileTitle(invoice)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 print:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <BackToInvoicesLink />
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton fileTitle={fileTitle} />
          {invoice.status === 'ISSUED' ? (
            <CancelInvoiceDialog invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} />
          ) : null}
        </div>
      </div>

      {invoice.status === 'CANCELLED' ? (
        <div className="print:hidden">
          <InvoiceCancelledBanner invoice={invoice} />
        </div>
      ) : null}

      <article className="space-y-6 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <InvoiceHeader invoice={invoice} />

        <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">
          <InvoiceParty title="Customer" rows={customerRows(invoice)} />
          <InvoiceParty title="Device" rows={deviceRows(invoice)} />
        </div>

        <section className="space-y-2 print:break-inside-avoid">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Parts
          </h2>
          <InvoicePartsTable items={invoice.items} />
        </section>

        <div className="border-t border-border pt-4 sm:ml-auto sm:max-w-xs print:ml-auto print:max-w-xs print:break-inside-avoid">
          <InvoiceSummary invoice={invoice} />
        </div>

        <InvoicePayments repairId={invoice.repairId} invoiceTotal={invoice.total} />
      </article>
    </div>
  )
}
