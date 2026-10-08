type DateStyle = 'short' | 'medium' | 'long'

const formatters = new Map<DateStyle, Intl.DateTimeFormat>()

function getFormatter(style: DateStyle): Intl.DateTimeFormat {
  let formatter = formatters.get(style)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-IN', { dateStyle: style })
    formatters.set(style, formatter)
  }
  return formatter
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

/** Formats an ISO date for display (en-IN); returns the input unchanged when it is not a valid date. */
export function formatDate(iso: string, style: DateStyle = 'medium'): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return getFormatter(style).format(date)
}

/** Medium date plus short time (en-IN), e.g. "7 Oct 2026, 9:31 pm"; invalid input is returned unchanged. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return dateTimeFormatter.format(date)
}
