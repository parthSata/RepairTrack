'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { repairKeys, type Repair } from './queries'
import type { CreateRepairInput } from './schemas'

export function useCreateRepair() {
  const queryClient = useQueryClient()

  return useMutation<Repair, Error, CreateRepairInput>({
    mutationFn: async (data) => {
      const response = await apiClient.post<Repair>('/repairs', data)
      return response.data
    },
    onSuccess: (newRepair) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all })
      toast.success(`Repair ticket #${newRepair.ticketNumber} created successfully!`)
    },
    onError: (error: unknown) => {
      let message = 'Failed to create repair ticket'
      if (error && typeof error === 'object' && 'response' in error) {
        const resData = (error as { response?: { data?: { error?: { message?: string } | string; message?: string } } }).response?.data
        if (typeof resData?.error === 'object' && resData.error?.message) {
          message = resData.error.message
        } else if (resData?.message) {
          message = resData.message
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      toast.error(message)
    },
  })
}

export function useUpdateRepairStatus(repairId: string) {
  const queryClient = useQueryClient()

  return useMutation<Repair, Error, { status: string; note?: string }>({
    mutationFn: async ({ status, note }) => {
      const response = await apiClient.patch<Repair>(`/repairs/${repairId}/status`, { status, note })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all })
      toast.success('Repair status updated successfully!')
    },
    onError: (error: unknown) => {
      let message = 'Failed to update repair status'
      if (error && typeof error === 'object' && 'response' in error) {
        const resData = (error as { response?: { data?: { message?: string; error?: { message?: string } } } }).response?.data
        if (resData?.message) {
          message = resData.message
        } else if (resData?.error?.message) {
          message = resData.error.message
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      toast.error(message)
    },
  })
}

export function useReopenRepair(repairId: string) {
  const queryClient = useQueryClient()

  return useMutation<Repair, Error, { note?: string }>({
    mutationFn: async ({ note }) => {
      const response = await apiClient.post<Repair>(`/repairs/${repairId}/reopen`, { note })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all })
      toast.success('Repair ticket reopened successfully!')
    },
    onError: (error: unknown) => {
      let message = 'Failed to reopen ticket'
      if (error && typeof error === 'object' && 'response' in error) {
        const resData = (error as { response?: { data?: { message?: string; error?: { message?: string } } } }).response?.data
        if (resData?.message) {
          message = resData.message
        } else if (resData?.error?.message) {
          message = resData.error.message
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      toast.error(message)
    },
  })
}

export function useReassignTechnician(repairId: string) {
  const queryClient = useQueryClient()

  return useMutation<Repair, Error, { technicianId: string | null }>({
    mutationFn: async ({ technicianId }) => {
      const response = await apiClient.patch<Repair>(`/repairs/${repairId}/technician`, { technicianId })
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all })
      if (variables.technicianId) {
        toast.success('Technician assignment updated!')
      } else {
        toast.success('Technician unassigned')
      }
    },
    onError: (error: unknown) => {
      let message = 'Failed to reassign technician'
      if (error && typeof error === 'object' && 'response' in error) {
        const resData = (error as { response?: { data?: { message?: string; error?: { message?: string } } } }).response?.data
        if (resData?.message) {
          message = resData.message
        } else if (resData?.error?.message) {
          message = resData.error.message
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      toast.error(message)
    },
  })
}

export function useUpdateDiagnosis(repairId: string) {
  const queryClient = useQueryClient()

  return useMutation<Repair, Error, { diagnosis: string }>({
    mutationFn: async ({ diagnosis }) => {
      const response = await apiClient.patch<Repair>(`/repairs/${repairId}/diagnosis`, { diagnosis })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all })
      toast.success('Diagnosis updated successfully!')
    },
    onError: (error: unknown) => {
      let message = 'Failed to update diagnosis'
      if (error && typeof error === 'object' && 'response' in error) {
        const resData = (error as { response?: { data?: { message?: string; error?: { message?: string } } } }).response?.data
        if (resData?.message) {
          message = resData.message
        } else if (resData?.error?.message) {
          message = resData.error.message
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      toast.error(message)
    },
  })
}

