import { HTTPException } from 'hono/http-exception'
import { auth } from '@/server/auth'

export type ShopRole = 'OWNER' | 'STAFF' | 'TECHNICIAN'

export const SHOP_ROLES: readonly ShopRole[] = ['OWNER', 'STAFF', 'TECHNICIAN'] as const

/**
 * Better Auth reads the user from the database on every getSession (cookie cache is off),
 * so status and role are always current. cookieCache must not be enabled without changing this.
 *
 * Resolves the session and enforces active user status, valid shop role, and shop isolation.
 */
export async function requireRole(
  request: Request,
  roles: readonly ShopRole[],
  forbiddenMessage: string,
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  if (session.user.status !== 'ACTIVE') {
    throw new HTTPException(403, { message: 'Account deactivated' })
  }

  const role = session.user.role as ShopRole | undefined
  const shopId = session.user.shopId
  if (!role || !SHOP_ROLES.includes(role) || !roles.includes(role) || !shopId) {
    throw new HTTPException(403, { message: forbiddenMessage })
  }

  return { shopId, userId: session.user.id, email: session.user.email, role, userRole: role }
}
