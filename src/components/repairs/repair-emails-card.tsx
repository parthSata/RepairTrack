'use client'

import { Inbox, Mail } from 'lucide-react'
import { GmailStatusWarning } from '@/components/email/gmail-status-warning'
import { Card, CardContent } from '@/components/ui/card'
import { QueryErrorState } from '@/components/ui/query-error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useRepairEmails } from '@/features/emails/queries'
import { EMAILS_PAGE_SIZE, RepairEmailsList } from './repair-emails-list'

const EMAIL_ROLES = new Set(['OWNER', 'STAFF'])

function RepairEmailsSkeleton() {
  return (
    <ul className="space-y-2" aria-busy="true" aria-label="Loading emails">
      {Array.from({ length: EMAILS_PAGE_SIZE }, (_, index) => (
        <li key={index} className="flex items-start gap-3 rounded-xl border border-border/70 py-2.5 pl-4 pr-2.5">
          <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function RepairEmailsEmpty() {
  return (
    <div className="page-enter flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/80 bg-gradient-to-b from-muted/30 to-transparent px-4 py-8 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 text-indigo-600 ring-4 ring-indigo-50 dark:from-sky-950 dark:to-indigo-950 dark:text-indigo-300 dark:ring-indigo-950/40">
        <Inbox className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-foreground">No emails sent yet</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Customer emails for this repair (received, status updates, invoice, payment) will appear here.
      </p>
    </div>
  )
}

type RepairEmailsCardProps = {
  repairId: string
  userRole: string
}

export function RepairEmailsCard({ repairId, userRole }: RepairEmailsCardProps) {
  const canView = EMAIL_ROLES.has(userRole)
  const { data, isPending, isError, error, refetch } = useRepairEmails(canView ? repairId : '')

  if (!canView) return null

  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-950 dark:to-indigo-950">
            <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-300" aria-hidden />
          </div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">Emails</h3>
          {data && data.length > 0 ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {data.length}
            </span>
          ) : null}
        </div>

        {userRole === 'OWNER' ? <GmailStatusWarning canConnect /> : null}

        {isPending ? (
          <RepairEmailsSkeleton />
        ) : isError ? (
          <QueryErrorState
            error={error}
            fallback="Failed to load emails."
            forbiddenMessage="You don't have access to repair emails."
            onRetry={() => void refetch()}
          />
        ) : data.length === 0 ? (
          <RepairEmailsEmpty />
        ) : (
          <RepairEmailsList repairId={repairId} emails={data} />
        )}
      </CardContent>
    </Card>
  )
}
