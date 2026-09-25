'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import {
  AlertTriangle,
  History,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
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
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PartDeleteDialog } from '@/components/inventory/part-delete-dialog'
import { PartForm } from '@/components/inventory/part-form'
import { formatRupees } from '@/lib/format-money'
import { getApiErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'

function StockStatusBadge({ quantity, stockAlert }: { quantity: number; stockAlert: number }) {
  const status = getPartStockStatus(quantity, stockAlert)
  const variant =
    status === 'OUT' ? 'destructive' : status === 'LOW' ? 'warning' : 'success'

  return (
    <Badge variant={variant} className="whitespace-nowrap">
      {STOCK_STATUS_COPY[status]}
    </Badge>
  )
}

function PartRowActions({
  part,
  onManage,
  onDelete,
}: {
  part: Part
  onManage: (part: Part) => void
  onDelete: (part: Part) => void
}) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label={`Actions for ${part.name}`}
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
          onClick={() => {
            setOpen(false)
            onManage(part)
          }}
        >
          <Pencil className="h-4 w-4 text-muted-foreground" aria-hidden />
          Manage Part
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
          onClick={() => {
            setOpen(false)
            router.push(`/inventory/${part.id}`)
          }}
        >
          <History className="h-4 w-4 text-muted-foreground" aria-hidden />
          Stock History
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive hover:bg-destructive/10"
          onClick={() => {
            setOpen(false)
            onDelete(part)
          }}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Delete
        </button>
      </PopoverContent>
    </Popover>
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
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createPending, setCreatePending] = React.useState(false)
  const [managePart, setManagePart] = React.useState<Part | null>(null)
  const [managePending, setManagePending] = React.useState(false)
  const [deletePart, setDeletePart] = React.useState<Part | null>(null)

  const { data, isLoading, isError, error, refetch } = useParts(filters)

  const columns: ColumnDef<Part>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Part" />,
      cell: ({ row }) => (
        <Link
          href={`/inventory/${row.original.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {row.original.name}
        </Link>
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {row.original.quantity}
          </span>
          <StockStatusBadge
            quantity={row.original.quantity}
            stockAlert={row.original.stockAlert}
          />
        </div>
      ),
    },
    {
      accessorKey: 'stockAlert',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Min" />,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.original.stockAlert === 0 ? (
            <span className="text-muted-foreground/60" title="Alert disabled">
              —
            </span>
          ) : (
            row.original.stockAlert
          )}
        </span>
      ),
    },
    {
      accessorKey: 'purchasePrice',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Purchase" />,
      cell: ({ row }) => (
        <span className="text-sm text-foreground">{formatRupees(row.original.purchasePrice)}</span>
      ),
    },
    {
      accessorKey: 'sellingPrice',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Selling" />,
      cell: ({ row }) => (
        <span className="text-sm text-foreground">{formatRupees(row.original.sellingPrice)}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="pr-2 text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <PartRowActions
            part={row.original}
            onManage={setManagePart}
            onDelete={setDeletePart}
          />
        </div>
      ),
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
        <Button
          variant="accent"
          className="shrink-0 gap-2"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Part
        </Button>
      </div>

      {alertBanner ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-300/90 bg-amber-50/90 px-4 py-3 text-sm font-medium text-amber-950 shadow-xs dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <p className="leading-relaxed text-amber-900 dark:text-amber-200">{alertBanner}</p>
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
              >
                <Button
                  variant="accent"
                  className={cn('mt-4 gap-2')}
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add First Part
                </Button>
              </TableEmptyState>
            )
          }
        />
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (createPending && !open) return
          setCreateOpen(open)
        }}
        preventDismiss={createPending}
      >
        <DialogHeader>
          <DialogTitle>Add Part</DialogTitle>
        </DialogHeader>
        <PartForm
          mode="create"
          onPendingChange={setCreatePending}
          onSuccess={() => {
            setCreatePending(false)
            setCreateOpen(false)
          }}
          onCancel={() => {
            if (!createPending) setCreateOpen(false)
          }}
        />
      </Dialog>

      <Dialog
        open={Boolean(managePart)}
        onOpenChange={(open) => {
          if (managePending && !open) return
          if (!open) setManagePart(null)
        }}
        preventDismiss={managePending}
      >
        <DialogHeader>
          <DialogTitle>Manage Part</DialogTitle>
        </DialogHeader>
        {managePart ? (
          <PartForm
            key={managePart.id}
            mode="edit"
            partId={managePart.id}
            initialData={{
              name: managePart.name,
              sku: managePart.sku,
              quantity: managePart.quantity,
              stockAlert: managePart.stockAlert,
              purchasePrice: managePart.purchasePrice,
              sellingPrice: managePart.sellingPrice,
              supplier: managePart.supplier ?? '',
            }}
            onPendingChange={setManagePending}
            onStockAdjusted={(updated) => {
              setManagePart((prev) => (prev ? { ...prev, ...updated } : prev))
            }}
            onSuccess={(updated) => {
              setManagePending(false)
              if (updated) {
                setManagePart((prev) => (prev ? { ...prev, ...updated } : prev))
              }
            }}
            onCancel={() => {
              if (!managePending) setManagePart(null)
            }}
          />
        ) : null}
      </Dialog>

      <PartDeleteDialog
        open={Boolean(deletePart)}
        onOpenChange={(open) => {
          if (!open) setDeletePart(null)
        }}
        part={deletePart}
      />
    </div>
  )
}
