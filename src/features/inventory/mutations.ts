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
