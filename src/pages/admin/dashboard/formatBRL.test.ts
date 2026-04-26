import { describe, expect, it } from 'vitest'
import { formatBRL } from './formatBRL'

describe('formatBRL', () => {
  it('formats zero', () => {
    expect(formatBRL(0)).toBe('R$ 0,00')
  })
  it('formats whole reais', () => {
    expect(formatBRL(10000)).toBe('R$ 100,00')
  })
  it('formats fractional reais', () => {
    expect(formatBRL(12345)).toBe('R$ 123,45')
  })
  it('formats large amounts with thousand separator', () => {
    expect(formatBRL(123456789)).toBe('R$ 1.234.567,89')
  })
})
