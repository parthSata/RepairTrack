'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Receipt } from 'lucide-react'
import { InvoiceListCard } from '@/components/invoices/invoice-list-card'
import { formatInvoiceDate, InvoiceStatusBadge } from '@/components/invoices/invoice-status'
import { DataTable } from '@/components/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header'
import { DebouncedSearchInput } from '@/components/ui/debounced-search-input'
import { QueryErrorState } from '@/components/ui/query-error-state'
import { TableEmptyState } from '@/components/ui/table-empty-state'
import { invoiceHref, useInvoices, type InvoiceListItem } from '@/features/invoices/queries'
import {
  INVOICE_SORT_FIELDS,
  type InvoiceFilterInput,
  type InvoiceSortField,
} from '@/features/invoices/schemas'
import { formatDeviceLabel } from '@/lib/format-device'
import { formatRupees } from '@/lib/format-money'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'

const columns: ColumnDef<InvoiceListItem>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice #" />,
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={invoiceHref(row.original.id)}
          className="font-mono text-sm font-medium text-foreground hover:underline"
        >
          {row.original.invoiceNumber}
        </Link>
        <InvoiceStatusBadge status={row.original.status} />
      </div>
    ),
  },
  {
    id: 'customer',
    enableSorting: false,
    header: 'Customer',
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{row.original.customer.name}</p>
        <p className="text-xs text-muted-foreground">{row.original.customer.phone}</p>
      </div>
    ),
  },
  {
    id: 'device',
    enableSorting: false,
    header: 'Device',
    cell: ({ row }) => (
      <span className="text-sm text-foreground">{formatDeviceLabel(row.original.device)}</span>
    ),
  },
  {
    accessorKey: 'total',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
    cell: ({ row }) => (
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {formatRupees(row.original.total)}
      </span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-muted-foreground">
        {formatInvoiceDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: 'view',
    enableSorting: false,
    header: () => <div className="pr-2 text-right">View</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Link
          href={invoiceHref(row.original.id)}
          aria-label={`View invoice ${row.original.invoiceNumber}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Eye className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    ),
  },
]

function isInvoiceSortField(value: string): value is InvoiceSortField {
  return (INVOICE_SORT_FIELDS as readonly string[]).includes(value)
}

export function InvoiceTable() {
  const [filters, setFilters] = React.useState<InvoiceFilterInput>({
    search: '',
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const { data, isLoading, isError, error, refetch } = useInvoices(filters)

  const handleSearchChange = React.useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }))
  }, [])

  const handleSortingChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    if (!isInvoiceSortField(sortBy)) return
    setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <DebouncedSearchInput
          value={filters.search ?? ''}
          onChange={handleSearchChange}
          placeholder="Search by invoice #, customer name or phone…"
        />
        {data ? (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {data.total} {data.total === 1 ? 'Invoice' : 'Invoices'}
          </span>
        ) : null}
      </div>

      {isError ? (
        <QueryErrorState
          error={error}
          fallback="Failed to load invoices. Please try again."
          forbiddenMessage="You don't have access to invoices."
          onRetry={() => void refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          pageCount={data?.totalPages ?? 1}
          pageIndex={(data?.page ?? filters.page) - 1}
          pageSize={data?.limit ?? filters.limit}
          totalItems={data?.total ?? 0}
          onPageChange={(pageIndex) => setFilters((prev) => ({ ...prev, page: pageIndex + 1 }))}
          onPageSizeChange={(limit) => setFilters((prev) => ({ ...prev, limit, page: 1 }))}
          onSortingChangeManual={handleSortingChange}
          renderMobileCard={(invoice) => <InvoiceListCard invoice={invoice} />}
          emptyState={
            filters.search ? (
              <TableEmptyState
                icon={Receipt}
                title="No invoices match your search."
                description="Try a different invoice number, customer name or phone."
              />
            ) : (
              <TableEmptyState
                icon={Receipt}
                title="No invoices yet"
                description="Open a repair with a finalized bill and click Generate Invoice."
              />
            )
          }
        />
      )}
    </div>
  )
}
