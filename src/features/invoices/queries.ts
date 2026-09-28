import * as React from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { shouldRetryQuery } from '@/lib/api-error'
import type { PaginatedResponse } from '@/lib/pagination'
import type { InvoiceFilterInput, InvoiceStatus } from './schemas'

export interface InvoiceItem {
  id: string
  partName: string
  quantity: number
  unitPrice: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  repairId: string
  laborCharges: number
  partsCharges: number
  additionalCharges: number
  taxPercent: number
  taxAmount: number
  total: number
  status: InvoiceStatus
  cancellationReason: string | null
  cancelledAt: string | null
  cancelledByName: string | null
  createdAt: string
  ticketNumber: string
  customer: {
    id: string
    name: string
    phone: string
  }
  items: InvoiceItem[]
}

export interface InvoiceListItem {
  id: string
  invoiceNumber: string
  status: InvoiceStatus
  total: number
  createdAt: string
  repairId: string
  ticketNumber: string
  customer: { id: string; name: string; phone: string }
  device: { brand: string; model: string | null }
}

export type InvoiceListResponse = PaginatedResponse<InvoiceListItem>

export interface CreatedInvoice {
  id: string
  invoiceNumber: string
}

const LIST_STALE_TIME_MS = 60 * 1000

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: InvoiceFilterInput) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
}

export function invoiceHref(id: string): string {
  return `/invoices/${id}`
}

async function fetchInvoices(filters: InvoiceFilterInput): Promise<InvoiceListResponse> {
  const response = await apiClient.get<InvoiceListResponse>('/invoices', { params: filters })
  return response.data
}

export function useInvoices(filters: InvoiceFilterInput) {
  const queryClient = useQueryClient()
  const query = useQuery<InvoiceListResponse>({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => fetchInvoices(filters),
    staleTime: LIST_STALE_TIME_MS,
    placeholderData: keepPreviousData,
    retry: shouldRetryQuery,
  })

  const totalPages = query.data?.totalPages ?? 0
  // Prefetch the next page so "Next" renders from cache instantly.
  React.useEffect(() => {
    if (filters.page >= totalPages) return
    const nextFilters = { ...filters, page: filters.page + 1 }
    void queryClient.prefetchQuery({
      queryKey: invoiceKeys.list(nextFilters),
      queryFn: () => fetchInvoices(nextFilters),
      staleTime: LIST_STALE_TIME_MS,
    })
  }, [filters, totalPages, queryClient])

  return query
}

export function useInvoice(id: string) {
  return useQuery<Invoice>({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Invoice>(`/invoices/${id}`)
      return response.data
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
    retry: shouldRetryQuery,
  })
}
