'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle, Mail, Send, Unplug } from 'lucide-react'
import { toast } from 'sonner'
import { ConnectGmailButton } from '@/components/email/connect-gmail-button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { QueryErrorState } from '@/components/ui/query-error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useDisconnectGmail, useSendTestEmail } from '@/features/gmail/mutations'
import { useGmailConnection } from '@/features/gmail/queries'
import {
  GMAIL_CALLBACK_RESULTS,
  GMAIL_SETTINGS_PATH,
  GMAIL_STATUS_UI,
  type GmailCallbackResult,
  type GmailConnectionResponse,
} from '@/features/gmail/schemas'
import { cn } from '@/lib/utils'

type GmailConnectionCardProps = {
  initialData: GmailConnectionResponse
  callbackResult?: string
  /** Arrived from a "Connect Gmail" warning: draws attention to the card until connected. */
  highlight?: boolean
}

function isCallbackResult(value?: string): value is GmailCallbackResult {
  return Boolean(value && value in GMAIL_CALLBACK_RESULTS)
}

/** Shows the OAuth callback outcome once, then drops `?gmail=` from the URL. */
function useCallbackToast(callbackResult?: string) {
  const router = useRouter()
  useEffect(() => {
    if (!isCallbackResult(callbackResult)) return
    const { type, message } = GMAIL_CALLBACK_RESULTS[callbackResult]
    toast[type](message, { id: 'gmail-callback' })
    router.replace(GMAIL_SETTINGS_PATH, { scroll: false })
  }, [callbackResult, router])
}

function statusDescription({ status, email }: GmailConnectionResponse) {
  if (status === 'CONNECTED') return `Connected: ${email}`
  if (status === 'NEEDS_RECONNECT') {
    return `Google access for ${email} expired or was revoked. Reconnect to keep sending emails.`
  }
  return 'Shop emails are not sent until you connect your Gmail.'
}

export function GmailConnectionCard({ initialData, callbackResult, highlight = false }: GmailConnectionCardProps) {
  const connection = useGmailConnection(initialData)
  const sendTestEmail = useSendTestEmail()
  useCallbackToast(callbackResult)

  if (connection.isError) {
    return (
      <QueryErrorState
        error={connection.error}
        fallback="Could not load your Gmail connection"
        onRetry={() => void connection.refetch()}
      />
    )
  }
  if (!connection.data) return <Skeleton className="h-48 w-full rounded-lg" />

  const { status, email } = connection.data
  const statusUi = GMAIL_STATUS_UI[status]

  return (
    <Card
      className={cn(
        'max-w-2xl transition-shadow duration-200',
        highlight &&
          status !== 'CONNECTED' &&
          'shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/70 ring-offset-2 ring-offset-background page-enter',
      )}
    >
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Mail className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold">Gmail</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Repair updates, invoices and payment emails are sent from your own Gmail address.
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Gmail status</span>
            <Badge variant={statusUi.variant}>{statusUi.label}</Badge>
          </div>
          <p className="break-words text-sm">{statusDescription(connection.data)}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {status !== 'NOT_CONNECTED' && <DisconnectGmailButton email={email} />}
          {status === 'CONNECTED' ? (
            <Button
              type="button"
              className="gap-2"
              disabled={sendTestEmail.isPending}
              onClick={() => sendTestEmail.mutate()}
            >
              {sendTestEmail.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              Send test email
            </Button>
          ) : (
            <ConnectGmailButton label={status === 'NEEDS_RECONNECT' ? 'Reconnect Gmail' : 'Connect Gmail'} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function DisconnectGmailButton({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false)
  const disconnect = useDisconnectGmail()

  return (
    <>
      <Button type="button" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Unplug className="h-4 w-4" aria-hidden />
        Disconnect
      </Button>
      <AlertDialog open={open} onOpenChange={(next) => !disconnect.isPending && setOpen(next)}>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect Gmail?</AlertDialogTitle>
          <AlertDialogDescription>
            RepairTrack will stop sending shop emails from {email ?? 'this account'} and revoke its
            Google access. You can connect again at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={disconnect.isPending} onClick={() => setOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            className="gap-2"
            disabled={disconnect.isPending}
            onClick={() => disconnect.mutate(undefined, { onSuccess: () => setOpen(false) })}
          >
            {disconnect.isPending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </>
  )
}
