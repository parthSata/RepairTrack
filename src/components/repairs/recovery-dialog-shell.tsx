'use client'

import * as React from 'react'
import { Check, RefreshCw, type LucideIcon } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TicketSummaryGrid } from '@/components/repairs/ticket-summary-grid'
import { cn } from '@/lib/utils'

export type RecoveryDialogTone = 'amber' | 'warning'

const TONE_STYLES: Record<
  RecoveryDialogTone,
  { badge: string; icon: string; primaryButton: string }
> = {
  amber: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    icon: 'text-amber-700 dark:text-amber-400',
    primaryButton:
      'bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500/40 disabled:bg-amber-600/60',
  },
  warning: {
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200',
    icon: 'text-amber-800 dark:text-amber-300',
    primaryButton:
      'border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/70',
  },
}

type RecoveryDialogShellProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tone?: RecoveryDialogTone
  icon?: LucideIcon
  title: string
  description: string
  ticketNumber: string
  statusLabel: string
  customerName: string
  deviceSummary: string
  children: React.ReactNode
  footer: React.ReactNode
}

/** Shared frosted recovery dialog chrome for reopen/restore Cases A–C. */
export function RecoveryDialogShell({
  open,
  onOpenChange,
  tone = 'amber',
  icon: Icon = RefreshCw,
  title,
  description,
  ticketNumber,
  statusLabel,
  customerName,
  deviceSummary,
  children,
  footer,
}: RecoveryDialogShellProps) {
  const styles = TONE_STYLES[tone]

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      overlayClassName="bg-black/60 backdrop-blur-md sm:backdrop-blur-xl"
      contentClassName={cn(
        'max-w-xl border-border/80 bg-background/95 p-6 shadow-2xl backdrop-blur-xl',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200',
        'sm:p-8',
      )}
    >
      <AlertDialogHeader className="mb-5 space-y-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
              styles.badge,
            )}
          >
            <Icon className={cn('h-5 w-5', styles.icon)} aria-hidden />
          </span>
          <div className="min-w-0 space-y-1.5">
            <AlertDialogTitle className="text-xl tracking-tight">{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed sm:text-[15px]">
              {description}
            </AlertDialogDescription>
          </div>
        </div>
        <TicketSummaryGrid
          ticketNumber={ticketNumber}
          statusLabel={statusLabel}
          customerName={customerName}
          deviceSummary={deviceSummary}
        />
      </AlertDialogHeader>

      <div className="space-y-5">{children}</div>

      <AlertDialogFooter className="mt-7 gap-2 sm:gap-2">{footer}</AlertDialogFooter>
    </AlertDialog>
  )
}

export function RecoveryWhatWillHappen({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/40 p-4 backdrop-blur-sm">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        What will happen?
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RecoveryMoneyBand({
  paidLabel,
  balanceLabel,
}: {
  paidLabel: string
  balanceLabel: string
}) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-amber-800/80 dark:text-amber-300/80">
          Paid
        </p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums text-amber-950 dark:text-amber-100">
          {paidLabel}
        </p>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-amber-800/80 dark:text-amber-300/80">
          Balance
        </p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums text-amber-950 dark:text-amber-100">
          {balanceLabel}
        </p>
      </div>
    </div>
  )
}
