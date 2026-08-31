import postgres from 'postgres'
import { config } from 'dotenv'

config({ path: '.env.local' })

const sql = postgres(process.env.DATABASE_URL!)

async function applyTrackingTokenMigration() {
  await sql`
    ALTER TABLE "repairs" ADD COLUMN IF NOT EXISTS "tracking_token" text;
  `
  await sql`
    CREATE INDEX IF NOT EXISTS "repairs_tracking_token_idx" ON "repairs" USING btree ("tracking_token");
  `
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'repairs_tracking_token_unique'
      ) THEN
        ALTER TABLE "repairs" ADD CONSTRAINT "repairs_tracking_token_unique" UNIQUE("tracking_token");
      END IF;
    END $$;
  `

  console.log('Applied tracking_token migration SQL.')
}

applyTrackingTokenMigration()
  .then(async () => {
    await sql.end()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error(error)
    await sql.end()
    process.exit(1)
  })
