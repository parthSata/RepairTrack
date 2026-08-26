'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { repairKeys, type Repair } from './queries'
import type { CreateRepairInput } from './schemas'

export function useCreateRepair() {
  const queryClient = useQueryClient()

  return useMutation<Repair, Error, CreateRepairInput>({
    mutationFn: async (data) => {
      const response = await apiClient.post<Repair>('/repairs', data)
      return response.data
    },
    onSuccess: (newRepair) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all })
      toast.success(`Repair ticket #${newRepair.ticketNumber} created successfully!`)
    },
    onError: (error: unknown) => {
      let message = 'Failed to create repair ticket'
      if (error && typeof error === 'object' && 'response' in error) {
        const resData = (error as { response?: { data?: { error?: { message?: string } } } }).response?.data
        if (resData?.error?.message) {
          message = resData.error.message
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      toast.error(message)
    },
  })
}
