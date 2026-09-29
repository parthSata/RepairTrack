'use client'

import type { ReactNode } from 'react'
import { AlertCircle, RotateCw, SearchX } from 'lucide-react'
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error'
import { cn } from '@/lib/utils'

interface QueryErrorStateProps {
  error: unknown
  fallback: string
  /** Shown instead of the server message for 401/403. */
  forbiddenMessage?: string
  /** Shown for 404, in a neutral style instead of an error style. */
  notFoundMessage?: string
  onRetry?: () => void
  /** Extra control, e.g. a "Back to list" link. */
  action?: ReactNode
  className?: string
}

function isClientError(status: number | null): boolean {
  return status !== null && status >= 400 && status < 500
}

export function QueryErrorState({
  error,
  fallback,
  forbiddenMessage,
  notFoundMessage,
  onRetry,
  action,
  className,
}: QueryErrorStateProps) {
  const status = getApiErrorStatus(error)
  const isNotFound = status === 404 && Boolean(notFoundMessage)
  const isForbidden = (status === 401 || status === 403) && Boolean(forbiddenMessage)
  const message = isNotFound
    ? notFoundMessage
    : isForbidden
      ? forbiddenMessage
      : getApiErrorMessage(error, fallback)
  // Retrying cannot fix a 4xx (bad input, no access, missing record).
  const canRetry = Boolean(onRetry) && !isClientError(status)
  const Icon = isNotFound ? SearchX : AlertCircle

  return (
    <div
      role={isNotFound ? 'status' : 'alert'}
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border p-4 text-center text-sm sm:flex-row sm:justify-center',
        isNotFound
          ? 'border-border bg-muted/30 text-muted-foreground'
          : 'border-destructive/20 bg-destructive/10 text-destructive',
        className,
      )}
    >
      <p className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {message}
      </p>
      {canRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 font-medium underline underline-offset-2 hover:no-underline"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden />
          Retry
        </button>
      ) : null}
      {action}
    </div>
  )
}
