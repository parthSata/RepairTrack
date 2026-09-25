import { z } from 'zod'

/** Editable repair pricing fields (integer paise / whole percent). Totals are server-computed. */
export const repairPricingFieldsSchema = z.object({
  laborCharges: z.coerce.number().int().min(0, { message: 'Labor charges cannot be negative' }),
  additionalCharges: z.coerce
    .number()
    .int()
    .min(0, { message: 'Additional charges cannot be negative' }),
  discount: z.coerce.number().int().min(0, { message: 'Discount cannot be negative' }),
  taxPercent: z.coerce
    .number()
    .int()
    .min(0, { message: 'Tax percent cannot be negative' })
    .max(100, { message: 'Tax percent cannot exceed 100' }),
})

export type RepairPricingFieldsInput = z.infer<typeof repairPricingFieldsSchema>
