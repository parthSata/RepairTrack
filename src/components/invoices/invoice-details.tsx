'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CancelInvoiceDialog } from '@/components/invoices/cancel-invoice-dialog'
import { InvoiceDetailsSkeleton } from '@/components/invoices/invoice-details-skeleton'
import { InvoiceHeader } from '@/components/invoices/invoice-header'
import { customerRows, deviceRows, InvoiceParty } from '@/components/invoices/invoice-party'
import { InvoicePartsTable } from '@/components/invoices/invoice-parts-table'
import { InvoiceCancelledBanner } from '@/components/invoices/invoice-status'
import { InvoiceSummary } from '@/components/invoices/invoice-summary'
import { QueryErrorState } from '@/components/ui/query-error-state'
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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackToInvoicesLink />
        {invoice.status === 'ISSUED' ? (
          <CancelInvoiceDialog invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} />
        ) : null}
      </div>

      {invoice.status === 'CANCELLED' ? <InvoiceCancelledBanner invoice={invoice} /> : null}

      <article className="space-y-6 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-8">
        <InvoiceHeader invoice={invoice} />

        <div className="grid gap-6 md:grid-cols-2">
          <InvoiceParty title="Customer" rows={customerRows(invoice)} />
          <InvoiceParty title="Device" rows={deviceRows(invoice)} />
        </div>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Parts
          </h2>
          <InvoicePartsTable items={invoice.items} />
        </section>

        <div className="border-t border-border pt-4 sm:ml-auto sm:max-w-xs">
          <InvoiceSummary invoice={invoice} />
        </div>
      </article>
    </div>
  )
}
