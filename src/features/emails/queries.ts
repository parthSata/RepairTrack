'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { shouldRetryQuery } from '@/lib/api-error'
import type { RepairEmailLog } from './schemas'

const EMAILS_STALE_TIME_MS = 15 * 1000

export const repairEmailKeys = {
  all: ['repair-emails'] as const,
  byRepair: (repairId: string) => [...repairEmailKeys.all, repairId] as const,
}

export function useRepairEmails(repairId: string) {
  return useQuery<RepairEmailLog[]>({
    queryKey: repairEmailKeys.byRepair(repairId),
    queryFn: async () => (await apiClient.get<RepairEmailLog[]>(`/repairs/${repairId}/emails`)).data,
    enabled: Boolean(repairId),
    staleTime: EMAILS_STALE_TIME_MS,
    retry: shouldRetryQuery,
  })
}
