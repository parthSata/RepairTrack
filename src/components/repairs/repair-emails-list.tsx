'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useResendRepairEmail } from '@/features/emails/mutations'
import type { RepairEmailLog } from '@/features/emails/schemas'
import { cn } from '@/lib/utils'
import { RepairEmailRow } from './repair-email-row'

export const EMAILS_PAGE_SIZE = 3
/** Above this many pages the dots would crowd a 375px card, so the pager shows "x / y" instead. */
const MAX_PAGE_DOTS = 5

type EmailsPagerProps = {
  page: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
}

function EmailsPager({ page, pageCount, total, onPageChange }: EmailsPagerProps) {
  const first = page * EMAILS_PAGE_SIZE + 1
  const last = Math.min(first + EMAILS_PAGE_SIZE - 1, total)

  return (
    <nav aria-label="Email pages" className="flex items-center justify-between gap-2 pt-1">
      <p className="text-xs tabular-nums text-muted-foreground">
        <span className="font-medium text-foreground">
          {first}–{last}
        </span>{' '}
        of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          aria-label="Newer emails"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>
        {pageCount <= MAX_PAGE_DOTS ? (
          Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onPageChange(index)}
              aria-label={`Page ${index + 1}`}
              aria-current={index === page ? 'page' : undefined}
              className="flex h-8 items-center px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
            >
              <span
                className={cn(
                  'block h-1.5 rounded-full transition-all duration-300',
                  index === page
                    ? 'w-5 bg-gradient-to-r from-sky-500 to-indigo-500'
                    : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60',
                )}
              />
            </button>
          ))
        ) : (
          <span className="px-1.5 text-xs font-medium tabular-nums text-muted-foreground">
            {page + 1} / {pageCount}
          </span>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount - 1}
          aria-label="Older emails"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </nav>
  )
}

export function RepairEmailsList({ repairId, emails }: { repairId: string; emails: RepairEmailLog[] }) {
  const [page, setPage] = React.useState(0)
  const resend = useResendRepairEmail(repairId)

  const pageCount = Math.ceil(emails.length / EMAILS_PAGE_SIZE)
  // A refetch can shrink the list; never point past the last page.
  const currentPage = Math.min(page, pageCount - 1)
  const pageEmails = emails.slice(currentPage * EMAILS_PAGE_SIZE, (currentPage + 1) * EMAILS_PAGE_SIZE)

  // The new attempt is logged as the newest row, so jump back to the first page to show it.
  const handleResend = (logId: string) => resend.mutate(logId, { onSuccess: () => setPage(0) })

  return (
    <div className="space-y-3">
      <ul key={currentPage} className="space-y-2">
        {pageEmails.map((email) => (
          <RepairEmailRow
            key={email.id}
            email={email}
            resendingId={resend.isPending ? (resend.variables ?? null) : null}
            onResend={handleResend}
          />
        ))}
      </ul>
      {pageCount > 1 ? (
        <EmailsPager page={currentPage} pageCount={pageCount} total={emails.length} onPageChange={setPage} />
      ) : null}
    </div>
  )
}
