'use client'

import * as React from 'react'
import { TrackErrorState } from '@/components/tracking/track-error-state'
import { TrackPageShell } from '@/components/tracking/track-page-shell'
import { TrackSearchForm } from '@/components/tracking/track-search-form'
import { TrackSkeleton } from '@/components/tracking/track-skeleton'
import { TrackStatusView } from '@/components/tracking/track-status-view'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'
import { usePublicTrackingByToken, useVerifyPublicTracking } from '@/features/tracking/queries'
import { isTicketNumber, isTrackingToken } from '@/features/tracking/identifiers'

export function TrackDynamicPage({ ticketId }: { ticketId: string }) {
  const isToken = isTrackingToken(ticketId)
  const isTicket = isTicketNumber(ticketId)
  const tokenQuery = usePublicTrackingByToken(ticketId, isToken)
  const verifyMutation = useVerifyPublicTracking()
  const [verifiedData, setVerifiedData] = React.useState<PublicTrackingResponse | null>(null)
  const [submitError, setSubmitError] = React.useState(false)

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
        title="Your repair status"
        description="Follow your device through each stage of service."
      >
        <TrackStatusView data={tokenQuery.data} />
      </TrackPageShell>
    )
  }

  if (verifiedData) {
    return (
      <TrackPageShell
        wide
        title="Your repair status"
        description="Follow your device through each stage of service."
      >
        <TrackStatusView data={verifiedData} />
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
        onSubmit={async (values) => {
          setSubmitError(false)
          try {
            const data = await verifyMutation.mutateAsync(values)
            setVerifiedData(data)
          } catch {
            setSubmitError(true)
          }
        }}
      />
    </TrackPageShell>
  )
}
