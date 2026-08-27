import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { RepairList } from '@/components/repairs/repair-list'

export const metadata: Metadata = {
  title: 'Repairs | RepairTrack',
  description: 'Manage and track repair service tickets for your shop.',
}

export default async function RepairsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  return <RepairList />
}
