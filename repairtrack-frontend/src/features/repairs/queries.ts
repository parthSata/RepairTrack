'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { RepairFilterInput, RepairPriority } from './schemas'

export interface TechnicianUser {
  id: string
  name: string
  email: string
  role: 'TECHNICIAN' | 'STAFF'
}

export interface RepairCreator {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'STAFF'
}

export interface RepairCustomer {
  id: string
  name: string
  phone: string
  email: string | null
}

export interface RepairDevice {
  id: string
  customerId?: string
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
    email?: string
    role?: string
  }
}

export interface RepairStatusHistoryItem {
  id: string
  fromStatus: string | null
  toStatus: string
  actorType: 'STAFF' | 'CUSTOMER'
  note: string | null
  createdAt: string
  changedBy: {
    id: string
    name: string
    email?: string
    role?: string
  } | null
}

export interface RepairApproval {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  initialEstimatedCost: number
  additionalEstimatedCost: number
  diagnosisSnapshot: string
  requestedAt: string
  decidedAt: string | null
  rejectionReason: string | null
  requestedBy: {
    id: string
    name: string
    role: string
  }
}

export interface Repair {
  id: string
  shopId: string
  customerId: string
  deviceId: string
  ticketNumber: string
  trackingToken: string | null
  status: string
  problemDescription: string | null
  issueDescription: string | null
  initialCondition: string | null
  diagnosis: string | null
  estimatedCost: number | null
  finalCost: number | null
  priority: RepairPriority
  expectedCompletionDate: string | null
  isOverdue?: boolean
  assignedTechnicianId: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  customer: RepairCustomer
  device: RepairDevice
  assignedTechnician?: TechnicianUser | null
  creator?: RepairCreator | null
  notes?: RepairNote[]
  statusHistory?: RepairStatusHistoryItem[]
  approval?: RepairApproval | null
}

export interface RepairListResponse {
  items: Repair[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
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
    staleTime: 30 * 1000,
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
    staleTime: 30 * 1000,
  })
}

export function useTechnicians() {
  return useQuery<TechnicianUser[]>({
    queryKey: repairKeys.technicians(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<TechnicianUser[]>('/staff/technicians')
        return response.data
      } catch {
        const response = await apiClient.get<TechnicianUser[]>('/repairs/technicians')
        return response.data
      }
    },
    staleTime: 10 * 1000,
  })
}
