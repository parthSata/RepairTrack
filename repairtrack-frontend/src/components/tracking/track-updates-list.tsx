'use client'

import type { PublicTrackingResponse } from '@/features/tracking/schemas'

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function TrackUpdatesList({ updates }: { updates: PublicTrackingResponse['updates'] }) {
  if (updates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Status updates will appear here as your repair progresses.
      </p>
    )
  }

  return (
    <ol className="flex flex-col gap-3">
      {updates.map((update, index) => (
        <li
          key={`${update.timestamp}-${update.label}-${index}`}
          className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-border bg-muted/20 px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-4 track-update-enter motion-safe:animate-[track-update-enter_220ms_ease-out_both]"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <span className="min-w-0 text-sm font-medium text-foreground break-words">
            {update.label}
          </span>
          <time className="shrink-0 text-xs text-muted-foreground tabular-nums sm:text-right">
            {formatTimestamp(update.timestamp)}
          </time>
        </li>
      ))}
    </ol>
  )
}
