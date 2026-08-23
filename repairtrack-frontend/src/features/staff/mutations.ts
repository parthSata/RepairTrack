'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { staffKeys } from './queries'
import type { AcceptInvitationInput, InviteStaffInput, InviteStaffResponse } from './schemas'

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
      const response = await apiClient.post<{ success: boolean; email: string }>(`invitations/${token}/accept`, payload)
      return response.data
    },
  })
}
