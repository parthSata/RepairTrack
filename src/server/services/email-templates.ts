export function buildVerificationEmailHtml({ name, url }: { name: string; url: string }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your RepairTrack Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:28px 32px;text-align:left;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#2563eb;color:#ffffff;font-weight:bold;font-size:14px;border-radius:6px;padding:6px 10px;">RT</td>
                  <td style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.5px;padding-left:10px;">RepairTrack</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding:32px;color:#334155;font-size:15px;line-height:1.6;">
              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">Verify your email address</h1>
              <p style="margin:0 0 20px 0;">Hi <strong>${name}</strong>,</p>
              <p style="margin:0 0 24px 0;color:#475569;">Welcome to RepairTrack! Please verify your email address to complete your registration and activate your shop workspace.</p>
              
              <!-- CTA Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                <tr>
                  <td align="center" style="border-radius:8px;background-color:#2563eb;">
                    <a href="${url}" style="font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;display:inline-block;background-color:#2563eb;">Verify Email Address &rarr;</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px 0;font-size:13px;color:#64748b;">If the button above doesn't work, copy and paste this link into your browser:</p>
              <p style="margin:0 0 24px 0;font-size:12px;word-break:break-all;color:#2563eb;"><a href="${url}" style="color:#2563eb;text-decoration:underline;">${url}</a></p>
              
              <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />
              <p style="margin:0;font-size:13px;color:#94a3b8;">If you did not create a RepairTrack account, you can safely ignore this email.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;font-size:12px;color:#94a3b8;">
              &copy; ${new Date().getFullYear()} RepairTrack. Repair shop operations, organized.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
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
  const roleTitle = role === 'TECHNICIAN' ? 'Technician' : 'Staff Member'
  const roleBadgeColor = role === 'TECHNICIAN' ? '#7c3aed' : '#2563eb'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to join ${shopName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:28px 32px;text-align:left;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#2563eb;color:#ffffff;font-weight:bold;font-size:14px;border-radius:6px;padding:6px 10px;">RT</td>
                  <td style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.5px;padding-left:10px;">RepairTrack</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding:32px;color:#334155;font-size:15px;line-height:1.6;">
              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">Team Invitation</h1>
              <p style="margin:0 0 20px 0;color:#475569;"><strong>${inviterName}</strong> has invited you to join <strong>${shopName}</strong> on RepairTrack as a team member.</p>
              
              <!-- Invitation Details Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;">
                <tr>
                  <td style="font-size:13px;color:#64748b;padding-bottom:6px;">Shop:</td>
                  <td align="right" style="font-size:14px;font-weight:600;color:#0f172a;padding-bottom:6px;">${shopName}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#64748b;padding-bottom:6px;">Role:</td>
                  <td align="right" style="font-size:13px;font-weight:600;color:${roleBadgeColor};padding-bottom:6px;">${roleTitle}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#64748b;">Expires in:</td>
                  <td align="right" style="font-size:13px;font-weight:500;color:#64748b;">7 Days</td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                <tr>
                  <td align="center" style="border-radius:8px;background-color:#2563eb;">
                    <a href="${inviteUrl}" style="font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;display:inline-block;background-color:#2563eb;">Accept Invitation &rarr;</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px 0;font-size:13px;color:#64748b;">Or copy and paste this link into your browser:</p>
              <p style="margin:0 0 24px 0;font-size:12px;word-break:break-all;color:#2563eb;"><a href="${inviteUrl}" style="color:#2563eb;text-decoration:underline;">${inviteUrl}</a></p>
              
              <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />
              <p style="margin:0;font-size:13px;color:#94a3b8;">If you were not expecting this invitation, you can ignore this email.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;font-size:12px;color:#94a3b8;">
              &copy; ${new Date().getFullYear()} RepairTrack. Repair shop operations, organized.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
