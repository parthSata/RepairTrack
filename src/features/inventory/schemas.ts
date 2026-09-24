import { z } from 'zod'

export const partSchema = z.object({
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
  quantity: z.coerce.number().int().min(0).default(0),
  stockAlert: z.coerce.number().int().min(0).default(0),
  purchasePrice: z.coerce.number().int().min(0, { message: 'Purchase price must be 0 or greater (paise)' }),
  sellingPrice: z.coerce.number().int().min(0, { message: 'Selling price must be 0 or greater (paise)' }),
  supplier: z
    .string()
    .trim()
    .max(200, { message: 'Supplier cannot exceed 200 characters' })
    .optional()
    .nullable(),
})

export type PartFormInput = z.infer<typeof partSchema>

export const partFilterSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'sku', 'quantity', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type PartFilterInput = z.infer<typeof partFilterSchema>
