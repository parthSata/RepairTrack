'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { Receipt, RotateCcw } from 'lucide-react'
import { PaymentListCard } from '@/components/payments/payment-list-card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header'
import { DebouncedSearchInput } from '@/components/ui/debounced-search-input'
import { Input } from '@/components/ui/input'
import { QueryErrorState } from '@/components/ui/query-error-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableEmptyState } from '@/components/ui/table-empty-state'
import { usePayments, type PaymentListItem } from '@/features/payments/queries'
import {
  PAYMENT_FILTER_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentFilterInput,
  type PaymentFilterMethod,
} from '@/features/payments/schemas'
import { formatDate } from '@/lib/format-date'
import { formatRupees } from '@/lib/format-money'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'

const columns: ColumnDef<PaymentListItem>[] = [
  {
    accessorKey: 'paidAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-muted-foreground">
        {formatDate(row.original.paidAt)}
      </span>
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
    id: 'ticketNumber',
    enableSorting: false,
    header: 'Ticket #',
    cell: ({ row }) => (
      <Link
        href={`/repairs/${row.original.repair.id}`}
        className="font-mono text-sm font-medium text-foreground hover:underline"
      >
        {row.original.repair.ticketNumber}
      </Link>
    ),
  },
  {
    id: 'invoiceNumber',
    enableSorting: false,
    header: 'Invoice #',
    cell: ({ row }) =>
      row.original.invoice ? (
        <Link
          href={`/invoices/${row.original.invoice.id}`}
          className="font-mono text-sm font-medium text-foreground hover:underline"
        >
          {row.original.invoice.invoiceNumber}
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span className="text-sm font-bold tabular-nums text-foreground">
        {formatRupees(row.original.amount)}
      </span>
    ),
  },
  {
    id: 'method',
    enableSorting: false,
    header: 'Method',
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {PAYMENT_METHOD_LABELS[row.original.method]}
      </span>
    ),
  },
  {
    id: 'receivedBy',
    enableSorting: false,
    header: 'Received by',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.receivedByName ?? '—'}</span>
    ),
  },
]

export function PaymentTable() {
  const [filters, setFilters] = React.useState<PaymentFilterInput>({
    search: '',
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    sortOrder: 'desc',
    method: undefined,
    startDate: undefined,
    endDate: undefined,
  })

  const { data, isLoading, isError, error, refetch } = usePayments(filters)

  const handleSearchChange = React.useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }))
  }, [])

  const handleMethodChange = (value: string) => {
    const method = value === 'ALL' ? undefined : (value as PaymentFilterMethod)
    setFilters((prev) => ({ ...prev, method, page: 1 }))
  }

  const handleDateChange = (field: 'startDate' | 'endDate', val: string) => {
    setFilters((prev) => ({ ...prev, [field]: val || undefined, page: 1 }))
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      sortOrder: 'desc',
      method: undefined,
      startDate: undefined,
      endDate: undefined,
    })
  }

  const hasActiveFilters = Boolean(
    filters.search || filters.method || filters.startDate || filters.endDate,
  )

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          <DebouncedSearchInput
            value={filters.search ?? ''}
            onChange={handleSearchChange}
            placeholder="Search by ticket #, customer name or phone…"
            debounceMs={250}
            className="w-full sm:max-w-xs"
          />

          <div className="w-full sm:w-44">
            <Select value={filters.method ?? 'ALL'} onValueChange={handleMethodChange}>
              <SelectTrigger aria-label="Filter by payment method">
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All methods</SelectItem>
                {PAYMENT_FILTER_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              aria-label="Start date"
              value={filters.startDate ?? ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="h-10 w-full sm:w-36 text-xs"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              aria-label="End date"
              value={filters.endDate ?? ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="h-10 w-full sm:w-36 text-xs"
            />
          </div>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-10 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
          ) : null}
        </div>
      </div>

      {/* Filtered Total Banner */}
      {data ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/60 px-4 py-2.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Filtered Total:
            </span>
            <span className="text-base font-bold tabular-nums text-foreground">
              {formatRupees(data.totalAmount)}
            </span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {data.total} {data.total === 1 ? 'payment recorded' : 'payments recorded'}
          </span>
        </div>
      ) : null}

      {/* Error or Table */}
      {isError ? (
        <QueryErrorState
          error={error}
          fallback="Failed to load payments. Please try again."
          forbiddenMessage="You don't have access to payments."
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
          renderMobileCard={(payment) => <PaymentListCard payment={payment} />}
          emptyState={
            hasActiveFilters ? (
              <TableEmptyState
                icon={Receipt}
                title="No payments match your filters."
                description="Try adjusting your search query, payment method, or date range."
              />
            ) : (
              <TableEmptyState
                icon={Receipt}
                title="No payments yet"
                description="Payments recorded for repair tickets will appear here."
              />
            )
          }
        />
      )}
    </div>
  )
}
