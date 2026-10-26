import { z } from 'zod'
import {
  passwordConfirmObject,
  withPasswordConfirmation,
} from '@/features/auth/schemas'

export const inviteStaffSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  email: z.string().trim().email('Invalid email address'),
  role: z.enum(['STAFF', 'TECHNICIAN']),
})

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>

export const acceptInvitationSchema = withPasswordConfirmation(
  passwordConfirmObject.extend({
    name: z.string().trim().min(1).optional(),
  }),
)

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>

export type InvitationState = 'pending' | 'accepted'

/** Codes returned to `/invite/[token]?error=` when "Continue with Google" is rejected. */
export const INVITE_GOOGLE_ERRORS = {
  INVITE_INVALID: 'This invitation is no longer valid. Ask the shop owner to send a new one.',
  INVITE_EMAIL_MISMATCH:
    'That Google account does not match the invited email. Continue with Google using the assigned email shown below.',
  INVITE_ACCOUNT_EXISTS:
    'This Google account already belongs to another RepairTrack shop. Ask the owner to invite a different email.',
} as const

export type InviteGoogleErrorCode = keyof typeof INVITE_GOOGLE_ERRORS

export function getInviteGoogleErrorMessage(code: string | undefined): string | null {
  if (!code) return null
  return code in INVITE_GOOGLE_ERRORS
    ? INVITE_GOOGLE_ERRORS[code as InviteGoogleErrorCode]
    : 'Google sign-in could not be completed. Please try again.'
}

export interface InvitationDetails {
  state: InvitationState
  name: string
  email: string
  role: 'STAFF' | 'TECHNICIAN'
  shopName: string
}

/** Whether the invitation email went out from the Owner's Gmail; the link works either way. */
export type InviteEmailStatus = 'sent' | 'not_connected' | 'reconnect_needed' | 'failed'

export interface InviteStaffResponse {
  token: string
  inviteLink: string
  emailStatus: InviteEmailStatus
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
  status: 'ACTIVE' | 'INACTIVE' | 'INVITED'
  isInvitation: boolean
  token?: string
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
