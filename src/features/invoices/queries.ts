import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { InvoiceStatus } from './schemas'

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

export interface CreatedInvoice {
  id: string
  invoiceNumber: string
}

export const invoiceKeys = {
  all: ['invoices'] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
}

export function invoiceHref(id: string): string {
  return `/invoices/${id}`
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
  })
}
