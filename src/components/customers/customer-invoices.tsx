'use client'

import * as React from 'react'
import { Receipt } from 'lucide-react'
import { InvoiceListCard } from '@/components/invoices/invoice-list-card'
import { QueryErrorState } from '@/components/ui/query-error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { TableEmptyState } from '@/components/ui/table-empty-state'
import { useInvoices } from '@/features/invoices/queries'
import type { InvoiceFilterInput } from '@/features/invoices/schemas'

const CUSTOMER_INVOICE_LIMIT = 20

export function CustomerInvoices({ customerId }: { customerId: string }) {
  const filters = React.useMemo<InvoiceFilterInput>(
    () => ({
      customerId,
      page: 1,
      limit: CUSTOMER_INVOICE_LIMIT,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    [customerId],
  )
  const { data, isPending, isError, error, refetch } = useInvoices(filters)

  if (isPending) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <QueryErrorState
        error={error}
        fallback="Failed to load invoices."
        forbiddenMessage="You don't have access to invoices."
        onRetry={() => void refetch()}
      />
    )
  }

  if (data.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border">
        <TableEmptyState
          icon={Receipt}
          title="No invoices for this customer yet"
          description="Invoices appear here once a repair's final bill is invoiced."
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {data.items.map((invoice) => (
          <InvoiceListCard key={invoice.id} invoice={invoice} />
        ))}
      </div>
      {data.total > data.items.length ? (
        <p className="text-xs text-muted-foreground">
          Showing latest {data.items.length} of {data.total} invoices.
        </p>
      ) : null}
    </div>
  )
}
