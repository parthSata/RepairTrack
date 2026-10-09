'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { AnalyticsPeriod, DashboardSummary, RevenueAnalyticsResponse } from './schemas'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (shopId?: string | null) =>
    [...dashboardKeys.all, 'summary', shopId ?? 'current'] as const,
  analytics: (shopId: string | null | undefined, section: string, period: AnalyticsPeriod) =>
    [...dashboardKeys.all, 'analytics', shopId ?? 'current', section, period] as const,
}

export function useAnalyticsQuery<T>(
  section: string,
  period: AnalyticsPeriod,
  shopId?: string | null,
) {
  return useQuery<T>({
    queryKey: dashboardKeys.analytics(shopId, section, period),
    queryFn: async () => {
      const response = await apiClient.get<T>(
        `/dashboard/analytics/${section}?period=${encodeURIComponent(period)}`,
      )
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })
}

export function useRevenueAnalytics(period: AnalyticsPeriod, shopId?: string | null) {
  return useAnalyticsQuery<RevenueAnalyticsResponse>('revenue', period, shopId)
}

export function useDashboardSummary(shopId?: string | null) {
  return useQuery<DashboardSummary>({
    queryKey: dashboardKeys.summary(shopId),
    queryFn: async () => {
      const response = await apiClient.get<DashboardSummary>('/dashboard/summary')
      return response.data
    },
    staleTime: 60 * 1000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })
}
