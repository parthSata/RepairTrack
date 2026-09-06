'use client'

import * as React from 'react'
import { TrackPageShell } from '@/components/tracking/track-page-shell'
import { TrackSearchForm } from '@/components/tracking/track-search-form'
import { TrackStatusView } from '@/components/tracking/track-status-view'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'
import { useVerifyPublicTracking } from '@/features/tracking/queries'

export function TrackLandingPage() {
  const verifyMutation = useVerifyPublicTracking()
  const [trackingData, setTrackingData] = React.useState<PublicTrackingResponse | null>(null)
  const [submitError, setSubmitError] = React.useState(false)

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
        onSubmit={async (values) => {
          setSubmitError(false)
          try {
            const data = await verifyMutation.mutateAsync(values)
            setTrackingData(data)
          } catch {
            setSubmitError(true)
          }
        }}
      />
    </TrackPageShell>
  )
}
