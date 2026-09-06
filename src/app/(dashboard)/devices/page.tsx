import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { DeviceTable } from '@/components/devices/device-table'

export const metadata: Metadata = {
  title: 'Devices | RepairTrack',
  description: 'Manage registered repair devices, serial numbers, and customer links.',
}

export default async function DevicesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const role = session.user.role ?? 'OWNER'
  if (role === 'TECHNICIAN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Devices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Register customer devices, search serial numbers, and track device repair histories.
        </p>
      </div>

      <DeviceTable />
    </div>
  )
}
