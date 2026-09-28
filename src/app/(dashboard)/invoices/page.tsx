import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { InvoiceTable } from '@/components/invoices/invoice-table'

export const metadata: Metadata = {
  title: 'Invoices | RepairTrack',
  description: 'Search and review invoices issued by your repair shop.',
}

export default async function InvoicesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const role = session.user.role ?? 'OWNER'
  if (role === 'TECHNICIAN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search invoices by number, customer name or phone.
        </p>
      </div>

      <InvoiceTable />
    </div>
  )
}
