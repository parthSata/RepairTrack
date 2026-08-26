'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { RepairFilterInput, RepairPriority } from './schemas'

export interface TechnicianUser {
  id: string
  name: string
  email: string
  role: 'TECHNICIAN'
}

export interface RepairCustomer {
  id: string
  name: string
  phone: string
  email: string | null
}

export interface RepairDevice {
  id: string
  brand: string
  model: string | null
  serialNumber: string | null
  deviceType: 'PHONE' | 'LAPTOP' | 'TABLET' | 'DESKTOP' | 'OTHER'
  condition: 'GOOD' | 'FAIR' | 'POOR'
  modelVerified: boolean
  modelVerificationOverridden?: boolean
  modelVerificationNote?: string | null
}

export interface RepairNote {
  id: string
  note: string
  createdAt: string
  author: {
    id: string
    name: string
  }
}

export interface Repair {
  id: string
  shopId: string
  customerId: string
  deviceId: string
  ticketNumber: string
  status: string
  problemDescription: string | null
  issueDescription: string | null
  initialCondition: string | null
  estimatedCost: number | null
  finalCost: number | null
  priority: RepairPriority
  expectedCompletionDate: string | null
  assignedTechnicianId: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  customer: RepairCustomer
  device: RepairDevice
  assignedTechnician?: TechnicianUser | null
  notes?: RepairNote[]
}

export interface RepairListResponse {
  items: Repair[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const repairKeys = {
  all: ['repairs'] as const,
  lists: () => [...repairKeys.all, 'list'] as const,
  list: (filters: RepairFilterInput) => [...repairKeys.lists(), filters] as const,
  details: () => [...repairKeys.all, 'detail'] as const,
  detail: (id: string) => [...repairKeys.details(), id] as const,
  technicians: () => ['staff', 'technicians'] as const,
}

export function useRepairs(filters: RepairFilterInput) {
  return useQuery<RepairListResponse>({
    queryKey: repairKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<RepairListResponse>('/repairs', {
        params: filters,
      })
      return response.data
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

export function useRepair(id: string) {
  return useQuery<Repair>({
    queryKey: repairKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Repair>(`/repairs/${id}`)
      return response.data
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  })
}

export function useTechnicians() {
  return useQuery<TechnicianUser[]>({
    queryKey: repairKeys.technicians(),
    queryFn: async () => {
      const response = await apiClient.get<TechnicianUser[]>('/staff/technicians')
      return response.data
    },
    staleTime: 60 * 1000,
  })
}
