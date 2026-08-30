export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object' || !('response' in err)) {
    return fallback
  }

  const data = (err as { response?: { data?: unknown } }).response?.data
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
