import { describe, it, expect } from 'vitest'
import { PasswordSchema, validatePassword, PASSWORD_MIN_LENGTH } from './password'

describe('validatePassword', () => {
  it('accepts a strong password', () => {
    const r = validatePassword('Strong1!')
    expect(r.valid).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('rejects too-short passwords', () => {
    const r = validatePassword('A1a!')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('passwordPolicy.tooShort')
  })

  it('rejects missing uppercase', () => {
    const r = validatePassword('strong1!')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('passwordPolicy.requireUppercase')
  })

  it('rejects missing lowercase', () => {
    const r = validatePassword('STRONG1!')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('passwordPolicy.requireLowercase')
  })

  it('rejects missing number', () => {
    const r = validatePassword('StrongAA!')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('passwordPolicy.requireNumber')
  })

  it('rejects missing special char', () => {
    const r = validatePassword('Strong11')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('passwordPolicy.requireSpecial')
  })

  it('aggregates multiple errors', () => {
    const r = validatePassword('a')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('passwordPolicy.tooShort')
    expect(r.errors).toContain('passwordPolicy.requireUppercase')
    expect(r.errors).toContain('passwordPolicy.requireNumber')
    expect(r.errors).toContain('passwordPolicy.requireSpecial')
  })
})

describe('PasswordSchema (zod)', () => {
  it('accepts a strong password', () => {
    expect(() => PasswordSchema.parse('Strong1!')).not.toThrow()
  })

  it('rejects a weak password with all failing rules', () => {
    expect(() => PasswordSchema.parse('weak')).toThrow()
  })

  it('PASSWORD_MIN_LENGTH constant is 8', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8)
  })
})
