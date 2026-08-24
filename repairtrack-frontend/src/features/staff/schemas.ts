import { z } from 'zod'
import { passwordSchema } from '@/features/auth/schemas'

export const inviteStaffSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  email: z.string().trim().email('Invalid email address'),
  role: z.enum(['STAFF', 'TECHNICIAN']),
})

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>

export const acceptInvitationSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string({ error: 'Confirm password is required' }).min(1, 'Confirm password is required'),
    name: z.string().trim().min(1).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>

export interface InvitationDetails {
  name: string
  email: string
  role: 'STAFF' | 'TECHNICIAN'
  shopName: string
  expiresAt: string
}

export interface InviteStaffResponse {
  token: string
  inviteLink: string
  expiresAt: string
}
