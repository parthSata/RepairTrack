'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { LogoUploadInput, ShopProfile, ShopProfileResponse } from './schemas'
import { shopKeys } from './queries'

export function useUpdateShopProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (profile: ShopProfile) => {
      await apiClient.patch('shops/me', profile)
    },
    onMutate: async (newProfile: ShopProfile) => {
      await queryClient.cancelQueries({ queryKey: shopKeys.profile() })
      const previousProfile = queryClient.getQueryData<ShopProfileResponse>(shopKeys.profile())
      if (previousProfile) {
        queryClient.setQueryData<ShopProfileResponse>(shopKeys.profile(), {
          ...previousProfile,
          ...newProfile,
        })
      }
      return { previousProfile }
    },
    onError: (_err, _newProfile, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(shopKeys.profile(), context.previousProfile)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.profile() })
    },
  })
}

export function useRequestLogoUploadUrl() {
  return useMutation({
    mutationFn: async (input: LogoUploadInput) => (await apiClient.post<{ key: string; publicId: string; uploadUrl: string; previewUrl: string | null; signature: string; timestamp: number; apiKey: string; presetKey: string }>('shops/me/logo-upload', input)).data,
  })
}