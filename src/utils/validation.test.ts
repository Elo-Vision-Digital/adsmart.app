import { describe, expect, it } from 'vitest'
import { getPasswordStrength, validatePassword } from './validation'

describe('validatePassword', () => {
  it('accepts a password meeting all rules', () => {
    expect(validatePassword('Abcdef1!')).toEqual([])
  })

  it('rejects short passwords', () => {
    const errors = validatePassword('Ab1!')
    expect(errors.some((e) => e.includes('mínimo 8'))).toBe(true)
  })

  it('requires uppercase', () => {
    const errors = validatePassword('abcdef1!')
    expect(errors.some((e) => e.toLowerCase().includes('maiúscula'))).toBe(true)
  })

  it('requires lowercase', () => {
    const errors = validatePassword('ABCDEF1!')
    expect(errors.some((e) => e.toLowerCase().includes('minúscula'))).toBe(true)
  })

  it('requires number', () => {
    const errors = validatePassword('Abcdefgh!')
    expect(errors.some((e) => e.toLowerCase().includes('número'))).toBe(true)
  })

  it('requires special char', () => {
    const errors = validatePassword('Abcdefg1')
    expect(errors.some((e) => e.includes('especial'))).toBe(true)
  })

  it('accumulates multiple errors', () => {
    const errors = validatePassword('abc')
    expect(errors.length).toBeGreaterThanOrEqual(3)
  })
})

describe('getPasswordStrength', () => {
  it('returns a label and color for any input', () => {
    const s = getPasswordStrength('')
    expect(s.label).toBeTruthy()
    expect(s.color).toMatch(/^#/)
  })

  it('scores a strong password higher than a weak one', () => {
    const weak = getPasswordStrength('abc')
    const strong = getPasswordStrength('Abcdef123!@#')
    expect(strong.score).toBeGreaterThan(weak.score)
  })

  it('caps score at 5', () => {
    const s = getPasswordStrength('Abcdefghijk1234567!@#$')
    expect(s.score).toBeLessThanOrEqual(5)
  })
})
