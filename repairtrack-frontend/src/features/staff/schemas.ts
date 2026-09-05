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

export type InvitationState = 'pending' | 'expired' | 'accepted'

export interface InvitationDetails {
  state: InvitationState
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

export const setStaffStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export type SetStaffStatusInput = z.infer<typeof setStaffStatusSchema>

export const changeStaffRoleSchema = z
  .object({
    role: z.enum(['STAFF', 'TECHNICIAN']),
    assignmentAction: z.enum(['HOLD', 'REASSIGN']).optional(),
    reassignments: z
      .array(
        z.object({
          repairId: z.string().min(1),
          technicianId: z.string().min(1),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.assignmentAction === 'REASSIGN') {
      if (!data.reassignments || data.reassignments.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Reassignments are required when assignmentAction is REASSIGN',
          path: ['reassignments'],
        })
      }
    }
  })

export type ChangeStaffRoleInput = z.infer<typeof changeStaffRoleSchema>

export const resumeAssignmentsSchema = z.object({
  assignmentIds: z.array(z.string().uuid()).min(1, 'Select at least one assignment'),
})

export type ResumeAssignmentsInput = z.infer<typeof resumeAssignmentsSchema>

export interface UnifiedStaffMember {
  id: string
  name: string
  email: string
  role: 'STAFF' | 'TECHNICIAN'
  status: 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'EXPIRED'
  isInvitation: boolean
  token?: string
  expiresAt?: string
  createdAt: string
  heldAssignmentCount?: number
}

export interface StaffAssignmentItem {
  assignmentId: string
  repairId: string
  ticketNumber: string
  deviceLabel: string
  heldAt?: string | null
  heldReason?: string | null
}
