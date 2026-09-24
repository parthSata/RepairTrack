import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { PartFormInput } from './schemas'
import { partKeys, type Part } from './queries'

export function useCreatePart() {
  const queryClient = useQueryClient()

  return useMutation<Part, Error, PartFormInput>({
    mutationFn: async (data) => {
      const response = await apiClient.post<Part>('/inventory', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partKeys.all })
    },
  })
}

export function useUpdatePart() {
  const queryClient = useQueryClient()

  return useMutation<Part, Error, { id: string; data: PartFormInput }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<Part>(`/inventory/${id}`, data)
      return response.data
    },
    onSuccess: (_part, { id }) => {
      queryClient.invalidateQueries({ queryKey: partKeys.lists() })
      queryClient.invalidateQueries({ queryKey: partKeys.detail(id) })
    },
  })
}

export function useDeletePart() {
  const queryClient = useQueryClient()

  return useMutation<{ success: true }, Error, string>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<{ success: true }>(`/inventory/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partKeys.lists() })
    },
  })
}
