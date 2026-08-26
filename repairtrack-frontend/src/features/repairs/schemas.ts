import { z } from 'zod'

export const repairPriorityValues = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
export type RepairPriority = (typeof repairPriorityValues)[number]

export const createRepairSchema = z.object({
  customerId: z.string().trim().min(1, 'Customer selection is required'),
  deviceId: z.string().trim().min(1, 'Device selection is required'),
  problemDescription: z
    .string()
    .trim()
    .min(5, { message: 'Problem description must be at least 5 characters long' })
    .max(1000, { message: 'Problem description cannot exceed 1000 characters' }),
  initialCondition: z
    .string()
    .trim()
    .min(3, { message: 'Initial physical condition must be at least 3 characters long' })
    .max(500, { message: 'Initial condition cannot exceed 500 characters' }),
  estimatedCost: z
    .number()
    .min(0, { message: 'Estimated cost cannot be negative' })
    .max(1000000, { message: 'Estimated cost cannot exceed ₹1,000,000' })
    .optional()
    .nullable(),
  priority: z.enum(repairPriorityValues),
  expectedCompletionDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        const selected = new Date(val)
        if (isNaN(selected.getTime())) return false
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return selected >= today
      },
      { message: 'Expected completion date must not be in the past' },
    ),
  assignedTechnicianId: z.string().optional().nullable(),
  initialNote: z
    .string()
    .trim()
    .max(1000, { message: 'Initial note cannot exceed 1000 characters' })
    .optional()
    .nullable(),
})

export type CreateRepairInput = z.infer<typeof createRepairSchema>

export const repairFilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  customerId: z.string().optional(),
  deviceId: z.string().optional(),
  assignedTechnicianId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type RepairFilterInput = z.infer<typeof repairFilterSchema>
