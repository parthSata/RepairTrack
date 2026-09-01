import { z } from 'zod'

export const trackVerifySchema = z.object({
  ticketNumber: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit repair number')),
  phone: z
    .string()
    .trim()
    .transform((value) => {
      if (value.startsWith('+')) {
        return `+${value.slice(1).replace(/\D/g, '')}`
      }
      return value.replace(/\D/g, '')
    })
    .pipe(
      z
        .string()
        .min(1, 'Phone number is required')
        .regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number (7 to 15 digits)'),
    ),
})

export type TrackVerifyInput = z.infer<typeof trackVerifySchema>

export const publicTrackingResponseSchema = z.object({
  ticketNumber: z.string(),
  status: z.string(),
  device: z.object({
    brand: z.string(),
    model: z.string().nullable(),
  }),
  problemDescription: z.string().nullable(),
  estimatedCost: z.number().optional(),
  pendingApproval: z
    .object({
      diagnosis: z.string(),
      /** Estimated cost in rupees for customer-facing display. */
      estimatedCost: z.number(),
    })
    .optional(),
  createdAt: z.string(),
  updates: z.array(
    z.object({
      label: z.string(),
      timestamp: z.string(),
    }),
  ),
})

export type PublicTrackingResponse = z.infer<typeof publicTrackingResponseSchema>
