'use client'

import * as React from 'react'
import { TrackErrorState } from '@/components/tracking/track-error-state'
import { TrackPageShell } from '@/components/tracking/track-page-shell'
import { TrackSearchForm } from '@/components/tracking/track-search-form'
import { TrackSkeleton } from '@/components/tracking/track-skeleton'
import { TrackStatusView } from '@/components/tracking/track-status-view'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'
import { useVerifyPublicTracking } from '@/features/tracking/queries'

export function TrackLandingPage() {
  const verifyMutation = useVerifyPublicTracking()
  const [trackingData, setTrackingData] = React.useState<PublicTrackingResponse | null>(null)
  const [showError, setShowError] = React.useState(false)

  if (trackingData) {
    return (
      <TrackPageShell
        wide
        title="Your repair status"
        description="Follow your device through each stage of service."
      >
        <TrackStatusView data={trackingData} />
      </TrackPageShell>
    )
  }

  return (
    <TrackPageShell
      title="Track your repair"
      description="Enter your repair number and the phone number on file to view your repair status."
    >
      {verifyMutation.isPending ? <TrackSkeleton /> : null}

      {!verifyMutation.isPending && showError ? <TrackErrorState /> : null}

      {!verifyMutation.isPending && !showError ? (
        <TrackSearchForm
          isSubmitting={verifyMutation.isPending}
          onSubmit={async (values) => {
            setShowError(false)
            try {
              const data = await verifyMutation.mutateAsync(values)
              setTrackingData(data)
            } catch {
              setShowError(true)
            }
          }}
        />
      ) : null}
    </TrackPageShell>
  )
}
