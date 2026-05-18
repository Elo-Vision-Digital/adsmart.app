import { describe, expect, it } from 'vitest'
import { UserClientUpdateSchema, UserSchema } from './user'
import { fakeTimestamp } from './test-helpers'

const ts = fakeTimestamp('2026-05-17T10:00:00.000Z')

describe('UserSchema', () => {
  it('accepts a bootstrap-only doc (email + createdAt + updatedAt)', () => {
    expect(
      UserSchema.parse({
        id: 'uid_123',
        email: 'user@example.com',
        createdAt: ts,
        updatedAt: ts,
      }).id
    ).toBe('uid_123')
  })

  it('accepts a fully-filled doc with a CPF (11 digits)', () => {
    const parsed = UserSchema.parse({
      id: 'uid_123',
      email: 'user@example.com',
      name: 'Eduardo',
      phone: '+5562999990000',
      documentType: 'cpf',
      documentNumber: '12345678909',
      createdAt: ts,
      updatedAt: ts,
    })
    expect(parsed.documentType).toBe('cpf')
  })

  it('accepts a CNPJ (14 digits)', () => {
    expect(
      UserSchema.parse({
        id: 'uid_456',
        email: 'corp@example.com',
        documentType: 'cnpj',
        documentNumber: '12345678000190',
        createdAt: ts,
        updatedAt: ts,
      }).documentNumber
    ).toBe('12345678000190')
  })

  it('rejects malformed email', () => {
    const r = UserSchema.safeParse({
      id: 'uid_123',
      email: 'not-an-email',
      createdAt: ts,
      updatedAt: ts,
    })
    expect(r.success).toBe(false)
  })

  it('rejects formatted documentNumber (must be digits-only)', () => {
    const r = UserSchema.safeParse({
      id: 'uid_123',
      email: 'user@example.com',
      documentType: 'cpf',
      documentNumber: '123.456.789-09',
      createdAt: ts,
      updatedAt: ts,
    })
    expect(r.success).toBe(false)
  })
})

describe('UserClientUpdateSchema', () => {
  it('accepts a name + phone update', () => {
    const r = UserClientUpdateSchema.safeParse({ name: 'Eduardo', phone: '+5562999990000' })
    expect(r.success).toBe(true)
  })

  it('rejects email in the payload (rules block it; we mirror that)', () => {
    const r = UserClientUpdateSchema.safeParse({ email: 'a@b.com' })
    expect(r.success).toBe(false)
  })

  it('rejects createdAt in the payload', () => {
    const r = UserClientUpdateSchema.safeParse({ createdAt: ts })
    expect(r.success).toBe(false)
  })

  it('rejects documentNumber (must go through reserveUserDocument)', () => {
    const r = UserClientUpdateSchema.safeParse({ documentNumber: '12345678909' })
    expect(r.success).toBe(false)
  })
})
