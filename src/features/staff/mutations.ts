'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { staffKeys } from './queries'
import type {
  AcceptInvitationInput,
  ChangeStaffRoleInput,
  InviteStaffInput,
  InviteStaffResponse,
  StaffAssignmentItem,
} from './schemas'
import { repairKeys } from '@/features/repairs/queries'

export function useInviteStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: InviteStaffInput) => {
      const response = await apiClient.post<InviteStaffResponse>('staff/invite', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
    },
  })
}

export function useAcceptInvitation(token: string) {
  return useMutation({
    mutationFn: async (payload: AcceptInvitationInput) => {
      const response = await apiClient.post<{ success: boolean; email: string }>(
        `invitations/${token}/accept`,
        payload,
      )
      return response.data
    },
  })
}

export function useSetStaffStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => {
      const response = await apiClient.patch<{ success: boolean; userId: string; status: string }>(
        `staff/${id}/status`,
        { status },
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
    },
  })
}

export type ChangeStaffRoleResult = {
  success: boolean
  id: string
  role: string
  isInvitation: boolean
  assignmentAction?: 'HOLD' | 'REASSIGN'
  affectedCount?: number
  heldAssignmentCount?: number
}

export function useChangeStaffRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payload }: ChangeStaffRoleInput & { id: string }) => {
      const response = await apiClient.patch<ChangeStaffRoleResult>(`staff/${id}/role`, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
      queryClient.invalidateQueries({ queryKey: repairKeys.all })
      queryClient.invalidateQueries({ queryKey: repairKeys.technicians() })
    },
  })
}

export function useStaffActiveAssignments(staffId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...staffKeys.all, 'active-assignments', staffId],
    queryFn: async () => {
      const response = await apiClient.get<{ assignments: StaffAssignmentItem[] }>(
        `staff/${staffId}/active-assignments`,
      )
      return response.data.assignments
    },
    enabled: Boolean(staffId) && enabled,
  })
}

export function useStaffHeldAssignments(staffId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...staffKeys.all, 'held-assignments', staffId],
    queryFn: async () => {
      const response = await apiClient.get<{ assignments: StaffAssignmentItem[] }>(
        `staff/${staffId}/held-assignments`,
      )
      return response.data.assignments
    },
    enabled: Boolean(staffId) && enabled,
  })
}

export function useResumeAssignments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, assignmentIds }: { id: string; assignmentIds: string[] }) => {
      const response = await apiClient.post<{ resumedCount: number }>(
        `staff/${id}/resume-assignments`,
        { assignmentIds },
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
      queryClient.invalidateQueries({ queryKey: repairKeys.all })
      queryClient.invalidateQueries({ queryKey: repairKeys.technicians() })
    },
  })
}
