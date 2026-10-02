import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { PaymentsTabs } from '@/components/payments/payments-tabs'

export const metadata: Metadata = {
  title: 'Payments | RepairTrack',
  description: 'Search and review payments, advances, and pending balances across repair tickets.',
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
          Search and review payments, advances, and pending balances across repair tickets.
        </p>
      </div>

      <PaymentsTabs />
    </div>
  )
}
