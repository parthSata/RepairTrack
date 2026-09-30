import { HTTPException } from 'hono/http-exception'
import { auth } from '@/server/auth'

export type ShopRole = 'OWNER' | 'STAFF' | 'TECHNICIAN'

/** Resolves the session and rejects users outside `roles` or without a shop (401 / 403). */
export async function requireRole(
  request: Request,
  roles: readonly ShopRole[],
  forbiddenMessage: string,
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })

  const role = (session.user.role ?? 'OWNER') as ShopRole
  const shopId = session.user.shopId
  if (!roles.includes(role) || !shopId) {
    throw new HTTPException(403, { message: forbiddenMessage })
  }

  return { shopId, userId: session.user.id, email: session.user.email, role }
}
