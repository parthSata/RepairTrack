import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { db } from '@/server/db'
import { repairs } from '@/server/db/schema/repairs'

async function main() {
  const result = await db
    .select({
      id: repairs.id,
      ticketNumber: repairs.ticketNumber,
      trackingToken: repairs.trackingToken,
      status: repairs.status,
      estimatedCost: repairs.estimatedCost,
    })
    .from(repairs)
  console.log('REPAIRS_LIST:')
  console.log(JSON.stringify(result, null, 2))
}

main().catch(console.error).finally(() => process.exit(0))
