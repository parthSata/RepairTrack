import type { ReactNode } from 'react'
import { Bell } from 'lucide-react'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/server/auth'
import { LogoutButton } from '@/components/auth/logout-button'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  if (session.user.status === 'INACTIVE') {
    redirect('/login?error=account_deactivated')
  }

  if (!session.user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email)}`)
  }

  const role = session.user.role ?? 'OWNER'

  return (
    <div className="flex min-h-screen bg-background print:block print:min-h-0 print:bg-white">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block print:hidden">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-foreground">RT</span>
          <span className="font-semibold tracking-tight">RepairTrack</span>
        </div>
        <SidebarNav role={role} />
        <div className="mx-4 mt-4 rounded-lg border border-border bg-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-steel">Workspace</p>
          <p className="mt-2 text-sm font-medium">{role}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Focused tools for your repair team.</p>
        </div>
      </aside>
      <section className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-8 print:hidden">
          <div className="flex items-center gap-3"><MobileNav role={role} /><span className="text-sm font-medium md:hidden">RepairTrack</span><span className="hidden text-sm text-muted-foreground md:block">Operations overview</span></div>
          <div className="flex items-center gap-2"><button type="button" aria-label="Notifications" className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"><Bell className="h-4 w-4" /></button><span className="mx-1 h-5 w-px bg-border" /><p className="hidden text-sm text-muted-foreground sm:block">{session.user.name}</p><LogoutButton /></div>
        </header>
        <main className="page-enter p-4 sm:p-8 print:p-0">{children}</main>
      </section>
    </div>
  )
}
