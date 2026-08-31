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
    <ol className="space-y-3">
      {updates.map((update, index) => (
        <li
          key={`${update.timestamp}-${update.label}-${index}`}
          className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/20 px-4 py-3 track-update-enter motion-safe:animate-[track-update-enter_220ms_ease-out_both]"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <span className="text-sm font-medium text-foreground">{update.label}</span>
          <time className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {formatTimestamp(update.timestamp)}
          </time>
        </li>
      ))}
    </ol>
  )
}
