import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { CustomerDetails } from '@/components/customers/customer-details'

export const metadata: Metadata = {
  title: 'Customer Details | RepairTrack',
  description: 'View customer contact details and repair history.',
}

export default async function CustomerDetailPage({
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

  return <CustomerDetails id={id} />
}
