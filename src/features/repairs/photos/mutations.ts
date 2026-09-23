'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { repairKeys, type RepairPhotosPayload } from '@/features/repairs/queries'
import type {
  RepairPhotoConfirmInput,
  RepairPhotoType,
  RepairPhotoUploadUrlInput,
  RepairPhotoVisibilityInput,
} from '@/features/repairs/photos/schemas'

type UploadUrlResponse = {
  key: string
  publicId: string
  uploadUrl: string
  previewUrl: string | null
  signature: string
  timestamp: number
  apiKey: string
  presetKey: string
  overwrite: true
}

function photoErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const resData = (
      error as { response?: { data?: { message?: string; error?: { message?: string } } } }
    ).response?.data
    if (resData?.message) return resData.message
    if (resData?.error?.message) return resData.error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

export function useRequestRepairPhotoUploadUrl(repairId: string) {
  return useMutation<UploadUrlResponse, Error, RepairPhotoUploadUrlInput>({
    mutationFn: async (input) =>
      (await apiClient.post<UploadUrlResponse>(`/repairs/${repairId}/photos/upload-url`, input)).data,
  })
}

export function useConfirmRepairPhoto(repairId: string) {
  const queryClient = useQueryClient()
  return useMutation<RepairPhotosPayload, Error, RepairPhotoConfirmInput>({
    mutationFn: async (input) =>
      (await apiClient.put<RepairPhotosPayload>(`/repairs/${repairId}/photos`, input)).data,
    onSuccess: (payload) => {
      queryClient.setQueryData(repairKeys.detail(repairId), (prev: unknown) => {
        if (!prev || typeof prev !== 'object') return prev
        return { ...prev, photos: payload, customerPhotosHidden: payload.customerPhotosHidden }
      })
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(repairId) })
      toast.success('Photo saved')
    },
    onError: (error) => toast.error(photoErrorMessage(error, 'Failed to save photo')),
  })
}

export function useDeleteRepairPhoto(repairId: string) {
  const queryClient = useQueryClient()
  return useMutation<RepairPhotosPayload, Error, RepairPhotoType>({
    mutationFn: async (type) =>
      (await apiClient.delete<RepairPhotosPayload>(`/repairs/${repairId}/photos/${type}`)).data,
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(repairId) })
      toast.success('Photo deleted')
      return payload
    },
    onError: (error) => toast.error(photoErrorMessage(error, 'Failed to delete photo')),
  })
}

export function useSetRepairPhotosVisibility(repairId: string) {
  const queryClient = useQueryClient()
  return useMutation<RepairPhotosPayload, Error, RepairPhotoVisibilityInput>({
    mutationFn: async (input) =>
      (
        await apiClient.patch<RepairPhotosPayload>(`/repairs/${repairId}/photos/visibility`, input)
      ).data,
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(repairId) })
      toast.success(payload.customerPhotosHidden ? 'Photos hidden from customer' : 'Photos visible to customer')
    },
    onError: (error) => toast.error(photoErrorMessage(error, 'Failed to update visibility')),
  })
}
