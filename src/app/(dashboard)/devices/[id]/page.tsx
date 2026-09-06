import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { DeviceDetails } from '@/components/devices/device-details'

export const metadata: Metadata = {
  title: 'Device Details | RepairTrack',
  description: 'View device specifications, linked customer info, and repair history.',
}

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const role = session.user.role ?? 'OWNER'
  if (role === 'TECHNICIAN') {
    redirect('/dashboard')
  }

  const { id } = await params

  return <DeviceDetails id={id} />
}
