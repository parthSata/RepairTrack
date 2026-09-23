/**
 * Repair-domain money helpers (legacy stored-cost handling + formatting).
 * Pure ₹ ↔ paise converters live in `@/lib/money` and are re-exported here
 * so existing repair imports keep working.
 */

export {
  rupeesToPaise,
  paiseToRupees,
  parseRupeesInput,
} from '@/lib/money'

import { paiseToRupees, rupeesToPaise } from '@/lib/money'

/**
 * Converts a DB integer to rupees for display.
 * New records store paise. Older records may have stored whole rupees (e.g. 1500 meant ₹1,500).
 */
export function storedCostToRupees(stored: number | null | undefined): number | null {
  if (stored == null) return null

  const asPaise = paiseToRupees(stored)

  // Legacy: value like 1000 was saved as ₹1,000 but displays as ₹10 when treated as paise
  if (stored >= 1000 && asPaise < 100) {
    return stored
  }

  return asPaise
}

/** Format a rupee amount for display (e.g. ₹1,500 or ₹1,500.50). */
export function formatINR(rupees: number): string {
  const hasFraction = Math.round(rupees * 100) % 100 !== 0
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

/** Normalize any stored DB amount (paise or legacy rupees) to paise for arithmetic. */
export function normalizeStoredCostToPaise(stored: number | null | undefined): number | null {
  const rupees = storedCostToRupees(stored)
  if (rupees == null) return null
  return rupeesToPaise(rupees)
}

/** Breakdown in rupees for a pending approval row (handles legacy stored units). */
export function getApprovalEstimateBreakdownRupees(approval: {
  initialEstimatedCost: number
  additionalEstimatedCost: number
}): { initial: number; additional: number; revised: number } {
  const initial = storedCostToRupees(approval.initialEstimatedCost) ?? 0
  const additional = storedCostToRupees(approval.additionalEstimatedCost) ?? 0
  return { initial, additional, revised: initial + additional }
}

/** Format a stored DB amount (paise or legacy rupees) for display. */
export function formatINRFromPaise(stored: number | null | undefined): string {
  const rupees = storedCostToRupees(stored)
  if (rupees == null) return '—'
  return formatINR(rupees)
}

export function formatRupeesInputValue(stored: number | null): string {
  const rupees = storedCostToRupees(stored)
  if (rupees == null) return ''
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2)
}

/** Normalize user-entered rupees to paise for DB writes. */
export function rupeesInputToStoredPaise(rupees: number | null): number | null {
  if (rupees == null) return null
  return rupeesToPaise(rupees)
}
