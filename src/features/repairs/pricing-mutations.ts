'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { getApiErrorMessage } from '@/lib/api-error'
import type { RepairPricingFieldsInput } from '@/features/repairs/pricing-schemas'
import { repairKeys, type Repair } from '@/features/repairs/queries'

export function useUpdateEstimate(repairId: string) {
  const queryClient = useQueryClient()

  return useMutation<Repair, Error, RepairPricingFieldsInput>({
    mutationFn: async (data) => {
      const response = await apiClient.patch<Repair>(`/repairs/${repairId}/estimate`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(repairId) })
      toast.success('Estimate pricing saved')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to save estimate pricing'))
    },
  })
}

export function useConfirmFinalTotal(repairId: string) {
  const queryClient = useQueryClient()

  return useMutation<Repair, Error, RepairPricingFieldsInput>({
    mutationFn: async (data) => {
      const response = await apiClient.patch<Repair>(`/repairs/${repairId}/final-total`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(repairId) })
      toast.success('Final total confirmed')
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to confirm final total'))
    },
  })
}
