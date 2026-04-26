import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import { UserWalletSchema } from './userWallet'

const validWallet = {
  id: 'current',
  balance: 5000,
  currency: 'BRL',
  updatedAt: new Date('2026-04-26T12:00:00Z'),
}

describe('UserWalletSchema', () => {
  it('parses a valid wallet', () => {
    const result = UserWalletSchema.safeParse(validWallet)
    expect(result.success).toBe(true)
  })

  it('rejects a non-integer balance', () => {
    const result = UserWalletSchema.safeParse({ ...validWallet, balance: 12.5 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'balance')).toBe(true)
    }
  })

  it('rejects a negative balance', () => {
    const result = UserWalletSchema.safeParse({ ...validWallet, balance: -100 })
    expect(result.success).toBe(false)
  })

  it('rejects a non-BRL currency', () => {
    const result = UserWalletSchema.safeParse({ ...validWallet, currency: 'USD' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['currency'])
    }
  })

  it('rejects when updatedAt is missing', () => {
    const { updatedAt, ...incomplete } = validWallet
    void updatedAt
    const result = UserWalletSchema.safeParse(incomplete)
    expect(result.success).toBe(false)
  })

  it('normalizes a Firestore Timestamp on updatedAt', () => {
    const ts = Timestamp.fromDate(new Date('2026-04-26T12:00:00Z'))
    const result = UserWalletSchema.parse({ ...validWallet, updatedAt: ts })
    expect(result.updatedAt).toBeInstanceOf(Date)
  })
})
