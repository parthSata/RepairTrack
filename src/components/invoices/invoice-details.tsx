'use client'

import Link from 'next/link'
import { ArrowLeft, Package, Receipt } from 'lucide-react'
import { CancelInvoiceDialog } from '@/components/invoices/cancel-invoice-dialog'
import {
  formatInvoiceDate,
  InvoiceCancelledBanner,
  InvoiceStatusBadge,
} from '@/components/invoices/invoice-status'
import { PricingBreakdownRows } from '@/components/repairs/pricing-breakdown-rows'
import { Skeleton } from '@/components/ui/skeleton'
import { TableEmptyState } from '@/components/ui/table-empty-state'
import { useInvoice, type Invoice, type InvoiceItem } from '@/features/invoices/queries'
import { getApiErrorMessage } from '@/lib/api-error'
import { formatRupees } from '@/lib/format-money'

function InvoiceItemRow({ item }: { item: InvoiceItem }) {
  return (
    <li className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p className="text-sm font-medium text-foreground">{item.partName}</p>
      <p className="text-sm tabular-nums text-muted-foreground">
        {item.quantity} × {formatRupees(item.unitPrice)}
        <span className="ml-3 font-semibold text-foreground">
          {formatRupees(item.quantity * item.unitPrice)}
        </span>
      </p>
    </li>
  )
}

function InvoiceSummary({ invoice }: { invoice: Invoice }) {
  return (
    <PricingBreakdownRows
      laborCharges={invoice.laborCharges}
      partsCharges={invoice.partsCharges}
      additionalCharges={invoice.additionalCharges}
      taxPercent={invoice.taxPercent}
      totals={{
        partsCharges: invoice.partsCharges,
        taxableValue: invoice.total - invoice.taxAmount,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
      }}
      totalLabel="Invoice total"
    />
  )
}

export function InvoiceDetails({ invoiceId }: { invoiceId: string }) {
  const { data: invoice, isLoading, isError, error, refetch } = useInvoice(invoiceId)

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !invoice) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
        {getApiErrorMessage(error, 'Failed to load invoice.')}{' '}
        <button type="button" onClick={() => refetch()} className="font-medium underline">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          href={`/repairs/${invoice.repairId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to repair
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Receipt className="h-6 w-6 text-muted-foreground" aria-hidden />
            <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {invoice.invoiceNumber}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          {invoice.status === 'ISSUED' ? (
            <CancelInvoiceDialog invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} />
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Issued {formatInvoiceDate(invoice.createdAt)}
          <span className="mx-2 text-border">·</span>
          Repair{' '}
          <Link
            href={`/repairs/${invoice.repairId}`}
            className="font-mono font-medium text-foreground underline-offset-2 hover:underline"
          >
            #{invoice.ticketNumber}
          </Link>
        </p>
        <p className="text-sm text-muted-foreground">
          Billed to <span className="font-medium text-foreground">{invoice.customer.name}</span>
          <span className="mx-2 text-border">·</span>
          {invoice.customer.phone}
        </p>
      </div>

      {invoice.status === 'CANCELLED' ? <InvoiceCancelledBanner invoice={invoice} /> : null}

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-2 text-base font-semibold text-foreground">Parts</h2>
        {invoice.items.length === 0 ? (
          <TableEmptyState
            icon={Package}
            title="No parts on this invoice"
            description="This repair was billed for labor and additional charges only."
          />
        ) : (
          <ul>
            {invoice.items.map((item) => (
              <InvoiceItemRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">Summary</h2>
        <InvoiceSummary invoice={invoice} />
      </section>
    </div>
  )
}
