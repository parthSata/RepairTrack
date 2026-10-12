/**
 * Pure helper functions for user registration and invite token parsing.
 * Keeps Better Auth hook decision logic isolated, predictable, and unit-testable.
 */

export function readShopName(body: unknown, userName?: string): string {
  const nameStr = userName?.trim() || 'Owner'
  const fallbackName = `${nameStr}'s shop`
  if (!body || typeof body !== 'object' || !('shopName' in body)) return fallbackName

  const shopName = (body as Record<string, unknown>).shopName
  if (typeof shopName !== 'string') return fallbackName

  const trimmedShopName = shopName.trim()
  if (trimmedShopName.length < 2 || trimmedShopName.length > 120) return fallbackName

  return trimmedShopName
}

export function readInviteToken(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('inviteToken' in body)) return null

  const token = (body as Record<string, unknown>).inviteToken
  if (typeof token !== 'string') return null

  const trimmedToken = token.trim()
  return trimmedToken.length > 0 ? trimmedToken : null
}

export type RegistrationPlan =
  | { type: 'oauth_invite'; token: string }
  | { type: 'body_invite'; token: string }
  | { type: 'new_shop' }

export function resolveRegistrationPlan(params: {
  oauthInviteToken: string | null
  bodyInviteToken: string | null
}): RegistrationPlan {
  if (params.oauthInviteToken) {
    return { type: 'oauth_invite', token: params.oauthInviteToken }
  }
  if (params.bodyInviteToken) {
    return { type: 'body_invite', token: params.bodyInviteToken }
  }
  return { type: 'new_shop' }
}
