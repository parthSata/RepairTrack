import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { shouldRetryQuery } from '@/lib/api-error'
import type { PaymentMethod, PaymentType } from './schemas'
import type { PaymentStatus } from './summary'
import type { ShopUpi } from './upi'

export interface RepairPayment {
  id: string
  amount: number
  method: PaymentMethod
  type: PaymentType
  reference: string | null
  note: string | null
  paidAt: string
  receivedByName: string | null
}

/** Amounts in paise; `balance` and `status` are null until the repair has a bill total. */
export interface RepairPayments {
  payments: RepairPayment[]
  billTotal: number | null
  totalPaid: number
  balance: number | null
  status: PaymentStatus | null
  repairStatus: string
  /** Null when the shop hasn't set a UPI ID. */
  upi: ShopUpi | null
}

export const paymentKeys = {
  all: ['payments'] as const,
  byRepair: (repairId: string) => [...paymentKeys.all, 'repair', repairId] as const,
}

export function useRepairPayments(repairId: string) {
  return useQuery<RepairPayments>({
    queryKey: paymentKeys.byRepair(repairId),
    queryFn: async () => {
      const response = await apiClient.get<RepairPayments>('/payments', { params: { repairId } })
      return response.data
    },
    enabled: Boolean(repairId),
    staleTime: 30 * 1000,
    retry: shouldRetryQuery,
  })
}
