import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PRODUCT_PRICES,
  ProductPriceSchema,
  UpdateProductPriceInputSchema,
  UpdateProductPricesInputSchema,
} from './productPrice'
import { fakeTimestamp } from './test-helpers'

const validStored = {
  id: 'google_lancamento',
  name: 'Dashboard Google Ads - Lançamento',
  description: 'Test',
  price: 10,
  category: 'google' as const,
  type: 'lancamento' as const,
  isActive: true,
  updatedAt: fakeTimestamp('2026-01-01T00:00:00.000Z'),
  updatedBy: 'admin@adsmart.app',
}

describe('ProductPriceSchema', () => {
  it('accepts a well-formed price doc', () => {
    expect(ProductPriceSchema.parse(validStored).id).toBe('google_lancamento')
  })

  it('rejects negative price', () => {
    const r = ProductPriceSchema.safeParse({ ...validStored, price: -1 })
    expect(r.success).toBe(false)
  })

  it('rejects unknown category', () => {
    const r = ProductPriceSchema.safeParse({ ...validStored, category: 'tiktok' })
    expect(r.success).toBe(false)
  })
})

describe('UpdateProductPriceInputSchema', () => {
  it('omits server-stamped fields', () => {
    const r = UpdateProductPriceInputSchema.safeParse(validStored)
    expect(r.success).toBe(true)
    if (r.success) {
      expect((r.data as Record<string, unknown>).updatedAt).toBeUndefined()
      expect((r.data as Record<string, unknown>).updatedBy).toBeUndefined()
    }
  })
})

describe('UpdateProductPricesInputSchema', () => {
  it('requires at least one price', () => {
    const r = UpdateProductPricesInputSchema.safeParse({ prices: [] })
    expect(r.success).toBe(false)
  })

  it('caps batch size at 50', () => {
    const r = UpdateProductPricesInputSchema.safeParse({
      prices: Array.from({ length: 51 }, () => ({
        id: 'google_lancamento',
        name: 'x',
        description: '',
        price: 1,
        category: 'google' as const,
        type: 'lancamento' as const,
        isActive: true,
      })),
    })
    expect(r.success).toBe(false)
  })
})

describe('DEFAULT_PRODUCT_PRICES', () => {
  it('all entries satisfy UpdateProductPriceInputSchema', () => {
    for (const entry of DEFAULT_PRODUCT_PRICES) {
      expect(UpdateProductPriceInputSchema.parse(entry).id).toBe(entry.id)
    }
  })
})

describe('ProductPriceSchema — campos novos do redesign (FOUND-1)', () => {
  it('parses doc with new creditsPerReport field', () => {
    const withCredits = { ...validStored, creditsPerReport: 1 }
    expect(ProductPriceSchema.safeParse(withCredits).success).toBe(true)
  })

  it('parses doc WITHOUT creditsPerReport (legacy compat)', () => {
    expect(ProductPriceSchema.safeParse(validStored).success).toBe(true)
  })

  it('rejects creditsPerReport = 0', () => {
    const invalid = { ...validStored, creditsPerReport: 0 }
    expect(ProductPriceSchema.safeParse(invalid).success).toBe(false)
  })

  it('rejects negative creditsPerReport', () => {
    const invalid = { ...validStored, creditsPerReport: -1 }
    expect(ProductPriceSchema.safeParse(invalid).success).toBe(false)
  })

  it('rejects non-integer creditsPerReport', () => {
    const invalid = { ...validStored, creditsPerReport: 1.5 }
    expect(ProductPriceSchema.safeParse(invalid).success).toBe(false)
  })

  it('UpdateProductPriceInputSchema accepts creditsPerReport in admin update', () => {
    const update = { ...validStored, creditsPerReport: 2 }
    const result = UpdateProductPriceInputSchema.safeParse(update)
    expect(result.success).toBe(true)
  })
})
