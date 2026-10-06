'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { useGmailConnection } from '@/features/gmail/queries'
import { GMAIL_SETTINGS_FROM_REPAIR_URL } from '@/features/gmail/schemas'
import { cn } from '@/lib/utils'

const WARNING_COPY = {
  NOT_CONNECTED: { title: "Gmail isn't connected", action: 'Connect Gmail' },
  NEEDS_RECONNECT: { title: 'Gmail needs reconnecting', action: 'Reconnect Gmail' },
} as const

/**
 * Persistent (not dismissible) until the shop's Gmail is connected. Renders nothing while loading
 * or on error: it is advisory and must never block the page it sits on.
 */
export function GmailStatusWarning({ canConnect, className }: { canConnect: boolean; className?: string }) {
  const { data } = useGmailConnection()
  if (!data || data.status === 'CONNECTED') return null

  const copy = WARNING_COPY[data.status]

  return (
    <div
      role="status"
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/70 p-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-amber-800/70 dark:from-amber-950/50 dark:to-orange-950/30 page-enter',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-4 ring-amber-100/50 dark:bg-amber-900/60 dark:text-amber-300 dark:ring-amber-900/30">
          <AlertTriangle className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{copy.title}</p>
          <p className="text-sm leading-5 text-amber-800/90 dark:text-amber-300/90">
            Email notifications are unavailable.
            {!canConnect && ' Ask the shop owner to connect Gmail.'}
          </p>
        </div>
      </div>

      {canConnect && (
        <Link
          href={GMAIL_SETTINGS_FROM_REPAIR_URL}
          className="group inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-md bg-amber-600 px-3.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-amber-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 active:scale-[0.98] sm:w-auto"
        >
          {copy.action}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}
    </div>
  )
}
