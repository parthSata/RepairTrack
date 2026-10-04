'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error'
import { gmailConnectionKey } from './queries'

export function useDisconnectGmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('settings/gmail/disconnect')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gmailConnectionKey })
      toast.success('Gmail disconnected')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to disconnect Gmail')),
  })
}

export function useSendTestEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('settings/gmail/test')
    },
    onSuccess: () => toast.success('Test email sent. Check your inbox.'),
    onError: (error) => {
      // 409 = not connected or access revoked; the connection status may have changed.
      if (getApiErrorStatus(error) === 409) {
        void queryClient.invalidateQueries({ queryKey: gmailConnectionKey })
      }
      toast.error(getApiErrorMessage(error, 'Failed to send test email'))
    },
  })
}
