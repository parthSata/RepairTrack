import { HTTPException } from 'hono/http-exception'
import {
  calculateRepairTotal as calculateRepairTotalCore,
  DISCOUNT_EXCEEDS_CHARGES_MESSAGE,
  sumPartsCharges,
  type CalculateRepairTotalInput,
  type CalculateRepairTotalResult,
  type RepairPartChargeLine,
} from '@/features/repairs/pricing-calc'

export type { CalculateRepairTotalInput, CalculateRepairTotalResult, RepairPartChargeLine }
export { sumPartsCharges }

/**
 * Server wrapper around the shared pricing formula.
 * Converts discount overage into HTTP 400 for API callers.
 */
export function calculateRepairTotal(input: CalculateRepairTotalInput): CalculateRepairTotalResult {
  try {
    return calculateRepairTotalCore(input)
  } catch (err) {
    if (err instanceof Error && err.message === DISCOUNT_EXCEEDS_CHARGES_MESSAGE) {
      throw new HTTPException(400, { message: DISCOUNT_EXCEEDS_CHARGES_MESSAGE })
    }
    throw err
  }
}
