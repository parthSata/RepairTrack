'use client'

import * as React from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { shouldRetryQuery } from '@/lib/api-error'
import type { PaginatedResponse } from '@/lib/pagination'
import type { PaymentFilterInput, PaymentMethod } from './schemas'
import type { PaymentStatus } from './summary'
import type { ShopUpi } from './upi'

export interface RepairPayment {
  id: string
  amount: number
  method: PaymentMethod
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

export interface PaymentListItem {
  id: string
  amount: number
  method: PaymentMethod | 'CARD' | 'BANK_TRANSFER'
  reference: string | null
  note: string | null
  paidAt: string
  repair: {
    id: string
    ticketNumber: string
  }
  customer: {
    id: string
    name: string
    phone: string
  }
  invoice: {
    id: string
    invoiceNumber: string
  } | null
  receivedByName: string | null
}

export interface PaymentListResponse extends PaginatedResponse<PaymentListItem> {
  totalAmount: number
}

export interface PendingPaymentItem {
  repairId: string
  ticketNumber: string
  customer: {
    id: string
    name: string
    phone: string
  }
  status: string
  billTotal: number
  balance: number
  paid?: number
  hasFinalBill?: boolean
  lastPaymentDate?: string | null
}

export interface PendingPaymentsResponse {
  items: PendingPaymentItem[]
  totalOutstanding: number
  upi: ShopUpi | null
}

const LIST_STALE_TIME_MS = 30 * 1000

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: PaymentFilterInput) => [...paymentKeys.lists(), filters] as const,
  pending: () => [...paymentKeys.all, 'pending'] as const,
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

async function fetchPayments(filters: PaymentFilterInput): Promise<PaymentListResponse> {
  const response = await apiClient.get<PaymentListResponse>('/payments', { params: filters })
  return response.data
}

export function usePayments(filters: PaymentFilterInput) {
  const queryClient = useQueryClient()
  const query = useQuery<PaymentListResponse>({
    queryKey: paymentKeys.list(filters),
    queryFn: () => fetchPayments(filters),
    staleTime: LIST_STALE_TIME_MS,
    placeholderData: keepPreviousData,
    retry: shouldRetryQuery,
  })

  const totalPages = query.data?.totalPages ?? 0
  React.useEffect(() => {
    if (filters.page >= totalPages) return
    const nextFilters = { ...filters, page: filters.page + 1 }
    void queryClient.prefetchQuery({
      queryKey: paymentKeys.list(nextFilters),
      queryFn: () => fetchPayments(nextFilters),
      staleTime: LIST_STALE_TIME_MS,
    })
  }, [filters, totalPages, queryClient])

  return query
}

export function usePendingPayments() {
  return useQuery<PendingPaymentsResponse>({
    queryKey: paymentKeys.pending(),
    queryFn: async () => {
      const response = await apiClient.get<PendingPaymentsResponse>('/payments/pending')
      return response.data
    },
    staleTime: LIST_STALE_TIME_MS,
    retry: shouldRetryQuery,
  })
}

