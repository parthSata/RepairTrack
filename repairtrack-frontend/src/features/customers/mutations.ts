import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { CustomerFormInput } from './schemas'
import { customerKeys, type Customer } from './queries'

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation<Customer, Error, CustomerFormInput>({
    mutationFn: async (data) => {
      const response = await apiClient.post<Customer>('/customers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation<Customer, Error, { id: string; data: CustomerFormInput }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<Customer>(`/customers/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation<{ success: true }, Error, string>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<{ success: true }>(`/customers/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}
