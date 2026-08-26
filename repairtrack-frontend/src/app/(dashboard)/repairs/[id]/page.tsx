import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { RepairDetails } from '@/components/repairs/repair-details'

export const metadata: Metadata = {
  title: 'Repair Ticket Details | RepairTrack',
  description: 'View repair status, customer details, and device information.',
}

export default async function RepairDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const { id } = await params

  return <RepairDetails id={id} />
}
