import { Badge } from '@/components/ui/badge'
import type { RepairApproval } from '@/features/repairs/queries'

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
  const label = getApprovalStatusLabel(approval)
  const emoji = getApprovalStatusEmoji(approval.status)

  return (
    <Badge variant={variant} className="font-medium text-xs gap-1">
      <span aria-hidden>{emoji}</span>
      {label}
    </Badge>
  )
}
