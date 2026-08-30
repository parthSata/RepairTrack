import { z } from 'zod'

export const trackVerifySchema = z.object({
  ticketNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Enter a valid 10-digit repair number'),
  phone: z
    .string()
    .trim()
    .min(7, 'Enter a valid phone number')
    .max(30, 'Enter a valid phone number')
    .regex(/^[+\d][\d\s().-]{6,29}$/, 'Enter a valid phone number'),
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
  createdAt: z.string(),
  updates: z.array(
    z.object({
      label: z.string(),
      timestamp: z.string(),
    }),
  ),
})

export type PublicTrackingResponse = z.infer<typeof publicTrackingResponseSchema>
