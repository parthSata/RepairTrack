'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle, Package } from 'lucide-react'
import { useParts, type Part } from '@/features/inventory/queries'
import type { PartFilterInput } from '@/features/inventory/schemas'
import {
  formatStockAlertBanner,
  getPartStockStatus,
  STOCK_STATUS_COPY,
} from '@/features/inventory/stock-status'
import { DataTable } from '@/components/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header'
import { DebouncedSearchInput } from '@/components/ui/debounced-search-input'
import { TableEmptyState } from '@/components/ui/table-empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRupees } from '@/lib/format-money'
import { getApiErrorMessage } from '@/lib/api-error'

function StockStatusBadge({ quantity, minimumStock }: { quantity: number; minimumStock: number }) {
  const status = getPartStockStatus(quantity, minimumStock)
  if (status === 'OK') return null

  return (
    <Badge
      variant={status === 'OUT' ? 'destructive' : 'warning'}
      title={STOCK_STATUS_COPY[status]}
      className="whitespace-nowrap"
    >
      {status === 'OUT' ? 'Out of stock' : 'Low stock'}
    </Badge>
  )
}

export function PartTable() {
  const [filters, setFilters] = React.useState<PartFilterInput>({
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const { data, isLoading, isError, error, refetch } = useParts(filters)

  const columns: ColumnDef<Part>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Part Name" />,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-foreground">{row.original.name}</span>
          <StockStatusBadge
            quantity={row.original.quantity}
            minimumStock={row.original.minimumStock}
          />
        </div>
      ),
    },
    {
      accessorKey: 'sku',
      header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">{row.original.sku}</span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-foreground">{row.original.quantity}</span>
      ),
    },
    {
      accessorKey: 'minimumStock',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Minimum Stock" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.minimumStock}</span>
      ),
    },
    {
      accessorKey: 'purchasePrice',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Purchase Price" />,
      cell: ({ row }) => (
        <span className="text-sm text-foreground">{formatRupees(row.original.purchasePrice)}</span>
      ),
    },
    {
      accessorKey: 'sellingPrice',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Selling Price" />,
      cell: ({ row }) => (
        <span className="text-sm text-foreground">{formatRupees(row.original.sellingPrice)}</span>
      ),
    },
    {
      accessorKey: 'supplier',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier" />,
      cell: ({ row }) => {
        const supplier = row.original.supplier
        return supplier ? (
          <span className="truncate text-sm text-muted-foreground">{supplier}</span>
        ) : (
          <span className="text-xs italic text-muted-foreground/60">—</span>
        )
      },
    },
    {
      id: 'actions',
      header: () => <div className="pr-2 text-right">Actions</div>,
      cell: ({ row }) => {
        const part = row.original
        return (
          <div className="flex items-center justify-end">
            <Link href={`/inventory/${part.id}`}>
              <Button
                variant="ghost"
                className="h-8 px-2 text-xs"
                aria-label={`View ${part.name}`}
              >
                View
              </Button>
            </Link>
          </div>
        )
      },
    },
  ]

  const handleSearchChange = React.useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }))
  }, [])

  const handlePageChange = (pageIndex: number) => {
    setFilters((prev) => ({ ...prev, page: pageIndex + 1 }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setFilters((prev) => ({ ...prev, limit: pageSize, page: 1 }))
  }

  const handleSortingChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sortBy as PartFilterInput['sortBy'],
      sortOrder,
    }))
  }

  const alertBanner =
    data != null
      ? formatStockAlertBanner(data.outOfStockCount, data.lowStockCount)
      : null

  const errorStatus =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined

  const errorFallback =
    errorStatus === 401 || errorStatus === 403
      ? "You don't have access to inventory."
      : 'Failed to load parts. Please try again.'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <DebouncedSearchInput
            value={filters.search ?? ''}
            onChange={handleSearchChange}
            placeholder="Search by name or SKU…"
          />
          {data ? (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {data.total} {data.total === 1 ? 'Part' : 'Parts'}
            </span>
          ) : null}
        </div>
      </div>

      {alertBanner ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{alertBanner}</p>
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
          {getApiErrorMessage(error, errorFallback)}{' '}
          <button type="button" onClick={() => refetch()} className="font-medium underline">
            Retry
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          pageCount={data?.totalPages ?? 1}
          pageIndex={(data?.page ?? 1) - 1}
          pageSize={data?.limit ?? 10}
          totalItems={data?.total ?? 0}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortingChangeManual={handleSortingChange}
          emptyState={
            filters.search ? (
              <TableEmptyState
                icon={Package}
                title="No parts match your search."
                description="Try a different part name or SKU."
              />
            ) : (
              <TableEmptyState
                icon={Package}
                title="No parts yet — add your first part to start tracking inventory."
              />
            )
          }
        />
      )}
    </div>
  )
}
