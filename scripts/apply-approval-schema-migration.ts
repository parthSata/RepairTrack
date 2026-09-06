import postgres from 'postgres'
import { config } from 'dotenv'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

config({ path: '.env.local' })

const connectionUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL!

if (!connectionUrl) {
  throw new Error('DATABASE_URL or MIGRATION_DATABASE_URL is required')
}

const sql = postgres(connectionUrl)

async function applyApprovalSchemaMigration() {
  const migrationPath = join(process.cwd(), 'drizzle', '0013_nappy_adam_warlock.sql')
  const raw = readFileSync(migrationPath, 'utf8')
  const statements = raw
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean)

  for (const statement of statements) {
    await sql.unsafe(statement)
  }

  await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    SELECT ${'0013_nappy_adam_warlock'}, ${Date.now()}
    WHERE NOT EXISTS (
      SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = '0013_nappy_adam_warlock'
    )
  `

  console.log('Applied repair approval schema migration (0013_nappy_adam_warlock).')
}

applyApprovalSchemaMigration()
  .then(async () => {
    await sql.end()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error(error)
    await sql.end()
    process.exit(1)
  })
