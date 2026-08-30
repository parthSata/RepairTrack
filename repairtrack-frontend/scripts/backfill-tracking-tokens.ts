import { eq, isNull } from 'drizzle-orm'
import { db } from '@/server/db'
import { repairs } from '@/server/db/schema/repairs'
import { generateTrackingToken } from '@/server/lib/tokens'

async function backfillTrackingTokens() {
  const rows = await db
    .select({ id: repairs.id })
    .from(repairs)
    .where(isNull(repairs.trackingToken))

  for (const row of rows) {
    let retries = 5
    while (retries > 0) {
      try {
        await db
          .update(repairs)
          .set({ trackingToken: generateTrackingToken() })
          .where(eq(repairs.id, row.id))
        break
      } catch {
        retries -= 1
      }
    }
  }

  console.log(`Backfilled tracking tokens for ${rows.length} repair(s).`)
}

backfillTrackingTokens()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
