import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { StaffListStub } from '@/components/staff/staff-list-stub'

export default async function StaffManagementPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  if (session.user.role !== 'OWNER') {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-8">
        <h1 className="text-xl font-semibold">Staff Management</h1>
        <p className="mt-2 text-sm text-muted-foreground">Only shop owners can view or manage shop staff.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="border-b border-border pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Staff Management</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Invite, manage, and assign roles for your repair shop staff and technicians.
        </p>
      </header>
      <StaffListStub />
    </div>
  )
}
