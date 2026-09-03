/**
 * Money is stored in the database as integer paise (100 paise = ₹1).
 * Display uses formatRupees() in lib/format-money.ts. These helpers are
 * for form input (rupees typed by the user) and integer totals only.
 */

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

export function paiseToRupees(paise: number): number {
  return paise / 100
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

export function revisedEstimatedTotalPaise(
  originalPaise: number | null | undefined,
  additionalPaise: number | null | undefined,
): number {
  return (originalPaise ?? 0) + (additionalPaise ?? 0)
}
