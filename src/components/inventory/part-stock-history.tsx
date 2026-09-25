'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, History, Package } from 'lucide-react'
import {
  usePart,
  useStockMovements,
  type StockMovement,
} from '@/features/inventory/queries'
import { STOCK_REASON_LABELS } from '@/features/inventory/schemas'
import {
  getPartStockStatus,
  STOCK_STATUS_COPY,
} from '@/features/inventory/stock-status'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PartForm } from '@/components/inventory/part-form'
import { TableEmptyState } from '@/components/ui/table-empty-state'
import { getApiErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'

function formatMovementDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function MovementRow({ movement }: { movement: StockMovement }) {
  const isIn = movement.delta > 0
  return (
    <li className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-foreground">
          {STOCK_REASON_LABELS[movement.reason] ?? movement.reason}
        </p>
        <p className="text-xs text-muted-foreground">{formatMovementDate(movement.createdAt)}</p>
        {movement.ticketNumber ? (
          <p className="text-xs text-muted-foreground">
            Repair ticket{' '}
            <Link
              href={`/repairs/${movement.repairId}`}
              className="font-mono font-medium text-foreground underline-offset-2 hover:underline"
            >
              #{movement.ticketNumber}
            </Link>
          </p>
        ) : null}
        {movement.note ? (
          <p className="text-xs text-muted-foreground">{movement.note}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-sm">
        <span
          className={cn(
            'font-semibold tabular-nums',
            isIn ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300',
          )}
        >
          {isIn ? '+' : ''}
          {movement.delta}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="font-medium tabular-nums text-foreground">{movement.quantityAfter}</span>
      </div>
    </li>
  )
}

export function PartStockHistory({ partId }: { partId: string }) {
  const [manageOpen, setManageOpen] = React.useState(false)
  const [managePending, setManagePending] = React.useState(false)
  const [page, setPage] = React.useState(1)

  const {
    data: part,
    isLoading: partLoading,
    isError: partError,
    error: partErr,
    refetch: refetchPart,
  } = usePart(partId)

  const {
    data: movements,
    isLoading: movementsLoading,
    isError: movementsError,
    error: movementsErr,
    refetch: refetchMovements,
  } = useStockMovements(partId, { page, limit: 20 })

  if (partLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (partError || !part) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
        {getApiErrorMessage(partErr, 'Failed to load part.')}{' '}
        <button type="button" onClick={() => refetchPart()} className="font-medium underline">
          Retry
        </button>
      </div>
    )
  }

  const status = getPartStockStatus(part.quantity, part.stockAlert)
  const badgeVariant =
    status === 'OUT' ? 'destructive' : status === 'LOW' ? 'warning' : 'success'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/inventory"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to inventory
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{part.name}</h1>
            <Badge variant={badgeVariant}>{STOCK_STATUS_COPY[status]}</Badge>
          </div>
          <p className="font-mono text-sm text-muted-foreground">{part.sku}</p>
          <p className="text-sm text-muted-foreground">
            Current stock:{' '}
            <span className="font-semibold tabular-nums text-foreground">{part.quantity}</span>
            <span className="mx-2 text-border">·</span>
            Min alert:{' '}
            <span className="font-semibold tabular-nums text-foreground">{part.stockAlert}</span>
          </p>
        </div>
        <Button variant="accent" onClick={() => setManageOpen(true)}>
          Manage Part
        </Button>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" aria-hidden />
          <h2 className="text-base font-semibold text-foreground">Stock History</h2>
        </div>

        {movementsLoading ? (
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
          </div>
        ) : movementsError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
            {getApiErrorMessage(movementsErr, 'Failed to load stock history.')}{' '}
            <button
              type="button"
              onClick={() => refetchMovements()}
              className="font-medium underline"
            >
              Retry
            </button>
          </div>
        ) : !movements?.items.length ? (
          <TableEmptyState
            icon={Package}
            title="No stock movements yet."
            description="Add or remove stock from Manage Part, or use parts on a repair."
          />
        ) : (
          <>
            <ul className="divide-y-0">
              {movements.items.map((m) => (
                <MovementRow key={m.id} movement={m} />
              ))}
            </ul>
            {movements.totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Page {movements.page} of {movements.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= movements.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <Dialog
        open={manageOpen}
        onOpenChange={(open) => {
          if (managePending && !open) return
          setManageOpen(open)
        }}
        preventDismiss={managePending}
      >
        <DialogHeader>
          <DialogTitle>Manage Part</DialogTitle>
        </DialogHeader>
        <PartForm
          key={part.id}
          mode="edit"
          partId={part.id}
          initialTab="stock"
          initialData={{
            name: part.name,
            sku: part.sku,
            quantity: part.quantity,
            stockAlert: part.stockAlert,
            purchasePrice: part.purchasePrice,
            sellingPrice: part.sellingPrice,
            supplier: part.supplier,
          }}
          onPendingChange={setManagePending}
          onSuccess={() => {
            setManagePending(false)
            void refetchPart()
            void refetchMovements()
          }}
          onCancel={() => {
            if (!managePending) setManageOpen(false)
          }}
        />
      </Dialog>
    </div>
  )
}
