import { describe, expect, it } from 'bun:test'
import {
  readInviteToken,
  readShopName,
  resolveRegistrationPlan,
} from './registration-logic'

describe('registration-logic: readShopName', () => {
  it('falls back to user-name-based shop name when body is empty or non-object', () => {
    expect(readShopName(null, 'Alice')).toBe("Alice's shop")
    expect(readShopName(undefined, 'Bob')).toBe("Bob's shop")
    expect(readShopName('invalid', 'Charlie')).toBe("Charlie's shop")
  })

  it('falls back to default Owner shop name when userName is empty', () => {
    expect(readShopName({}, '')).toBe("Owner's shop")
    expect(readShopName({}, '   ')).toBe("Owner's shop")
    expect(readShopName({}, undefined)).toBe("Owner's shop")
  })

  it('extracts and trims valid shopName from body', () => {
    expect(readShopName({ shopName: '  FixIt Fast Repairs  ' }, 'Dave')).toBe('FixIt Fast Repairs')
  })

  it('falls back to default name when shopName is too short (< 2 chars)', () => {
    expect(readShopName({ shopName: 'X' }, 'Dave')).toBe("Dave's shop")
    expect(readShopName({ shopName: '   ' }, 'Dave')).toBe("Dave's shop")
  })

  it('falls back to default name when shopName is too long (> 120 chars)', () => {
    const overlyLongName = 'A'.repeat(121)
    expect(readShopName({ shopName: overlyLongName }, 'Dave')).toBe("Dave's shop")
  })
})

describe('registration-logic: readInviteToken', () => {
  it('returns null when body is not an object or does not have inviteToken', () => {
    expect(readInviteToken(null)).toBeNull()
    expect(readInviteToken(undefined)).toBeNull()
    expect(readInviteToken({})).toBeNull()
    expect(readInviteToken({ otherField: 'val' })).toBeNull()
  })

  it('returns null when inviteToken is not a string or empty after trimming', () => {
    expect(readInviteToken({ inviteToken: 12345 })).toBeNull()
    expect(readInviteToken({ inviteToken: '' })).toBeNull()
    expect(readInviteToken({ inviteToken: '   ' })).toBeNull()
  })

  it('returns trimmed token when valid', () => {
    expect(readInviteToken({ inviteToken: '  token-abc-123  ' })).toBe('token-abc-123')
  })
})

describe('registration-logic: resolveRegistrationPlan', () => {
  it('prioritizes oauthInviteToken when present', () => {
    const plan = resolveRegistrationPlan({
      oauthInviteToken: 'oauth-token-1',
      bodyInviteToken: 'body-token-2',
    })
    expect(plan).toEqual({ type: 'oauth_invite', token: 'oauth-token-1' })
  })

  it('resolves bodyInviteToken when oauthInviteToken is null', () => {
    const plan = resolveRegistrationPlan({
      oauthInviteToken: null,
      bodyInviteToken: 'body-token-2',
    })
    expect(plan).toEqual({ type: 'body_invite', token: 'body-token-2' })
  })

  it('resolves to new_shop when both invite tokens are null', () => {
    const plan = resolveRegistrationPlan({
      oauthInviteToken: null,
      bodyInviteToken: null,
    })
    expect(plan).toEqual({ type: 'new_shop' })
  })
})
