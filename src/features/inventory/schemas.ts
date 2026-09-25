import { z } from 'zod'

/** Create / Details fields — quantity is never set via this schema (system-managed). */
export const partDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Part name is required (at least 2 characters)' })
    .max(100, { message: 'Part name cannot exceed 100 characters' }),
  sku: z
    .string()
    .trim()
    .min(1, { message: 'SKU is required' })
    .max(100, { message: 'SKU cannot exceed 100 characters' }),
  stockAlert: z.coerce.number().int().min(0),
  purchasePrice: z.coerce
    .number()
    .int()
    .min(0, { message: 'Purchase price must be 0 or greater (paise)' }),
  sellingPrice: z.coerce
    .number()
    .int()
    .min(0, { message: 'Selling price must be 0 or greater (paise)' }),
  supplier: z
    .string()
    .trim()
    .max(200, { message: 'Supplier cannot exceed 200 characters' })
    .optional()
    .nullable()
    .transform((v) => (v == null || v === '' ? null : v)),
})

/** Form values — supplier kept as string in the UI; null is applied on submit. */
export type PartDetailsFormValues = {
  name: string
  sku: string
  stockAlert: number
  purchasePrice: number
  sellingPrice: number
  supplier: string
}

export type PartDetailsInput = z.infer<typeof partDetailsSchema>

/** @deprecated Prefer partDetailsSchema — kept as alias for create/update details. */
export const partSchema = partDetailsSchema
export type PartFormInput = PartDetailsInput

export const partFilterSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'sku', 'quantity', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type PartFilterInput = z.infer<typeof partFilterSchema>

export const MANUAL_STOCK_IN_REASONS = ['PURCHASE', 'RETURN', 'CORRECTION'] as const
export const MANUAL_STOCK_OUT_REASONS = ['DAMAGED', 'LOST', 'CORRECTION'] as const

export const adjustStockSchema = z
  .object({
    direction: z.enum(['IN', 'OUT']),
    quantity: z.coerce.number().int().min(1, { message: 'Quantity must be at least 1' }),
    reason: z.enum(['PURCHASE', 'RETURN', 'DAMAGED', 'LOST', 'CORRECTION']),
  })
  .superRefine((data, ctx) => {
    if (data.direction === 'IN' && !(MANUAL_STOCK_IN_REASONS as readonly string[]).includes(data.reason)) {
      ctx.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'Invalid reason for adding stock',
      })
    }
    if (
      data.direction === 'OUT' &&
      !(MANUAL_STOCK_OUT_REASONS as readonly string[]).includes(data.reason)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'Invalid reason for removing stock',
      })
    }
  })

export type AdjustStockInput = z.infer<typeof adjustStockSchema>

export const stockMovementFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type StockMovementFilterInput = {
  page?: number
  limit?: number
}

export const STOCK_REASON_LABELS: Record<
  'PURCHASE' | 'RETURN' | 'DAMAGED' | 'LOST' | 'CORRECTION' | 'REPAIR_USAGE' | 'REPAIR_REVERSAL',
  string
> = {
  PURCHASE: 'Purchase',
  RETURN: 'Return',
  DAMAGED: 'Damaged',
  LOST: 'Lost',
  CORRECTION: 'Correction',
  REPAIR_USAGE: 'Used in repair',
  REPAIR_REVERSAL: 'Removed from repair',
}
