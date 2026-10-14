import { randomBytes } from 'node:crypto'

const base64Key = randomBytes(32).toString('base64')
const hexKey = randomBytes(32).toString('hex')

console.log('\n🔑 Generated 32-Byte Cryptographic Keys:\n')
console.log('For Base64 Encryption Keys (PENDING_REGISTRATION_ENCRYPTION_KEY, GMAIL_TOKEN_ENCRYPTION_KEY):')
console.log(`\x1b[32m${base64Key}\x1b[0m\n`)
console.log('For Hex / Random Secrets (BETTER_AUTH_SECRET):')
console.log(`\x1b[36m${hexKey}\x1b[0m\n`)
