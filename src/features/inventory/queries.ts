import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { PartFilterInput } from './schemas'

export interface Part {
  id: string
  shopId: string
  name: string
  sku: string
  quantity: number
  minimumStock: number
  purchasePrice: number
  sellingPrice: number
  supplier: string | null
  createdAt: string
  updatedAt: string
}

export interface PartListResponse {
  items: Part[]
  total: number
  page: number
  limit: number
  totalPages: number
  outOfStockCount: number
  lowStockCount: number
}

export const partKeys = {
  all: ['inventory'] as const,
  lists: () => [...partKeys.all, 'list'] as const,
  list: (filters: PartFilterInput) => [...partKeys.lists(), filters] as const,
  details: () => [...partKeys.all, 'detail'] as const,
  detail: (id: string) => [...partKeys.details(), id] as const,
}

export function useParts(filters: PartFilterInput) {
  return useQuery<PartListResponse>({
    queryKey: partKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<PartListResponse>('/inventory', {
        params: filters,
      })
      return response.data
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
