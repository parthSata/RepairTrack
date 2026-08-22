import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { DeviceFilterInput, DeviceType, DeviceCondition } from './schemas'

export interface LinkedCustomer {
  id: string
  name: string
  phone: string
  email: string | null
}

export interface Device {
  id: string
  shopId: string
  customerId: string
  brand: string
  model: string
  serialNumber: string | null
  deviceType: DeviceType
  condition: DeviceCondition
  accessories: string | null
  createdAt: string
  updatedAt: string
  customer?: LinkedCustomer
  totalRepairs?: number
}

export interface DeviceListResponse {
  items: Device[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DeviceRepairItem {
  id: string
  ticketNumber: string
  status: string
  issueDescription: string | null
  estimatedCost: number | null
  finalCost: number | null
  createdAt: string
}

export const deviceKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceKeys.all, 'list'] as const,
  list: (filters: DeviceFilterInput) => [...deviceKeys.lists(), filters] as const,
  details: () => [...deviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceKeys.details(), id] as const,
  repairHistory: (id: string) => [...deviceKeys.detail(id), 'repairs'] as const,
}

export function useDevices(filters: DeviceFilterInput) {
  return useQuery<DeviceListResponse>({
    queryKey: deviceKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<DeviceListResponse>('/devices', {
        params: filters,
      })
      return response.data
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

export function useDevice(id: string) {
  return useQuery<Device>({
    queryKey: deviceKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Device>(`/devices/${id}`)
      return response.data
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  })
}

export function useDeviceRepairHistory(id: string) {
  return useQuery<DeviceRepairItem[]>({
    queryKey: deviceKeys.repairHistory(id),
    queryFn: async () => {
      const response = await apiClient.get<DeviceRepairItem[]>(`/devices/${id}/repairs`)
      return response.data
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  })
}

export function useCustomerSearch(query: string) {
  return useQuery<{ items: LinkedCustomer[] }>({
    queryKey: ['customers', 'search', query],
    queryFn: async () => {
      const response = await apiClient.get<{ items: LinkedCustomer[] }>('/customers', {
        params: { search: query, limit: 5 },
      })
      return response.data
    },
    enabled: query.trim().length >= 3,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}
