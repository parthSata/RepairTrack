import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { RepairApproval } from '@/features/repairs/queries'
import { cn } from '@/lib/utils'

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function getApprovalStatusLabel(approval: RepairApproval): string {
  if (approval.status === 'PENDING') {
    const requestedAt = formatDateTime(approval.requestedAt)
    return requestedAt
      ? `Customer Approval — Pending, Requested: ${requestedAt}`
      : 'Customer Approval — Pending'
  }

  if (approval.status === 'APPROVED') {
    const decidedAt = formatDateTime(approval.decidedAt)
    return decidedAt ? `Approved · ${decidedAt}` : 'Approved'
  }

  const decidedAt = formatDateTime(approval.decidedAt)
  const reason = approval.rejectionReason?.trim()
  const base = decidedAt ? `Rejected · ${decidedAt}` : 'Rejected'
  return reason ? `${base} · ${reason}` : base
}

export function getApprovalStatusShortLabel(status: RepairApproval['status']): string {
  if (status === 'PENDING') return 'Approval pending'
  if (status === 'APPROVED') return 'Approved'
  return 'Rejected'
}

export function getApprovalStatusBadgeVariant(
  status: RepairApproval['status'],
): 'warning' | 'success' | 'destructive' {
  if (status === 'PENDING') return 'warning'
  if (status === 'APPROVED') return 'success'
  return 'destructive'
}

export function getApprovalStatusEmoji(status: RepairApproval['status']): string {
  if (status === 'PENDING') return '🟡'
  if (status === 'APPROVED') return '🟢'
  return '🔴'
}

export function ApprovalStatusBadge({ approval }: { approval: RepairApproval }) {
  const variant = getApprovalStatusBadgeVariant(approval.status)
  const label = getApprovalStatusShortLabel(approval.status)

  return (
    <Badge variant={variant} className="rounded-md font-medium text-xs">
      {label}
    </Badge>
  )
}

export function ApprovalStatusBanner({
  approval,
  className,
}: {
  approval: RepairApproval
  className?: string
}) {
  const title = getApprovalStatusShortLabel(approval.status)

  let subtitle = ''
  if (approval.status === 'PENDING') {
    const requestedAt = formatDateTime(approval.requestedAt)
    subtitle = requestedAt ? `Requested ${requestedAt}` : 'Waiting for customer response'
  } else if (approval.status === 'APPROVED') {
    const decidedAt = formatDateTime(approval.decidedAt)
    subtitle = decidedAt ? `Approved ${decidedAt}` : 'Customer approved this estimate'
  } else {
    const decidedAt = formatDateTime(approval.decidedAt)
    const reason = approval.rejectionReason?.trim()
    subtitle = reason
      ? `${decidedAt ? `Rejected ${decidedAt} · ` : ''}${reason}`
      : decidedAt
        ? `Rejected ${decidedAt}`
        : 'Customer rejected this estimate'
  }

  const toneClasses =
    approval.status === 'PENDING'
      ? 'border-amber-300/70 bg-amber-50/80 text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100'
      : approval.status === 'APPROVED'
        ? 'border-emerald-300/70 bg-emerald-50/80 text-emerald-950 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-100'
        : 'border-destructive/30 bg-destructive/5 text-destructive dark:bg-destructive/10'

  const iconClasses =
    approval.status === 'PENDING'
      ? 'text-amber-600 dark:text-amber-400'
      : approval.status === 'APPROVED'
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-destructive'

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border-l-4 px-4 py-3',
        toneClasses,
        className,
      )}
      role="status"
    >
      {approval.status === 'PENDING' ? (
        <Clock3 className={cn('mt-0.5 h-4 w-4 shrink-0', iconClasses)} aria-hidden />
      ) : approval.status === 'APPROVED' ? (
        <CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', iconClasses)} aria-hidden />
      ) : (
        <XCircle className={cn('mt-0.5 h-4 w-4 shrink-0', iconClasses)} aria-hidden />
      )}
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs leading-relaxed opacity-90">{subtitle}</p>
      </div>
    </div>
  )
}
