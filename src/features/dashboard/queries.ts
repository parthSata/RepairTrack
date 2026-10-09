'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { AnalyticsPeriod, DashboardSummary } from './schemas'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  analytics: (section: string, period: AnalyticsPeriod) =>
    [...dashboardKeys.all, 'analytics', section, period] as const,
}

export function useAnalyticsQuery<T>(section: string, period: AnalyticsPeriod) {
  return useQuery<T>({
    queryKey: dashboardKeys.analytics(section, period),
    queryFn: async () => {
      const response = await apiClient.get<T>(
        `/dashboard/analytics/${section}?period=${encodeURIComponent(period)}`,
      )
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
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
