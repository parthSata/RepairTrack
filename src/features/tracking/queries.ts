'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type { PublicTrackingResponse, TrackDecisionInput, TrackVerifyInput } from './schemas'

export const trackingKeys = {
  all: ['tracking'] as const,
  byToken: (token: string) => [...trackingKeys.all, 'token', token] as const,
}

export function usePublicTrackingByToken(token: string, enabled: boolean) {
  return useQuery({
    queryKey: trackingKeys.byToken(token),
    queryFn: async () => {
      const { data } = await apiClient.get<PublicTrackingResponse>(`/track/${encodeURIComponent(token)}`)
      return data
    },
    enabled,
    retry: false,
  })
}

export function useVerifyPublicTracking() {
  return useMutation({
    mutationFn: async (input: TrackVerifyInput) => {
      const { data } = await apiClient.post<PublicTrackingResponse>('/track/verify', input)
      return data
    },
  })
}

export function useTrackDecision(token: string) {
  const queryClient = useQueryClient()

  return useMutation<PublicTrackingResponse, Error, TrackDecisionInput>({
    mutationFn: async (input) => {
      const { data } = await apiClient.post<PublicTrackingResponse>(
        `/track/${encodeURIComponent(token)}/decision`,
        input,
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(trackingKeys.byToken(token), data)
      queryClient.invalidateQueries({ queryKey: trackingKeys.byToken(token) })
      toast.success(data.approval?.status === 'REJECTED' ? 'Repair rejected' : 'Repair approved')
    },
    onError: (error: unknown) => {
      let message = 'Failed to submit your decision'
      if (error && typeof error === 'object' && 'response' in error) {
        const resData = (error as { response?: { data?: { message?: string; error?: { message?: string } } } })
          .response?.data
        if (resData?.message) {
          message = resData.message
        } else if (resData?.error?.message) {
          message = resData.error.message
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      toast.error(message)
    },
  })
}
