import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { ShopProfileForm } from '@/components/settings/shop-profile-form'

export default async function ShopProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'OWNER') return <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-8"><h1 className="text-xl font-semibold">Shop profile</h1><p className="mt-2 text-sm text-muted-foreground">Only shop owners can view or edit shop settings.</p></div>
  return <div className="mx-auto max-w-7xl space-y-8"><header className="border-b border-border pb-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Settings</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Shop Profile</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Manage the details your team and customers use to identify your shop.</p></header><ShopProfileForm /></div>
}