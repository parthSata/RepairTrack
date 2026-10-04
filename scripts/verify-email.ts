import { config } from 'dotenv'
import { buildStaffInvitationEmailHtml } from '@/server/services/email-templates'
import { sendAccountVerificationEmail, sendEmail, type GmailSender } from '@/server/services/gmail.service'

config({ path: '.env.local' })

function assertSent(label: string, result: Awaited<ReturnType<typeof sendEmail>>) {
  if (!result.sent) throw new Error(`${label} was not sent: ${result.reason}`)
  console.log(`OK  ${label}`)
}

async function main() {
  const { GMAIL_USER, GMAIL_REFRESH_TOKEN } = process.env
  if (!GMAIL_USER || !GMAIL_REFRESH_TOKEN) throw new Error('GMAIL_USER and GMAIL_REFRESH_TOKEN must be set in .env.local')

  const to = process.argv[2] ?? GMAIL_USER
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  assertSent(
    'Account verification (platform sender)',
    await sendAccountVerificationEmail({
      to,
      name: 'Verify <Script> & Co',
      url: `${appUrl}/verify-email?email=${encodeURIComponent(to)}&check=1`,
    }),
  )

  // Test-only stand-in for a shop's connected Gmail: same credentials, passed explicitly.
  const testShopSender: GmailSender = { name: 'Café Repairs — Test', email: GMAIL_USER, refreshToken: GMAIL_REFRESH_TOKEN }
  assertSent(
    'Staff invitation (sender parameter)',
    await sendEmail(testShopSender, {
      to,
      subject: "You've been invited to join Café Repairs — Test on RepairTrack",
      html: buildStaffInvitationEmailHtml({
        inviterName: 'Owner <b>Test</b>',
        shopName: 'Café Repairs & Co',
        role: 'TECHNICIAN',
        inviteUrl: `${appUrl}/invite/verify-email-script`,
        expiresIn: '10 minutes',
      }),
    }),
  )

  console.log(`\nBoth emails sent to ${to}. Check the inbox: the header, card, button and footer should look unchanged.`)
}

main().catch((err) => {
  console.error('FAIL', err instanceof Error ? err.message : err)
  process.exit(1)
})
