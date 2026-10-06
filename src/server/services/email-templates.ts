import {
  closingNote,
  ctaButton,
  detailRow,
  detailsCard,
  heading,
  linkFallback,
} from '@/server/email/components'
import { escapeHtml } from '@/server/email/escape-html'
import { renderEmailLayout } from '@/server/email/layout'

const PLATFORM_NAME = 'RepairTrack'

export function buildVerificationEmailHtml({ name, url }: { name: string; url: string }) {
  return renderEmailLayout({
    shopName: PLATFORM_NAME,
    title: 'Verify your RepairTrack Email',
    bodyHtml: `
              ${heading('Verify your email address')}
              <p style="margin:0 0 20px 0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
              <p style="margin:0 0 24px 0;color:#475569;">Welcome to RepairTrack! Please verify your email address to complete your registration and activate your shop workspace.</p>
              ${ctaButton('Verify Email Address', url)}
              ${linkFallback("If the button above doesn't work, copy and paste this link into your browser:", url)}
              ${closingNote('If you did not create a RepairTrack account, you can safely ignore this email.')}`,
  })
}

export function buildGmailTestEmailHtml({ shopName, senderEmail }: { shopName: string; senderEmail: string }) {
  return renderEmailLayout({
    shopName,
    title: 'Gmail connection test',
    bodyHtml: `
              ${heading('Your Gmail is connected')}
              <p style="margin:0 0 20px 0;color:#475569;">This test email was sent from <strong>${escapeHtml(senderEmail)}</strong> through RepairTrack. Repair updates, invoices and payment emails for <strong>${escapeHtml(shopName)}</strong> will come from this address.</p>
              ${closingNote('No action is needed. You can delete this email.')}`,
  })
}

const ROLE_DISPLAY = {
  TECHNICIAN: { title: 'Technician', color: '#7c3aed' },
  STAFF: { title: 'Staff Member', color: '#2563eb' },
} as const

export function buildStaffInvitationEmailHtml({
  inviterName,
  shopName,
  role,
  inviteUrl,
  expiresIn,
}: {
  inviterName: string
  shopName: string
  role: 'STAFF' | 'TECHNICIAN'
  inviteUrl: string
  expiresIn: string
}) {
  const safeShopName = escapeHtml(shopName)
  const roleDisplay = ROLE_DISPLAY[role]

  return renderEmailLayout({
    shopName,
    title: `You've been invited to join ${shopName}`,
    bodyHtml: `
              ${heading('Team Invitation')}
              <p style="margin:0 0 20px 0;color:#475569;"><strong>${escapeHtml(inviterName)}</strong> has invited you to join <strong>${safeShopName}</strong> on RepairTrack as a team member.</p>
              ${detailsCard([
                detailRow('Shop:', safeShopName, 'font-size:14px;font-weight:600;color:#0f172a;'),
                detailRow('Role:', roleDisplay.title, `font-size:13px;font-weight:600;color:${roleDisplay.color};`),
                detailRow('Expires in:', escapeHtml(expiresIn), 'font-size:13px;font-weight:500;color:#64748b;', true),
              ])}
              ${ctaButton('Accept Invitation', inviteUrl)}
              ${linkFallback('Or copy and paste this link into your browser:', inviteUrl)}
              ${closingNote('If you were not expecting this invitation, you can ignore this email.')}`,
  })
}
