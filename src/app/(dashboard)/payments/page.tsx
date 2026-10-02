import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { PaymentTable } from '@/components/payments/payment-table'

export const metadata: Metadata = {
  title: 'Payments | RepairTrack',
  description: 'Search and review payments and advances recorded by your repair shop.',
}

export default async function PaymentsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const role = session.user.role ?? 'OWNER'
  if (role === 'TECHNICIAN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search and review payments, advances, and transaction methods across repair tickets.
        </p>
      </div>

      <PaymentTable />
    </div>
  )
}
