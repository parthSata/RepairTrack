import { db } from '../src/server/db'
import { users } from '../src/server/db/schema'

async function main() {
  await db.update(users).set({ emailVerified: true })
  console.log('Successfully set emailVerified = true for all users')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
