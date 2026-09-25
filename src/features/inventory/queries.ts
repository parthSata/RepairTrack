import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { PartFilterInput, StockMovementFilterInput } from './schemas'
import { STOCK_REASON_LABELS } from './schemas'

export interface Part {
  id: string
  shopId: string
  name: string
  sku: string
  quantity: number
  stockAlert: number
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

export type StockMovementReason = keyof typeof STOCK_REASON_LABELS

export interface StockMovement {
  id: string
  shopId: string
  inventoryId: string
  delta: number
  quantityAfter: number
  reason: StockMovementReason
  note: string | null
  repairId: string | null
  ticketNumber: string | null
  createdBy: string | null
  createdAt: string
}

export interface StockMovementListResponse {
  items: StockMovement[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const partKeys = {
  all: ['inventory'] as const,
  lists: () => [...partKeys.all, 'list'] as const,
  list: (filters: PartFilterInput) => [...partKeys.lists(), filters] as const,
  details: () => [...partKeys.all, 'detail'] as const,
  detail: (id: string) => [...partKeys.details(), id] as const,
  movements: (id: string, filters?: StockMovementFilterInput) =>
    [...partKeys.detail(id), 'movements', filters ?? {}] as const,
}

export function useParts(filters: PartFilterInput, options?: { enabled?: boolean }) {
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
    enabled: options?.enabled ?? true,
  })
}

export function usePart(id: string) {
  return useQuery<Part>({
    queryKey: partKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Part>(`/inventory/${id}`)
      return response.data
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  })
}

export function useStockMovements(id: string, filters: StockMovementFilterInput = {}) {
  return useQuery<StockMovementListResponse>({
    queryKey: partKeys.movements(id, filters),
    queryFn: async () => {
      const response = await apiClient.get<StockMovementListResponse>(`/inventory/${id}/movements`, {
        params: filters,
      })
      return response.data
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}
