import { describe, expect, it } from 'vitest'
import { OAuthStateSchema, TemporaryOAuthTokenSchema } from './oauthState'
import { fakeTimestamp } from './test-helpers'

const tsA = fakeTimestamp('2026-05-17T10:00:00.000Z')
const tsB = fakeTimestamp('2026-05-17T10:10:00.000Z')

describe('OAuthStateSchema', () => {
  it('accepts a google_ads state', () => {
    expect(
      OAuthStateSchema.parse({
        id: 'state_abc',
        userId: 'uid_123',
        platform: 'google_ads',
        isLocalEnv: false,
        createdAt: tsA,
        expiresAt: tsB,
      }).platform
    ).toBe('google_ads')
  })

  it('rejects unknown platform', () => {
    const r = OAuthStateSchema.safeParse({
      id: 'state_abc',
      userId: 'uid_123',
      platform: 'tiktok',
      isLocalEnv: false,
      createdAt: tsA,
      expiresAt: tsB,
    })
    expect(r.success).toBe(false)
  })
})

describe('TemporaryOAuthTokenSchema', () => {
  it('accepts a full token doc', () => {
    expect(
      TemporaryOAuthTokenSchema.parse({
        id: 'tok_abc',
        userId: 'uid_123',
        accessToken: 'ya29.x',
        refreshToken: '1//refresh',
        scope: 'https://www.googleapis.com/auth/adwords',
        expiresAt: tsB,
        createdAt: tsA,
      }).userId
    ).toBe('uid_123')
  })

  it('rejects missing refreshToken', () => {
    const r = TemporaryOAuthTokenSchema.safeParse({
      id: 'tok_abc',
      userId: 'uid_123',
      accessToken: 'ya29.x',
      scope: 'x',
      expiresAt: tsB,
      createdAt: tsA,
    })
    expect(r.success).toBe(false)
  })
})
