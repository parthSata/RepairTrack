import { z } from 'zod'
import type { BadgeProps } from '@/components/ui/badge'

export type GmailConnectionStatus = 'NOT_CONNECTED' | 'CONNECTED' | 'NEEDS_RECONNECT'

export type GmailConnectionResponse = {
  status: GmailConnectionStatus
  email: string | null
  connectedAt: string | null
}

export const GMAIL_CONNECT_URL = '/api/settings/gmail/connect'
export const GMAIL_SETTINGS_PATH = '/settings/email'
/** Lands on Email settings with the Gmail card highlighted. */
export const GMAIL_SETTINGS_FROM_REPAIR_URL = `${GMAIL_SETTINGS_PATH}?from=repair`

export const GMAIL_STATUS_UI: Record<
  GmailConnectionStatus,
  { label: string; variant: NonNullable<BadgeProps['variant']> }
> = {
  NOT_CONNECTED: { label: 'Not connected', variant: 'secondary' },
  CONNECTED: { label: 'Connected', variant: 'success' },
  NEEDS_RECONNECT: { label: 'Reconnect needed', variant: 'warning' },
}

/** `?gmail=` values the OAuth callback redirects back with. */
export const GMAIL_CALLBACK_RESULTS = {
  connected: { type: 'success', message: 'Gmail connected' },
  denied: { type: 'error', message: 'Gmail connection was cancelled' },
  missing_scope: {
    type: 'error',
    message: 'Allow RepairTrack to send email on your behalf, then connect again',
  },
  failed: { type: 'error', message: 'Could not connect Gmail. Please try again.' },
} as const

export type GmailCallbackResult = keyof typeof GMAIL_CALLBACK_RESULTS

export const gmailCallbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  error: z.string().optional(),
})
