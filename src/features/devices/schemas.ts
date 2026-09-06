import { z } from 'zod'

export const DEVICE_TYPES = ['PHONE', 'LAPTOP', 'TABLET', 'DESKTOP', 'OTHER'] as const
export type DeviceType = (typeof DEVICE_TYPES)[number]

export const DEVICE_CONDITIONS = ['GOOD', 'FAIR', 'POOR'] as const
export type DeviceCondition = (typeof DEVICE_CONDITIONS)[number]

export const deviceSchema = z.object({
  customerId: z
    .string()
    .trim()
    .min(1, { message: 'Customer selection is required' }),
  brand: z
    .string()
    .trim()
    .min(2, { message: 'Brand name must be at least 2 characters' })
    .max(50, { message: 'Brand name cannot exceed 50 characters' }),
  model: z
    .string()
    .trim()
    .max(100, { message: 'Model name cannot exceed 100 characters' })
    .optional()
    .nullable(),
  markUnverified: z.boolean().optional(),
  modelVerificationOverrideReason: z.string().trim().min(1, { message: 'Override reason is required' }).optional().nullable(),
  serialNumber: z
    .string()
    .trim()
    .max(100, { message: 'Serial number cannot exceed 100 characters' })
    .optional()
    .nullable(),
  deviceType: z.enum(DEVICE_TYPES),
  condition: z.enum(DEVICE_CONDITIONS),
  accessories: z
    .string()
    .trim()
    .max(500, { message: 'Accessories text cannot exceed 500 characters' })
    .optional()
    .nullable(),
})

export type DeviceFormInput = z.infer<typeof deviceSchema>

export const deviceFilterSchema = z.object({
  search: z.string().optional(),
  deviceType: z.string().optional(),
  customerId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['brand', 'model', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type DeviceFilterInput = z.infer<typeof deviceFilterSchema>
