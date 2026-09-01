import { config } from 'dotenv'
import { spawnSync } from 'node:child_process'

config({ path: '.env.local' })

function isPoolerUrl(url: string): boolean {
  return url.includes('-pooler')
}

function printPoolerFix() {
  console.error(`
RepairTrack database migration blocked.

Your DATABASE_URL uses Neon's connection pooler (-pooler in the hostname).
Drizzle migrations need a direct PostgreSQL connection.

Fix (one-time setup):
1. Open Neon Dashboard -> your project -> Connection Details
2. Copy the DIRECT connection string (not "Pooled")
3. Add it to repairtrack-frontend/.env.local:

   MIGRATION_DATABASE_URL=postgresql://...@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

4. Keep DATABASE_URL on the pooled URL for the running app.
5. Re-run: bun run db:migrate

See docs/customer-approval-testing.md for full setup and testing steps.
`)
}

const databaseUrl = process.env.DATABASE_URL
const migrationUrl = process.env.MIGRATION_DATABASE_URL ?? databaseUrl

if (!migrationUrl) {
  console.error('Missing DATABASE_URL in .env.local')
  process.exit(1)
}

if (!process.env.MIGRATION_DATABASE_URL && databaseUrl && isPoolerUrl(databaseUrl)) {
  printPoolerFix()
  process.exit(1)
}

if (process.env.MIGRATION_DATABASE_URL && isPoolerUrl(process.env.MIGRATION_DATABASE_URL)) {
  console.error(`
MIGRATION_DATABASE_URL must use Neon's DIRECT connection (hostname without -pooler).
You currently have a pooled URL in MIGRATION_DATABASE_URL.

Fix:
1. Neon Dashboard -> Connection Details -> copy DIRECT string
2. Update MIGRATION_DATABASE_URL in .env.local
3. Re-run: bun run db:migrate

See docs/customer-approval-testing.md
`)
  process.exit(1)
}

console.log(
  process.env.MIGRATION_DATABASE_URL
    ? 'Running migrations via MIGRATION_DATABASE_URL (direct connection).'
    : 'Running migrations via DATABASE_URL.',
)

const result = spawnSync('bunx', ['drizzle-kit', 'migrate'], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
  cwd: process.cwd(),
})

process.exit(result.status ?? 1)
