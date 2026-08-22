'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { LogoUploadInput, ShopProfile } from './schemas'
import { shopKeys } from './queries'

export function useUpdateShopProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (profile: ShopProfile) => {
      await apiClient.patch('shops/me', profile)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shopKeys.profile() }),
  })
}

export function useRequestLogoUploadUrl() {
  return useMutation({
    mutationFn: async (input: LogoUploadInput) => (await apiClient.post<{ key: string; publicId: string; uploadUrl: string; previewUrl: string | null; signature: string; timestamp: number; apiKey: string; presetKey: string }>('shops/me/logo-upload', input)).data,
  })
}