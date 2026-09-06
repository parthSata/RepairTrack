import { z } from 'zod'

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Full name is required (at least 2 characters)' })
    .max(100, { message: 'Full name cannot exceed 100 characters' }),
  phone: z
    .string()
    .trim()
    .min(1, { message: 'Phone number is required' })
    .refine((val) => !/[a-zA-Z]/.test(val), {
      message: 'No letters allowed in phone number (digits only)',
    })
    .refine((val) => /^\+?[0-9]{7,15}$/.test(val), {
      message: 'Phone number must contain digits only (7 to 15 digits)',
    }),
  email: z
    .string()
    .trim()
    .min(1, { message: 'Email address is required' })
    .email({ message: 'Please enter a valid email address (e.g. name@example.com)' })
    .toLowerCase(),
  address: z
    .string()
    .trim()
    .max(500, { message: 'Address cannot exceed 500 characters' })
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(1000, { message: 'Notes cannot exceed 1000 characters' })
    .optional()
    .nullable(),
})

export type CustomerFormInput = z.infer<typeof customerSchema>

export const customerFilterSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'phone', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CustomerFilterInput = z.infer<typeof customerFilterSchema>
