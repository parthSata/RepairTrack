import { paiseToRupees, rupeesToPaise } from '@/lib/money'

export type RepairPartChargeLine = {
  unitSellingPrice: number
  quantity: number
}

/** Standard Indian GST rate schedule slabs (0%, 5%, 12%, 18%, 28%). */
export const GST_TAX_RATES = [
  { value: 0, label: '0% (Nil / Exempt)' },
  { value: 5, label: '5%' },
  { value: 12, label: '12%' },
  { value: 18, label: '18% (Standard Services)' },
  { value: 28, label: '28%' },
] as const

export type GstTaxRate = (typeof GST_TAX_RATES)[number]['value']

export type CalculateRepairTotalInput = {
  laborCharges: number
  partsCharges: number
  additionalCharges: number
  taxPercent: number
}

export type CalculateRepairTotalResult = {
  partsCharges: number
  taxableValue: number
  taxAmount: number
  total: number
}

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
  const { laborCharges, partsCharges, additionalCharges, taxPercent } = input

  const taxableValue = laborCharges + partsCharges + additionalCharges
  const rawTaxPaise = Math.round((taxableValue * taxPercent) / 100)
  const taxAmount = rupeesToPaise(Math.round(paiseToRupees(rawTaxPaise)))
  const total = taxableValue + taxAmount

  return { partsCharges, taxableValue, taxAmount, total }
}
