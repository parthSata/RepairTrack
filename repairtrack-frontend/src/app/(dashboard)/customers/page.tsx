import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { CustomerTable } from '@/components/customers/customer-table'

export const metadata: Metadata = {
  title: 'Customers | RepairTrack',
  description: 'Manage repair shop customer profiles and contact details.',
}

export default async function CustomersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const role = session.user.role ?? 'OWNER'
  if (role === 'TECHNICIAN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage customer contacts, view repair history, and track customer information.
        </p>
      </div>

      <CustomerTable />
    </div>
  )
}
