import { paiseToRupees, rupeesToPaise } from '@/lib/money'

export type RepairPartChargeLine = {
  unitSellingPrice: number
  quantity: number
}

export type CalculateRepairTotalInput = {
  laborCharges: number
  partsCharges: number
  additionalCharges: number
  discount: number
  taxPercent: number
}

export type CalculateRepairTotalResult = {
  partsCharges: number
  taxableValue: number
  taxAmount: number
  total: number
}

export const DISCOUNT_EXCEEDS_CHARGES_MESSAGE =
  'Discount cannot exceed labor, parts, and additional charges combined.'

/** Live parts subtotal from repair_parts lines (snapshotted unit selling price × qty). */
export function sumPartsCharges(lines: RepairPartChargeLine[]): number {
  return lines.reduce((sum, line) => sum + line.unitSellingPrice * line.quantity, 0)
}

/**
 * Single GST-aligned total formula for Estimate and Final panels.
 * Tax is on taxable value only; tax amount rounded to nearest rupee (CGST §170)
 * via `@/lib/money` converters.
 */
export function calculateRepairTotal(input: CalculateRepairTotalInput): CalculateRepairTotalResult {
  const { laborCharges, partsCharges, additionalCharges, discount, taxPercent } = input

  const taxableValue = laborCharges + partsCharges + additionalCharges - discount
  if (taxableValue < 0) {
    throw new Error(DISCOUNT_EXCEEDS_CHARGES_MESSAGE)
  }

  const rawTaxPaise = Math.round((taxableValue * taxPercent) / 100)
  const taxAmount = rupeesToPaise(Math.round(paiseToRupees(rawTaxPaise)))
  const total = taxableValue + taxAmount

  return { partsCharges, taxableValue, taxAmount, total }
}
