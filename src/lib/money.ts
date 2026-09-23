/**
 * Shared ₹ ↔ paise converters.
 * Money is stored as integer paise (100 paise = ₹1). UI inputs use rupees.
 */

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

export function paiseToRupees(paise: number): number {
  return paise / 100
}

/** Parse a rupee input string; returns null for empty or invalid values. */
export function parseRupeesInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseFloat(trimmed)
  if (Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

/** Format paise as a rupee string suitable for an input value. */
export function formatPaiseAsRupeesInput(paise: number | null | undefined): string {
  if (paise == null) return ''
  const rupees = paiseToRupees(paise)
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2)
}
