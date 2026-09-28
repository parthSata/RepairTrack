'use client'

import { AlertCircle, RotateCw } from 'lucide-react'
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error'
import { cn } from '@/lib/utils'

interface QueryErrorStateProps {
  error: unknown
  fallback: string
  /** Shown instead of the server message for 401/403. */
  forbiddenMessage?: string
  onRetry?: () => void
  className?: string
}

export function QueryErrorState({
  error,
  fallback,
  forbiddenMessage,
  onRetry,
  className,
}: QueryErrorStateProps) {
  const status = getApiErrorStatus(error)
  const isForbidden = status === 401 || status === 403
  const message =
    isForbidden && forbiddenMessage ? forbiddenMessage : getApiErrorMessage(error, fallback)

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive sm:flex-row sm:justify-center',
        className,
      )}
    >
      <p className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
        {message}
      </p>
      {onRetry && !isForbidden ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 font-medium underline underline-offset-2 hover:no-underline"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden />
          Retry
        </button>
      ) : null}
    </div>
  )
}