export function useAddRepairNote(repairId: string) {
  const queryClient = useQueryClient()

  return useMutation<{ id: string; note: string }, Error, { note: string }>({
    mutationFn: async ({ note }) => {
      const response = await apiClient.post<{ id: string; note: string }>(`/repairs/${repairId}/notes`, { note })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(repairId) })
      toast.success('Repair note added successfully!')
    },
    onError: (error: unknown) => {
      let message = 'Failed to add repair note'
      if (error && typeof error === 'object' && 'response' in error) {
        const resData = (error as { response?: { data?: { message?: string; error?: { message?: string } } } }).response?.data
        if (resData?.message) {
          message = resData.message
        } else if (resData?.error?.message) {
          message = resData.error.message
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      toast.error(message)
    },
  })
}

export function useUpdateExpectedCompletionDate(repairId: string) {
  const queryClient = useQueryClient()

  return useMutation<Repair, Error, { expectedCompletionDate: string | null }>({
    mutationFn: async ({ expectedCompletionDate }) => {
      const response = await apiClient.patch<Repair>(`/repairs/${repairId}/expected-completion-date`, { expectedCompletionDate })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all })
      toast.success('Expected completion date updated successfully!')
    },
    onError: (error: unknown) => {
      let message = 'Failed to update expected completion date'
      if (error && typeof error === 'object' && 'response' in error) {
        const resData = (error as { response?: { data?: { message?: string; error?: { message?: string } } } }).response?.data
        if (resData?.message) {
          message = resData.message
        } else if (resData?.error?.message) {
          message = resData.error.message
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      toast.error(message)
    },
  })
}

export function useUpdateEstimatedCost(repairId: string) {
  const queryClient = useQueryClient()

  return useMutation<Repair, Error, { estimatedCost: number | null }>({
    mutationFn: async ({ estimatedCost }) => {
      const response = await apiClient.patch<Repair>(`/repairs/${repairId}/estimated-cost`, { estimatedCost })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all })
      toast.success('Estimated cost updated successfully!')
    },
    onError: (error: unknown) => {
      let message = 'Failed to update estimated cost'
      if (error && typeof error === 'object' && 'response' in error) {
        const resData = (error as { response?: { data?: { message?: string; error?: { message?: string } } } }).response?.data
        if (resData?.message) {
          message = resData.message
        } else if (resData?.error?.message) {
          message = resData.error.message
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      toast.error(message)
    },
  })
}

export function useRequestCustomerApproval(repairId: string) {
  const queryClient = useQueryClient()

  return useMutation<Repair, Error, { additionalEstimatedCost: number }>({
    mutationFn: async ({ additionalEstimatedCost }) => {
      const response = await apiClient.post<Repair>(`/repairs/${repairId}/request-approval`, {
        additionalEstimatedCost,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairKeys.all })
      toast.success('Customer approval requested successfully!')
    },
    onError: (error: unknown) => {
      let message = 'Failed to request customer approval'
      if (error && typeof error === 'object' && 'response' in error) {
        const resData = (error as { response?: { data?: { message?: string; error?: { message?: string } } } }).response?.data
        if (resData?.message) {
          message = resData.message
        } else if (resData?.error?.message) {
          message = resData.error.message
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      toast.error(message)
    },
  })
}

export function useRegenerateTrackingLink(repairId: string) {
  const queryClient = useQueryClient()

  return useMutation<{ trackingToken: string | null }, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.post<{ trackingToken: string | null }>(
        `/repairs/${repairId}/regenerate-tracking-link`,
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairKeys.detail(repairId) })
    },
    onError: (error: unknown) => {
      let message = 'Failed to regenerate tracking link'
      if (error && typeof error === 'object' && 'response' in error) {
        const resData = (error as { response?: { data?: { message?: string; error?: { message?: string } } } }).response?.data
        if (resData?.message) {
          message = resData.message
        } else if (resData?.error?.message) {
          message = resData.error.message
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      toast.error(message)
    },
  })
}

