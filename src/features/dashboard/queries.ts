'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { DashboardSummary } from './schemas'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
}

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: dashboardKeys.summary(),
    queryFn: async () => {
      const response = await apiClient.get<DashboardSummary>('/dashboard/summary')
      return response.data
    },
    staleTime: 30 * 1000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  })
}
