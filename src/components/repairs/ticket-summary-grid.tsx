import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function DetailField({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0 space-y-1', className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground wrap-break-word">{children}</div>
    </div>
  )
}

type TicketSummaryGridProps = {
  ticketNumber: string
  statusLabel: string
  customerName: string
  deviceSummary: string
}

/** Compact ticket context shown at the top of repair dialogs. */
export function TicketSummaryGrid({
  ticketNumber,
  statusLabel,
  customerName,
  deviceSummary,
}: TicketSummaryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/20 p-4">
      <DetailField label="Ticket">
        <span className="font-mono font-semibold">#{ticketNumber}</span>
      </DetailField>
      <DetailField label="Status">
        <span className="font-semibold">{statusLabel}</span>
      </DetailField>
      <DetailField label="Customer">{customerName}</DetailField>
      <DetailField label="Device">{deviceSummary}</DetailField>
    </div>
  )
}
