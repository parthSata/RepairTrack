export function getApiErrorStatus(err: unknown): number | null {
  if (!err || typeof err !== 'object' || !('response' in err)) return null
  const status = (err as { response?: { status?: unknown } }).response?.status
  return typeof status === 'number' ? status : null
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object' || !('response' in err)) {
    return fallback
  }

  const data = (err as { response?: { data?: unknown } }).response?.data
  if (typeof data === 'string') {
    return data.trim().length > 0 && data.length <= 300 ? data : fallback
  }
  if (!data || typeof data !== 'object') {
    return fallback
  }

  const record = data as Record<string, unknown>
  if (typeof record.message === 'string' && record.message.trim().length > 0) {
    return record.message
  }

  if (record.error && typeof record.error === 'object') {
    const errorObj = record.error as Record<string, unknown>
    if (typeof errorObj.message === 'string' && errorObj.message.trim().length > 0) {
      return errorObj.message
    }
  }

  return fallback
}

const MAX_QUERY_RETRIES = 2

/** TanStack Query `retry`: 4xx will not succeed on retry, so fail fast; retry network errors and 5xx. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  const status = getApiErrorStatus(error)
  if (status !== null && status >= 400 && status < 500) return false
  return failureCount < MAX_QUERY_RETRIES
}
