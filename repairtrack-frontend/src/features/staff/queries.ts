'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { InvitationDetails, UnifiedStaffMember } from './schemas'

export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (shopId?: string) => [...staffKeys.lists(), shopId ?? 'current'] as const,
  invitations: () => [...staffKeys.all, 'invitations'] as const,
  invitationDetail: (token: string) => [...staffKeys.invitations(), token] as const,
}

export function useStaffList() {
  return useQuery({
    queryKey: staffKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<UnifiedStaffMember[]>('staff')
      return response.data
    },
  })
}

export function useInvitationDetails(token: string) {
  return useQuery({
    queryKey: staffKeys.invitationDetail(token),
    queryFn: async () => {
      const response = await apiClient.get<InvitationDetails>(`invitations/${token}`)
      return response.data
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  })
}

