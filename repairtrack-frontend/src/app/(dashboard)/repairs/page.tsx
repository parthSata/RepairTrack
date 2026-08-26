import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { Button } from '@/components/ui/button'
import { Wrench, Plus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Repairs | RepairTrack',
  description: 'Manage and create repair service tickets for your shop.',
}

export default async function RepairsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const role = session.user.role ?? 'OWNER'
  if (role === 'TECHNICIAN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            Repair Tickets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create new service tickets and manage active repair jobs.
          </p>
        </div>

        <Link href="/repairs/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Repair Ticket
          </Button>
        </Link>
      </div>

      {/* Empty State / Welcome card for service ticket intake */}
      <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <Wrench className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Service Ticket Intake</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Start a new repair intake by selecting or registering a customer and device.
        </p>
        <div className="mt-6">
          <Link href="/repairs/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Repair Ticket
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
