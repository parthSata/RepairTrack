'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ShopProfileResponse } from './schemas'

export const shopKeys = { all: ['shop'] as const, profile: () => [...shopKeys.all, 'profile'] as const }

export function useShopProfile(initialData?: ShopProfileResponse | null) {
  return useQuery({
    queryKey: shopKeys.profile(),
    queryFn: async () => (await apiClient.get<ShopProfileResponse>('shops/me')).data,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    initialData: initialData ?? undefined,
  })
}