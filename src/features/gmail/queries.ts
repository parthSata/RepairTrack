'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { shouldRetryQuery } from '@/lib/api-error'
import type { GmailConnectionResponse } from './schemas'

export const gmailConnectionKey = ['gmail-connection'] as const

export function useGmailConnection(initialData?: GmailConnectionResponse) {
  return useQuery({
    queryKey: gmailConnectionKey,
    queryFn: async () => (await apiClient.get<GmailConnectionResponse>('settings/gmail')).data,
    staleTime: 60_000,
    retry: shouldRetryQuery,
    initialData,
  })
}
