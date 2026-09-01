import { config } from 'dotenv'

config({ path: '.env.local' })

function isPoolerUrl(url: string): boolean {
  return url.includes('-pooler')
}

const databaseUrl = process.env.DATABASE_URL
const migrationUrl = process.env.MIGRATION_DATABASE_URL ?? databaseUrl

console.log('RepairTrack migration URL check\n')

if (!databaseUrl) {
  console.log('DATABASE_URL: missing')
  process.exit(1)
}

console.log(`DATABASE_URL: set (${isPoolerUrl(databaseUrl) ? 'pooled' : 'direct'})`)

if (process.env.MIGRATION_DATABASE_URL) {
  const migrationIsPooler = isPoolerUrl(process.env.MIGRATION_DATABASE_URL)
  console.log(
    `MIGRATION_DATABASE_URL: set (${migrationIsPooler ? 'pooled — must use direct URL' : 'direct — OK'})`,
  )

  if (migrationIsPooler) {
    console.log('\nAction required: replace MIGRATION_DATABASE_URL with Neon DIRECT connection (no -pooler).')
    console.log('See docs/customer-approval-testing.md §1')
    process.exit(1)
  }

  console.log('\nMigration setup looks good. Run: bun run db:migrate')
  process.exit(0)
}

console.log('MIGRATION_DATABASE_URL: not set')

if (isPoolerUrl(databaseUrl)) {
  console.log('\nAction required: add MIGRATION_DATABASE_URL (Neon direct URL) to .env.local')
  console.log('See docs/customer-approval-testing.md')
  process.exit(1)
}

console.log('\nDATABASE_URL is direct — migrations can use it. Run: bun run db:migrate')
process.exit(0)
