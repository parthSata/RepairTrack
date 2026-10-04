import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { getGmailConnection } from '@/server/services/gmail-connection.service'
import { GmailConnectionCard } from '@/components/settings/gmail-connection-card'
import { SettingsTabs } from '@/components/settings/settings-tabs'

export default async function EmailSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  if (session.user.role !== 'OWNER' || !session.user.shopId) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-8">
        <h1 className="text-xl font-semibold">Email & Notifications</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only shop owners can manage the shop&apos;s Gmail connection.
        </p>
      </div>
    )
  }

  const [connection, { gmail }] = await Promise.all([
    getGmailConnection(session.user.shopId),
    searchParams,
  ])

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="border-b border-border pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Email & Notifications</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Connect your shop&apos;s Gmail so customer and staff emails come from your own address.
        </p>
      </header>
      <SettingsTabs />
      <GmailConnectionCard initialData={connection} callbackResult={gmail} />
    </div>
  )
}
