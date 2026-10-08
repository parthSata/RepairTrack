'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { getApiErrorMessage } from '@/lib/api-error'
import { gmailConnectionKey } from '@/features/gmail/queries'
import { repairEmailKeys } from './queries'
import { getEmailReasonLabel, type ResendEmailResult } from './schemas'

export function useResendRepairEmail(repairId: string) {
  const queryClient = useQueryClient()

  return useMutation<ResendEmailResult, Error, string>({
    mutationFn: async (logId) =>
      (await apiClient.post<ResendEmailResult>(`/repairs/${repairId}/emails/${logId}/resend`)).data,
    onSuccess: (result) => {
      if (result.status === 'SENT') {
        toast.success(`Email sent to ${result.recipient}`)
      } else {
        toast.error(`Email not sent: ${getEmailReasonLabel(result.reason) ?? 'Unknown reason'}`)
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to resend email'))
    },
    // A 409 means the list is stale, and a revoked Gmail token flips the reconnect banner.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: repairEmailKeys.byRepair(repairId) })
      void queryClient.invalidateQueries({ queryKey: gmailConnectionKey })
    },
  })
}
