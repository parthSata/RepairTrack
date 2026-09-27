'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error'
import type { RepairPricingFieldsInput } from '@/features/repairs/pricing-schemas'
import type { RequestCustomerApprovalInput } from '@/features/repairs/schemas'
import { repairKeys, type Repair } from '@/features/repairs/queries'

type RepairPricingMutationConfig = {
  repairId: string
  method: 'patch' | 'post'
  path: string
  successMessage: string
  errorFallback: string
}

function useRepairPricingMutation<TInput>({
  repairId,
  method,
  path,
  successMessage,
  errorFallback,
}: RepairPricingMutationConfig) {
  const queryClient = useQueryClient()

  return useMutation<Repair, Error, TInput>({
    mutationFn: async (data) => {
      const response = await apiClient[method]<Repair>(`/repairs/${repairId}/${path}`, data)
      return response.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: repairKeys.all })
      toast.success(successMessage)
    },
    onError: (error) => {
      // A 409 means the ticket changed underneath us (e.g. customer just approved) — refetch.
      if (getApiErrorStatus(error) === 409) {
        void queryClient.invalidateQueries({ queryKey: repairKeys.detail(repairId) })
      }
      toast.error(getApiErrorMessage(error, errorFallback))
    },
  })
}

export function useUpdateEstimate(repairId: string) {
  return useRepairPricingMutation<RepairPricingFieldsInput>({
    repairId,
    method: 'patch',
    path: 'estimate',
    successMessage: 'Estimate saved',
    errorFallback: 'Failed to save estimate',
  })
}

export function useConfirmFinalTotal(repairId: string) {
  return useRepairPricingMutation<RepairPricingFieldsInput>({
    repairId,
    method: 'patch',
    path: 'final-total',
    successMessage: 'Bill finalized',
    errorFallback: 'Failed to finalize bill',
  })
}

export function useRequestCustomerApproval(repairId: string) {
  return useRepairPricingMutation<RequestCustomerApprovalInput>({
    repairId,
    method: 'post',
    path: 'request-approval',
    successMessage: 'Estimate sent to the customer for approval',
    errorFallback: 'Failed to send estimate for approval',
  })
}
