'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { IndianRupee, Receipt } from 'lucide-react'
import { PendingPaymentCard } from '@/components/payments/pending-payment-card'
import { RecordPaymentDialog } from '@/components/repairs/record-payment-dialog'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header'
import { QueryErrorState } from '@/components/ui/query-error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { TableEmptyState } from '@/components/ui/table-empty-state'
import {
  usePendingPayments,
  type PendingPaymentItem,
} from '@/features/payments/queries'
import {
  getRepairStatusIcon,
  getRepairStatusLabel,
  getRepairStatusTone,
} from '@/features/repairs/status-ui'
import { formatRupees } from '@/lib/format-money'

export function PendingPaymentsTable() {
  const { data, isLoading, isError, error, refetch } = usePendingPayments()
  const [selectedRepair, setSelectedRepair] = React.useState<PendingPaymentItem | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const handleRecordPayment = React.useCallback((item: PendingPaymentItem) => {
    setSelectedRepair(item)
    setDialogOpen(true)
  }, [])

  const columns = React.useMemo<ColumnDef<PendingPaymentItem>[]>(
    () => [
      {
        accessorKey: 'ticketNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Ticket #" />,
        cell: ({ row }) => (
          <Link
            href={`/repairs/${row.original.repairId}`}
            className="font-mono text-sm font-medium text-foreground hover:underline"
          >
            {row.original.ticketNumber}
          </Link>
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
        id: 'status',
        enableSorting: false,
        header: 'Status',
        cell: ({ row }) => {
          const tone = getRepairStatusTone(row.original.status)
          const IconComponent = getRepairStatusIcon(row.original.status)
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone.chip}`}
            >
              {React.createElement(IconComponent, { className: 'h-3 w-3' })}
              {getRepairStatusLabel(row.original.status)}
            </span>
          )
        },
      },
      {
        accessorKey: 'billTotal',
        header: 'Bill Total',
        cell: ({ row }) => (
          <span className="text-sm font-medium tabular-nums text-foreground">
            {formatRupees(row.original.billTotal)}
          </span>
        ),
      },
      {
        accessorKey: 'balance',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Balance" />,
        cell: ({ row }) => (
          <span className="text-sm font-bold tabular-nums text-foreground">
            {formatRupees(row.original.balance)}
          </span>
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Action
          </span>
        ),
        cell: ({ row }) => (
          <Button
            size="sm"
            onClick={() => handleRecordPayment(row.original)}
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all duration-300 ease-out hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/25 hover:scale-[1.03] active:scale-[0.97]"
          >
            <IndianRupee className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
            <span>Record Payment</span>
          </Button>
        ),
      },
    ],
    [handleRecordPayment],
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <QueryErrorState
        error={error}
        fallback="Failed to load pending payments. Please try again."
        forbiddenMessage="You don't have access to pending payments."
        onRetry={() => void refetch()}
      />
    )
  }

  const items = data?.items ?? []

  return (
    <div className="space-y-4">
      {/* Total Outstanding Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/60 px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Outstanding:
          </span>
          <span className="text-lg font-bold tabular-nums text-foreground">
            {formatRupees(data?.totalOutstanding ?? 0)}
          </span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {items.length} {items.length === 1 ? 'repair pending payment' : 'repairs pending payment'}
        </span>
      </div>

      {items.length === 0 ? (
        <TableEmptyState
          icon={Receipt}
          title="No pending payments"
          description="All active repairs are fully settled or have no outstanding balance."
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={items}
              isLoading={false}
              pageCount={1}
              pageIndex={0}
              pageSize={items.length}
              totalItems={items.length}
            />
          </div>

          {/* Mobile Card View (375px+) */}
          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <PendingPaymentCard
                key={item.repairId}
                item={item}
                onRecordPayment={handleRecordPayment}
              />
            ))}
          </div>
        </>
      )}

      {selectedRepair ? (
        <RecordPaymentDialog
          repairId={selectedRepair.repairId}
          ticketNumber={selectedRepair.ticketNumber}
          customerName={selectedRepair.customer.name}
          balance={selectedRepair.balance}
          upi={data?.upi ?? null}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setSelectedRepair(null)
          }}
        />
      ) : null}
    </div>
  )
}
