import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { PartTable } from '@/components/inventory/part-table'

export const metadata: Metadata = {
  title: 'Inventory | RepairTrack',
  description: 'Track parts stock, prices, and reorder needs for your repair shop.',
}

export default async function InventoryPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const role = session.user.role ?? 'OWNER'
  if (role === 'TECHNICIAN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search parts by name or SKU and monitor stock levels across your shop.
        </p>
      </div>

      <PartTable />
    </div>
  )
}
