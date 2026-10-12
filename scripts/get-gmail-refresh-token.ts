/**
 * Helper script to generate a fresh GMAIL_REFRESH_TOKEN for .env.local.
 *
 * Run: bun run scripts/get-gmail-refresh-token.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { google } from 'googleapis'
import * as readline from 'readline'

const clientId = process.env.GMAIL_CLIENT_ID
const clientSecret = process.env.GMAIL_CLIENT_SECRET
// Use http://localhost:3000/api/settings/gmail/callback or out-of-band redirect URI
const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/settings/gmail/callback'

if (!clientId || !clientSecret) {
  console.error('Error: GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in .env.local')
  process.exit(1)
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

const scopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'openid',
  'email',
]

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: scopes,
})

console.log('\n============================================================')
console.log('Generate New Gmail Refresh Token')
console.log('============================================================\n')
console.log('1. Open this URL in your browser:\n')
console.log(authUrl)
console.log('\n2. Sign in with the platform Gmail account (e.g. ' + (process.env.GMAIL_USER || 'vimalsata737@gmail.com') + ')')
console.log('3. Authorize the application.')
console.log('4. After authorizing, you will be redirected. Copy the "code" query parameter from the redirected URL in your browser bar.')
console.log('   (Example URL: http://localhost:3000/api/settings/gmail/callback?code=4/0A...)')
console.log('\n5. Paste the code below:')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('\nEnter the authorization code: ', async (code) => {
  rl.close()
  const trimmedCode = code.trim()

  if (!trimmedCode) {
    console.error('No code provided. Aborting.')
    process.exit(1)
  }

  try {
    const { tokens } = await oauth2Client.getToken(trimmedCode)
    console.log('\n============================================================')
    console.log('Successfully acquired tokens!')
    console.log('============================================================\n')
    if (tokens.refresh_token) {
      console.log('Add or update this in your .env.local:\n')
      console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`)
    } else {
      console.warn('Warning: Google did not return a refresh_token.')
      console.warn('Make sure to select "prompt: consent" and revoke previous app permissions in your Google Account Security settings first.')
    }
  } catch (err) {
    console.error('\nFailed to exchange code for tokens:', err)
  }
  process.exit(0)
})
