/**
 * Money is stored in the database as integer paise (100 paise = ₹1).
 * All user-facing labels and public APIs should use rupees via the helpers below.
 */

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

export function paiseToRupees(paise: number): number {
  return paise / 100
}

/** Format a rupee amount for display (e.g. ₹1,500 or ₹1,500.50). */
export function formatINR(rupees: number): string {
  const hasFraction = Math.round(rupees * 100) % 100 !== 0
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

/** Format stored paise as rupees for display. */
export function formatINRFromPaise(paise: number): string {
  return formatINR(paiseToRupees(paise))
}

export function formatRupeesInputValue(paise: number | null): string {
  if (paise === null) return ''
  const rupees = paiseToRupees(paise)
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2)
}

export function parseRupeesInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseFloat(trimmed)
  if (Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}
