import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { DeviceFormInput } from './schemas'
import { deviceKeys, type Device } from './queries'
import { customerKeys } from '@/features/customers/queries'

export function useCreateDevice() {
  const queryClient = useQueryClient()

  return useMutation<Device, Error, DeviceFormInput>({
    mutationFn: async (data) => {
      const response = await apiClient.post<Device>('/devices', data)
      return response.data
    },
    onSuccess: (newDevice) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all })
      if (newDevice.customerId) {
        queryClient.invalidateQueries({ queryKey: customerKeys.detail(newDevice.customerId) })
      }
    },
  })
}

export function useUpdateDevice() {
  const queryClient = useQueryClient()

  return useMutation<Device, Error, { id: string; data: DeviceFormInput }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<Device>(`/devices/${id}`, data)
      return response.data
    },
    onSuccess: (updatedDevice, variables) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all })
      queryClient.invalidateQueries({ queryKey: deviceKeys.detail(variables.id) })
      if (updatedDevice.customerId) {
        queryClient.invalidateQueries({ queryKey: customerKeys.detail(updatedDevice.customerId) })
      }
    },
  })
}

export function useDeleteDevice() {
  const queryClient = useQueryClient()

  return useMutation<{ success: true }, Error, { id: string; customerId?: string }>({
    mutationFn: async ({ id }) => {
      const response = await apiClient.delete<{ success: true }>(`/devices/${id}`)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all })
      if (variables.customerId) {
        queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.customerId) })
      }
    },
  })
}
