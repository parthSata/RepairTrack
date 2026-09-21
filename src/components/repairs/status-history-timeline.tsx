'use client'

import { History } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { RepairStatusHistoryItem } from '@/features/repairs/queries'
import {
  getRepairStatusIcon,
  getRepairStatusLabel,
  getRepairStatusTone,
} from '@/features/repairs/status-ui'
import { cn } from '@/lib/utils'

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

function getActorLabel(item: RepairStatusHistoryItem): { name: string; role?: string } {
  if (item.actorType === 'CUSTOMER') {
    return { name: 'Customer', role: 'CUSTOMER' }
  }
  if (item.changedBy?.name) {
    return { name: item.changedBy.name, role: item.changedBy.role }
  }
  if (item.actorType === 'OWNER') {
    return { name: 'Owner', role: 'OWNER' }
  }
  return { name: 'Staff', role: 'STAFF' }
}

interface StatusHistoryTimelineProps {
  items?: RepairStatusHistoryItem[]
}

export function StatusHistoryTimeline({ items }: StatusHistoryTimelineProps) {
  const history = items ?? []

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <History className="h-4 w-4 text-steel" aria-hidden />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">Status history</h3>
            <p className="text-[11px] text-muted-foreground">Chronological ticket activity</p>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/20 py-8 text-center text-xs italic text-muted-foreground">
            No status changes recorded yet.
          </p>
        ) : (
          <ol className="relative ml-3 space-y-0 border-l border-border/80 pl-6">
            {history.map((item, index) => {
              const tone = getRepairStatusTone(item.toStatus)
              const Icon = getRepairStatusIcon(item.toStatus)
              const actor = getActorLabel(item)
              const delayMs = Math.min(index * 40, 240)

              return (
                <li
                  key={item.id}
                  className="relative pb-6 last:pb-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
                  style={{ animationDelay: `${delayMs}ms` }}
                >
                  <span
                    className={cn(
                      'absolute -left-[1.95rem] top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-card shadow-sm',
                      tone.node,
                    )}
                    aria-hidden
                  >
                    <Icon className={cn('h-3.5 w-3.5', tone.icon)} />
                  </span>

                  <div className="rounded-xl border border-border/70 bg-card/80 px-3.5 py-3 transition-colors duration-200 hover:bg-muted/25">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-semibold tracking-tight text-foreground">
                          {getRepairStatusLabel(item.toStatus)}
                        </p>
                        {item.fromStatus ? (
                          <p className="text-[11px] text-muted-foreground">
                            from {getRepairStatusLabel(item.fromStatus)}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">Initial status</p>
                        )}
                      </div>
                      <time
                        dateTime={item.createdAt}
                        className="shrink-0 text-[11px] tabular-nums text-muted-foreground"
                      >
                        {formatDateTime(item.createdAt)}
                      </time>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">by</span>
                      <span className="text-xs font-semibold text-foreground">{actor.name}</span>
                      {actor.role ? (
                        <span className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {actor.role}
                        </span>
                      ) : null}
                    </div>

                    {item.note ? (
                      <p className="mt-2.5 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2 text-xs leading-relaxed text-muted-foreground">
                        {item.note}
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
