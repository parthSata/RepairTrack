import { eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db } from '@/server/db'
import { users } from '@/server/db/schema'

export type AppUserRole = 'OWNER' | 'STAFF' | 'TECHNICIAN'

export async function resolveUserRole(
  userId: string,
  sessionRole?: string | null,
): Promise<AppUserRole> {
  if (sessionRole === 'OWNER' || sessionRole === 'STAFF' || sessionRole === 'TECHNICIAN') {
    return sessionRole
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { role: true },
  })

  const role = dbUser?.role
  if (role === 'OWNER' || role === 'STAFF' || role === 'TECHNICIAN') {
    return role
  }

  throw new HTTPException(403, { message: 'User role could not be resolved' })
}
