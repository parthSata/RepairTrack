import {
  calculateRepairTotal as calculateRepairTotalCore,
  sumPartsCharges,
  type CalculateRepairTotalInput,
  type CalculateRepairTotalResult,
  type RepairPartChargeLine,
} from '@/features/repairs/pricing-calc'

export type { CalculateRepairTotalInput, CalculateRepairTotalResult, RepairPartChargeLine }
export { sumPartsCharges }

/**
 * Server wrapper around the shared pricing formula.
 */
export function calculateRepairTotal(input: CalculateRepairTotalInput): CalculateRepairTotalResult {
  return calculateRepairTotalCore(input)
}
