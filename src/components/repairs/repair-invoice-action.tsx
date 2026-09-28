'use client'

import Link from 'next/link'
import { FileText, Loader2, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCreateInvoice } from '@/features/invoices/mutations'
import { invoiceHref } from '@/features/invoices/queries'
import { isFinalBillConfirmed } from '@/features/repairs/pricing-rules'
import type { RepairInvoiceSummary } from '@/features/repairs/queries'

const INVOICE_ROLES = new Set(['OWNER', 'STAFF'])

type RepairInvoiceActionProps = {
  repairId: string
  userRole: string
  finalTotal: number | null
  invoices: RepairInvoiceSummary[]
}

function getDescription(issued: RepairInvoiceSummary | null, hasCancelled: boolean): string {
  if (issued) {
    return `Invoice ${issued.invoiceNumber} is issued. Charges and parts are locked — cancel the invoice to change them.`
  }
  if (hasCancelled) return 'The previous invoice was cancelled. Generate a new invoice for the current bill.'
  return 'The bill is finalized. Generate the invoice for this repair.'
}

function GenerateInvoiceButton({ repairId, label }: { repairId: string; label: string }) {
  const createInvoice = useCreateInvoice(repairId)
  const isPending = createInvoice.isPending

  return (
    <Button
      size="sm"
      onClick={() => createInvoice.mutate()}
      disabled={isPending}
      aria-busy={isPending}
      className="w-full gap-1.5 sm:w-auto"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        <Receipt className="h-3.5 w-3.5" aria-hidden />
      )}
      {isPending ? 'Generating…' : label}
    </Button>
  )
}

export function RepairInvoiceAction({
  repairId,
  userRole,
  finalTotal,
  invoices,
}: RepairInvoiceActionProps) {
  const issued = invoices.find((invoice) => invoice.status === 'ISSUED') ?? null
  const cancelled = invoices.filter((invoice) => invoice.status === 'CANCELLED')
  const canGenerate = !issued && isFinalBillConfirmed(finalTotal)

  if (!INVOICE_ROLES.has(userRole) || (!issued && !canGenerate && cancelled.length === 0)) {
    return null
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Receipt className="h-4 w-4 text-steel" aria-hidden />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground">Invoice</h3>
              <p className="text-xs text-muted-foreground">
                {getDescription(issued, cancelled.length > 0)}
              </p>
            </div>
          </div>

          {issued ? (
            <Link href={invoiceHref(issued.id)} className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto">
                <FileText className="h-3.5 w-3.5" aria-hidden />
                View Invoice
              </Button>
            </Link>
          ) : canGenerate ? (
            <GenerateInvoiceButton
              repairId={repairId}
              label={cancelled.length > 0 ? 'Generate New Invoice' : 'Generate Invoice'}
            />
          ) : null}
        </div>

        {cancelled.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Cancelled:{' '}
            {cancelled.map((invoice, index) => (
              <span key={invoice.id}>
                {index > 0 ? ', ' : null}
                <Link
                  href={invoiceHref(invoice.id)}
                  className="font-mono text-foreground underline-offset-2 hover:underline"
                >
                  {invoice.invoiceNumber}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
