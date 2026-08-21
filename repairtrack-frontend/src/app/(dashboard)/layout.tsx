import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/server/auth'
import { LogoutButton } from '@/components/auth/logout-button'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-muted">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-background p-5 md:block">
        <p className="text-lg font-semibold">RepairTrack</p>
        <nav className="mt-8 space-y-1 text-sm">
          <a className="block rounded-md bg-muted px-3 py-2 font-medium" href="/dashboard">Dashboard</a>
          <a className="block rounded-md px-3 py-2 hover:bg-muted" href="/repairs">Repairs</a>
          <a className="block rounded-md px-3 py-2 hover:bg-muted" href="/customers">Customers</a>
          <a className="block rounded-md px-3 py-2 hover:bg-muted" href="/devices">Devices</a>
          {session.user.role !== 'TECHNICIAN' && <>
            <a className="block rounded-md px-3 py-2 hover:bg-muted" href="/inventory">Inventory</a>
            <a className="block rounded-md px-3 py-2 hover:bg-muted" href="/invoices">Invoices</a>
            <a className="block rounded-md px-3 py-2 hover:bg-muted" href="/settings">Settings</a>
          </>}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-8">
          <p className="text-sm text-muted-foreground">{session.user.name}</p>
          <LogoutButton />
        </header>
        <main className="p-4 sm:p-8">{children}</main>
      </section>
    </div>
  )
}