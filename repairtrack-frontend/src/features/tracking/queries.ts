'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { PublicTrackingResponse, TrackVerifyInput } from './schemas'

export const trackingKeys = {
  all: ['tracking'] as const,
  byToken: (token: string) => [...trackingKeys.all, 'token', token] as const,
}

export function usePublicTrackingByToken(token: string, enabled: boolean) {
  return useQuery({
    queryKey: trackingKeys.byToken(token),
    queryFn: async () => {
      const { data } = await apiClient.get<PublicTrackingResponse>(`/api/track/${encodeURIComponent(token)}`)
      return data
    },
    enabled,
    retry: false,
  })
}

export function useVerifyPublicTracking() {
  return useMutation({
    mutationFn: async (input: TrackVerifyInput) => {
      const { data } = await apiClient.post<PublicTrackingResponse>('/api/track/verify', input)
      return data
    },
  })
}
