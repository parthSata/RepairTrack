'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error'
import { repairKeys } from '@/features/repairs/queries'
import { invoiceHref, invoiceKeys, type CreatedInvoice } from './queries'
import type { CancelInvoiceInput } from './schemas'

export function useCreateInvoice(repairId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation<CreatedInvoice, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.post<CreatedInvoice>('/invoices', { repairId })
      return response.data
    },
    onSuccess: (invoice) => {
      void queryClient.invalidateQueries({ queryKey: repairKeys.detail(repairId) })
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      toast.success(`Invoice ${invoice.invoiceNumber} generated`, {
        action: {
          label: 'View invoice',
          onClick: () => router.push(invoiceHref(invoice.id)),
        },
      })
    },
    onError: (error) => {
      // 409 = bill not final, already invoiced, or bill out of date — refetch so the UI matches.
      if (getApiErrorStatus(error) === 409) {
        void queryClient.invalidateQueries({ queryKey: repairKeys.detail(repairId) })
      }
      toast.error(getApiErrorMessage(error, 'Failed to generate invoice'))
    },
  })
}

type CancelledInvoice = {
  id: string
  invoiceNumber: string
  repairId: string
}

export function useCancelInvoice(invoiceId: string) {
  const queryClient = useQueryClient()

  return useMutation<CancelledInvoice, Error, CancelInvoiceInput>({
    mutationFn: async (data) => {
      const response = await apiClient.post<CancelledInvoice>(
        `/invoices/${invoiceId}/cancel`,
        data,
      )
      return response.data
    },
    onSuccess: (invoice) => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) })
      void queryClient.invalidateQueries({ queryKey: repairKeys.detail(invoice.repairId) })
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      toast.success(`Invoice ${invoice.invoiceNumber} cancelled`)
    },
    onError: (error) => {
      if (getApiErrorStatus(error) === 409) {
        void queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) })
      }
      toast.error(getApiErrorMessage(error, 'Failed to cancel invoice'))
    },
  })
}
