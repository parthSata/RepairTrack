'use client'

import * as React from 'react'
import { TrackErrorState } from '@/components/tracking/track-error-state'
import { TrackPageShell } from '@/components/tracking/track-page-shell'
import { TrackSearchForm, type RateLimitState } from '@/components/tracking/track-search-form'
import { TrackSkeleton } from '@/components/tracking/track-skeleton'
import { TrackStatusView } from '@/components/tracking/track-status-view'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'
import {
  usePublicTrackingByToken,
  useTrackDecision,
  useVerifyPublicTracking,
} from '@/features/tracking/queries'
import { isTicketNumber, isTrackingToken } from '@/features/tracking/identifiers'
import { getRateLimitInfo } from '@/lib/api-error'

export function TrackDynamicPage({ ticketId }: { ticketId: string }) {
  const isToken = isTrackingToken(ticketId)
  const isTicket = isTicketNumber(ticketId)
  const tokenQuery = usePublicTrackingByToken(ticketId, isToken)
  const decisionMutation = useTrackDecision(ticketId)
  const verifyMutation = useVerifyPublicTracking()
  const [verifiedData, setVerifiedData] = React.useState<PublicTrackingResponse | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [rateLimit, setRateLimit] = React.useState<RateLimitState | null>(null)

  if (!isToken && !isTicket) {
    return (
      <TrackPageShell
        title="Unable to load tracking"
        description="This tracking link does not look valid."
      >
        <TrackErrorState />
      </TrackPageShell>
    )
  }

  if (isToken) {
    if (tokenQuery.isPending) {
      return (
        <TrackPageShell
          wide
          title="Loading repair status"
          description="Fetching the latest information for your repair."
        >
          <TrackSkeleton />
        </TrackPageShell>
      )
    }

    if (tokenQuery.isError || !tokenQuery.data) {
      return (
        <TrackPageShell
          title="Unable to load tracking"
          description="We could not load this repair with the provided link."
        >
          <TrackErrorState />
        </TrackPageShell>
      )
    }

    return (
      <TrackPageShell
        wide
        title={tokenQuery.data.approval?.status === 'PENDING' ? 'Review your repair estimate' : 'Your repair status'}
        description={
          tokenQuery.data.approval?.status === 'PENDING'
            ? 'We need you to review the diagnosis and cost before we can continue with the repair.'
            : 'Follow your device through each stage of service.'
        }
      >
        <TrackStatusView
          data={tokenQuery.data}
          accessMode="token"
          isSubmittingDecision={decisionMutation.isPending}
          onApprove={async () => {
            if (decisionMutation.isPending) return
            await decisionMutation.mutateAsync({ decision: 'APPROVE' })
          }}
          onReject={async (reason) => {
            if (decisionMutation.isPending) return
            await decisionMutation.mutateAsync({ decision: 'REJECT', reason })
          }}
        />
      </TrackPageShell>
    )
  }

  if (verifiedData) {
    return (
      <TrackPageShell
        wide
        title={verifiedData.approval?.status === 'PENDING' ? 'Review your repair estimate' : 'Your repair status'}
        description={
          verifiedData.approval?.status === 'PENDING'
            ? 'We need you to review the diagnosis and cost before we can continue with the repair.'
            : 'Follow your device through each stage of service.'
        }
      >
        <TrackStatusView data={verifiedData} accessMode="manual" />
      </TrackPageShell>
    )
  }

  return (
    <TrackPageShell
      title="Verify your repair"
      description="Confirm the phone number on file to view this repair."
    >
      <TrackSearchForm
        defaultTicketNumber={ticketId}
        isSubmitting={verifyMutation.isPending}
        submitError={submitError}
        rateLimit={rateLimit}
        onRateLimitExpire={() => {
          setRateLimit(null)
          setSubmitError(null)
        }}
        onSubmit={async (values) => {
          setSubmitError(null)
          setRateLimit(null)
          try {
            const data = await verifyMutation.mutateAsync(values)
            setVerifiedData(data)
          } catch (error) {
            const rlInfo = getRateLimitInfo(error)
            if (rlInfo) {
              setRateLimit({
                resetAt: rlInfo.resetAt,
                ticketNumber: values.ticketNumber,
              })
              try {
                sessionStorage.setItem(
                  `rt_rl_verify_${values.ticketNumber}`,
                  String(rlInfo.resetAt),
                )
              } catch {
                // Ignore storage errors
              }
            } else {
              const resData = (
                error as { response?: { data?: { error?: { remaining?: unknown } } } }
              )?.response?.data
              const remaining = resData?.error?.remaining
              const message =
                typeof remaining === 'number' && remaining > 0 && remaining <= 5
                  ? `We couldn't find this repair. Check your repair number and phone, then try again. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`
                  : "We couldn't find this repair. Check your repair number and phone, then try again."

              setSubmitError(message)
            }
          }
        }}
      />
    </TrackPageShell>
  )
}
