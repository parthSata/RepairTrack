import { User } from 'lucide-react'
import { ApprovalStatusBanner } from '@/components/repairs/approval-status-badge'
import { Badge } from '@/components/ui/badge'
import type { Repair } from '@/features/repairs/queries'
import { getRepairStatusLabel, getRepairStatusTone } from '@/features/repairs/status-ui'
import { formatDateTime } from '@/lib/format-date'
import { cn } from '@/lib/utils'

type Props = {
  repair: Pick<Repair, 'ticketNumber' | 'priority' | 'status' | 'approval' | 'creator' | 'createdAt'>
}

export function RepairTicketIdentity({ repair }: Props) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Repair ticket
        </p>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground wrap-break-word sm:text-3xl">
          #{repair.ticketNumber}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
            {repair.priority} priority
          </Badge>
          {!repair.approval ? (
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                getRepairStatusTone(repair.status).chip,
              )}
            >
              {getRepairStatusLabel(repair.status)}
            </span>
          ) : null}
        </div>
      </div>

      {repair.approval ? <ApprovalStatusBanner approval={repair.approval} /> : null}

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <User className="h-3.5 w-3.5 shrink-0 opacity-70" />
        <span>
          Created by{' '}
          <span className="font-medium text-foreground/80">
            {repair.creator?.name ?? 'Shop User'}
          </span>
          {repair.creator?.role ? (
            <span className="ml-1.5 rounded border border-border/80 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
              {repair.creator.role}
            </span>
          ) : null}
          <span className="mx-1.5 text-border">·</span>
          {formatDateTime(repair.createdAt)}
        </span>
      </div>
    </div>
  )
}
