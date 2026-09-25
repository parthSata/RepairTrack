import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { PartStockHistory } from '@/components/inventory/part-stock-history'

export const metadata: Metadata = {
  title: 'Stock History | RepairTrack',
  description: 'View stock movements for a part.',
}

export default async function InventoryPartPage({
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

  return <PartStockHistory partId={id} />
}
