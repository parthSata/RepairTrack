'use client'

import * as React from 'react'
import { TrackPageShell } from '@/components/tracking/track-page-shell'
import { TrackSearchForm, type RateLimitState } from '@/components/tracking/track-search-form'
import { TrackStatusView } from '@/components/tracking/track-status-view'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'
import { useVerifyPublicTracking } from '@/features/tracking/queries'
import { getRateLimitInfo } from '@/lib/api-error'

export function TrackLandingPage() {
  const verifyMutation = useVerifyPublicTracking()
  const [trackingData, setTrackingData] = React.useState<PublicTrackingResponse | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [rateLimit, setRateLimit] = React.useState<RateLimitState | null>(null)

  if (trackingData) {
    return (
      <TrackPageShell
        wide
        title="Your repair status"
        description="Follow your device through each stage of service."
      >
        <TrackStatusView data={trackingData} accessMode="manual" />
      </TrackPageShell>
    )
  }

  return (
    <TrackPageShell
      title="Track your repair"
      description="Enter your repair number and the phone number on file to view your repair status."
    >
      <TrackSearchForm
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
            setTrackingData(data)
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
