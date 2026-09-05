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

export const trackDecisionParamSchema = z.object({
  trackingToken: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{40,48}$/, 'Enter a valid tracking token'),
})

export const trackDecisionSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REJECT']),
    reason: z.string().trim().max(500, 'Reason must be 500 characters or less').optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.decision === 'APPROVE' && value.reason && value.reason.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'Reason can only be provided when rejecting the estimate',
      })
    }
  })

export type TrackDecisionParamInput = z.infer<typeof trackDecisionParamSchema>
export type TrackDecisionInput = z.infer<typeof trackDecisionSchema>

export const publicTrackingResponseSchema = z.object({
  ticketNumber: z.string(),
  status: z.string(),
  device: z.object({
    brand: z.string(),
    model: z.string().nullable(),
  }),
  problemDescription: z.string().nullable(),
  estimatedCost: z.number().optional(),
  approval: z
    .object({
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
      diagnosis: z.string(),
      /** Original estimate in rupees at time of approval request. */
      initialEstimate: z.number(),
      /** Additional repair cost in rupees. */
      additionalCost: z.number(),
      /** Revised total in rupees (initial + additional). */
      revisedTotal: z.number(),
      decidedAt: z.string().nullable(),
      rejectionReason: z.string().nullable(),
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
