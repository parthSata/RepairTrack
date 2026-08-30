const TICKET_NUMBER_PATTERN = /^\d{10}$/
const TRACKING_TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,48}$/

export function isTicketNumber(value: string): boolean {
  return TICKET_NUMBER_PATTERN.test(value)
}

export function isTrackingToken(value: string): boolean {
  return TRACKING_TOKEN_PATTERN.test(value)
}
