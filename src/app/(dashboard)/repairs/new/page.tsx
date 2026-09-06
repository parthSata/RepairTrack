import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { NewRepairWorkflow } from '@/components/repairs/new-repair-workflow'
import { RepairPageShell } from '@/components/repairs/repair-page-shell'

export const metadata: Metadata = {
  title: 'Create New Repair Ticket | RepairTrack',
  description: 'Intake customer, device, and issue information to create a new repair ticket.',
}

export default async function NewRepairPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const role = session.user.role ?? 'OWNER'
  if (role === 'TECHNICIAN') {
    redirect('/dashboard')
  }

  return (
    <RepairPageShell>
      <NewRepairWorkflow />
    </RepairPageShell>
  )
}
