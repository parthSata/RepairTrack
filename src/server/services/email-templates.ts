import { escapeHtml } from '@/server/email/escape-html'
import { renderEmailLayout } from '@/server/email/layout'

const PLATFORM_NAME = 'RepairTrack'

function heading(text: string) {
  return `<h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">${text}</h1>`
}

function ctaButton(label: string, url: string) {
  const href = escapeHtml(url)
  return `
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                <tr>
                  <td align="center" style="border-radius:8px;background-color:#2563eb;">
                    <a href="${href}" style="font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;display:inline-block;background-color:#2563eb;">${label} &rarr;</a>
                  </td>
                </tr>
              </table>`
}

function linkFallback(intro: string, url: string) {
  const href = escapeHtml(url)
  return `
              <p style="margin:0 0 12px 0;font-size:13px;color:#64748b;">${intro}</p>
              <p style="margin:0 0 24px 0;font-size:12px;word-break:break-all;color:#2563eb;"><a href="${href}" style="color:#2563eb;text-decoration:underline;">${href}</a></p>`
}

function closingNote(text: string) {
  return `
              <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />
              <p style="margin:0;font-size:13px;color:#94a3b8;">${text}</p>`
}

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

const ROLE_DISPLAY = {
  TECHNICIAN: { title: 'Technician', color: '#7c3aed' },
  STAFF: { title: 'Staff Member', color: '#2563eb' },
} as const

function detailRow(label: string, value: string, valueStyle: string, isLast = false) {
  const spacing = isLast ? '' : 'padding-bottom:6px;'
  return `
                <tr>
                  <td style="font-size:13px;color:#64748b;${spacing}">${label}</td>
                  <td align="right" style="${valueStyle}${spacing}">${value}</td>
                </tr>`
}

export function buildStaffInvitationEmailHtml({
  inviterName,
  shopName,
  role,
  inviteUrl,
}: {
  inviterName: string
  shopName: string
  role: 'STAFF' | 'TECHNICIAN'
  inviteUrl: string
}) {
  const safeShopName = escapeHtml(shopName)
  const roleDisplay = ROLE_DISPLAY[role]

  return renderEmailLayout({
    shopName: PLATFORM_NAME,
    title: `You've been invited to join ${shopName}`,
    bodyHtml: `
              ${heading('Team Invitation')}
              <p style="margin:0 0 20px 0;color:#475569;"><strong>${escapeHtml(inviterName)}</strong> has invited you to join <strong>${safeShopName}</strong> on RepairTrack as a team member.</p>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;">
                ${detailRow('Shop:', safeShopName, 'font-size:14px;font-weight:600;color:#0f172a;')}
                ${detailRow('Role:', roleDisplay.title, `font-size:13px;font-weight:600;color:${roleDisplay.color};`)}
                ${detailRow('Expires in:', '7 Days', 'font-size:13px;font-weight:500;color:#64748b;', true)}
              </table>
              ${ctaButton('Accept Invitation', inviteUrl)}
              ${linkFallback('Or copy and paste this link into your browser:', inviteUrl)}
              ${closingNote('If you were not expecting this invitation, you can ignore this email.')}`,
  })
}
