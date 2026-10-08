import { AlertCircle, CheckCircle2, CircleMinus, RotateCw, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  EMAIL_STATUS_UI,
  EMAIL_TYPE_LABELS,
  getEmailReasonLabel,
  type EmailLogStatus,
  type RepairEmailLog,
} from '@/features/emails/schemas'
import { formatDateTime } from '@/lib/format-date'
import { cn } from '@/lib/utils'

const STATUS_TONES: Record<EmailLogStatus, { icon: LucideIcon; iconTone: string; accent: string; reasonTone: string }> = {
  SENT: {
    icon: CheckCircle2,
    iconTone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
    accent: 'from-emerald-400 to-teal-400',
    reasonTone: 'text-muted-foreground',
  },
  FAILED: {
    icon: AlertCircle,
    iconTone: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300',
    accent: 'from-rose-400 to-pink-400',
    reasonTone: 'text-rose-700 dark:text-rose-300',
  },
  SKIPPED: {
    icon: CircleMinus,
    iconTone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
    accent: 'from-amber-400 to-orange-400',
    reasonTone: 'text-amber-700 dark:text-amber-300',
  },
}

type RepairEmailRowProps = {
  email: RepairEmailLog
  /** One resend at a time: every Resend button is disabled while any row is sending. */
  resendingId: string | null
  onResend: (logId: string) => void
}

export function RepairEmailRow({ email, resendingId, onResend }: RepairEmailRowProps) {
  const isResending = resendingId === email.id
  const tone = STATUS_TONES[email.status]
  const StatusIcon = tone.icon
  const status = EMAIL_STATUS_UI[email.status]
  const reason = getEmailReasonLabel(email.reason)

  return (
    <li className="page-enter relative flex items-start gap-3 overflow-hidden rounded-xl border border-border/70 bg-card py-2.5 pl-4 pr-2.5 transition-all duration-200 hover:-translate-y-px hover:border-border hover:shadow-sm">
      <span className={cn('absolute inset-y-0 left-0 w-1 bg-gradient-to-b', tone.accent)} aria-hidden />
      <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', tone.iconTone)}>
        <StatusIcon className="h-3.5 w-3.5" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{EMAIL_TYPE_LABELS[email.type]}</p>
          <Badge variant={status.variant} className="shrink-0">
            {status.label}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground" title={email.recipient ?? undefined}>
          {email.recipient ?? 'No recipient'}
        </p>
        <div className="mt-1 flex min-h-7 items-center justify-between gap-2">
          <p className="min-w-0 text-[11px] leading-4 text-muted-foreground">
            {reason ? <span className={cn('font-medium', tone.reasonTone)}>{reason} · </span> : null}
            <time dateTime={email.createdAt}>{formatDateTime(email.createdAt)}</time>
          </p>
          {email.canResend ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onResend(email.id)}
              disabled={resendingId != null}
              className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-xs active:scale-[0.97]"
            >
              <RotateCw className={cn('h-3 w-3', isResending && 'animate-spin')} aria-hidden />
              {isResending ? 'Sending…' : 'Resend'}
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  )
}
