import { describe, expect, it } from 'vitest'
import { BusinessTypeSchema } from './businessType'

describe('BusinessTypeSchema', () => {
  it.each([
    'launch',
    'local',
    'evergreen',
    'ecommerce',
    'content_distribution',
    'remarketing',
    'branding',
  ])('parses canonical business type %s', (type) => {
    const result = BusinessTypeSchema.safeParse(type)
    expect(result.success).toBe(true)
  })

  it('rejects unknown business type strings', () => {
    const result = BusinessTypeSchema.safeParse('subscription')
    expect(result.success).toBe(false)
  })

  it('rejects non-string values', () => {
    expect(BusinessTypeSchema.safeParse(undefined).success).toBe(false)
    expect(BusinessTypeSchema.safeParse(null).success).toBe(false)
    expect(BusinessTypeSchema.safeParse(42).success).toBe(false)
  })
})
