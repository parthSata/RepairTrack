import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { CustomerFilterInput } from './schemas'

export interface Customer {
  id: string
  shopId: string
  name: string
  phone: string
  email: string | null
  address: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  totalRepairs?: number
  lastVisit?: string | null
}

export interface CustomerListResponse {
  items: Customer[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CustomerRepairItem {
  id: string
  ticketNumber: string
  status: string
  issueDescription: string | null
  estimatedCost: number | null
  finalCost: number | null
  createdAt: string
  device: {
    id: string
    brand: string
    model: string
    serialNumber: string | null
  } | null
}

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: CustomerFilterInput) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  repairHistory: (id: string) => [...customerKeys.detail(id), 'repairs'] as const,
}

export function useCustomers(filters: CustomerFilterInput) {
  return useQuery<CustomerListResponse>({
    queryKey: customerKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<CustomerListResponse>('/customers', {
        params: filters,
      })
      return response.data
    },
    staleTime: 60 * 1000,
  })
}

export function useCustomer(id: string) {
  return useQuery<Customer>({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Customer>(`/customers/${id}`)
      return response.data
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  })
}

export function useCustomerRepairHistory(id: string) {
  return useQuery<CustomerRepairItem[]>({
    queryKey: customerKeys.repairHistory(id),
    queryFn: async () => {
      const response = await apiClient.get<CustomerRepairItem[]>(`/customers/${id}/repairs`)
      return response.data
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  })
}
