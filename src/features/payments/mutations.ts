'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error'
import { formatRupees } from '@/lib/format-money'
import { repairKeys } from '@/features/repairs/queries'
import { paymentKeys } from './queries'
import type { PaymentType, RecordPaymentInput } from './schemas'

type RecordedPayment = {
  id: string
  amount: number
  type: PaymentType
}

export function useRecordPayment(repairId: string) {
  const queryClient = useQueryClient()

  return useMutation<RecordedPayment, Error, RecordPaymentInput>({
    mutationFn: async (data) => {
      const response = await apiClient.post<RecordedPayment>('/payments', data)
      return response.data
    },
    onSuccess: (payment) => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      const label = payment.type === 'ADVANCE' ? 'Advance' : 'Payment'
      toast.success(`${label} of ${formatRupees(payment.amount)} recorded`)
    },
    onError: (error) => {
      // 409 = repair cancelled or balance changed — refetch so the status and balance shown are current.
      if (getApiErrorStatus(error) === 409) {
        void queryClient.invalidateQueries({ queryKey: repairKeys.detail(repairId) })
        void queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      }
      toast.error(getApiErrorMessage(error, 'Failed to record payment'))
    },
  })
}
