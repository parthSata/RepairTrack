import { TrackDynamicPage } from '@/components/tracking/track-dynamic-page'

export default async function TrackTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>
}) {
  const { ticketId } = await params
  return <TrackDynamicPage ticketId={ticketId} />
}
