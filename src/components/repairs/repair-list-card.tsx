import Link from 'next/link'
import { Eye, Flame, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Repair } from '@/features/repairs/queries'

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

interface RepairListCardProps {
  repair: Repair
  formatStatusLabel: (status: string) => string
  formatPriorityLabel: (priority: string) => string
  getStatusBadgeConfig: (status: string) => { badgeClass: string; dotClass: string }
  getPriorityBadgeClass: (priority: string) => string
}

export function RepairListCard({
  repair,
  formatStatusLabel,
  formatPriorityLabel,
  getStatusBadgeConfig,
  getPriorityBadgeClass,
}: RepairListCardProps) {
  const { badgeClass, dotClass } = getStatusBadgeConfig(repair.status)
  const priorityClass = getPriorityBadgeClass(repair.priority)

  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link
            href={`/repairs/${repair.id}`}
            className="font-mono text-sm font-bold text-primary hover:underline"
          >
            #{repair.ticketNumber}
          </Link>
          <p className="font-semibold text-foreground truncate">{repair.customer.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{repair.customer.phone}</p>
        </div>
        <Link href={`/repairs/${repair.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-1.5 text-xs"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
        </Link>
      </div>

      <div className="text-sm">
        <p className="font-medium text-foreground">
          {repair.device.brand} {repair.device.model ?? ''}
        </p>
        <p className="text-xs text-muted-foreground uppercase mt-0.5">{repair.device.deviceType}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {formatStatusLabel(repair.status)}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${priorityClass}`}
        >
          {repair.priority === 'URGENT' && <Flame className="h-3 w-3 text-red-600 dark:text-red-400" />}
          {formatPriorityLabel(repair.priority)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60 text-xs">
        <div>
          <p className="text-muted-foreground">Technician</p>
          <p className="font-medium text-foreground flex items-center gap-1 mt-0.5">
            {repair.assignedTechnician ? (
              <>
                <User className="h-3 w-3 text-muted-foreground" />
                {repair.assignedTechnician.name}
              </>
            ) : (
              <span className="italic text-muted-foreground">Unassigned</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Expected</p>
          <p className="font-medium text-foreground mt-0.5">
            {formatDate(repair.expectedCompletionDate)}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">Created</p>
          <p className="font-medium text-foreground mt-0.5">{formatDate(repair.createdAt)}</p>
        </div>
      </div>
    </div>
  )
}
