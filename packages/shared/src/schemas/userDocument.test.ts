import { describe, expect, it } from 'vitest'
import {
  ReserveUserDocumentInputSchema,
  ReserveUserDocumentOutputSchema,
  UserDocumentSchema,
} from './userDocument'
import { fakeTimestamp } from './test-helpers'

describe('UserDocumentSchema', () => {
  it('accepts a CPF reservation', () => {
    expect(
      UserDocumentSchema.parse({
        id: '12345678909',
        userId: 'uid_123',
        documentType: 'cpf',
        createdAt: fakeTimestamp('2026-05-17T10:00:00.000Z'),
      }).id
    ).toBe('12345678909')
  })

  it('rejects a 10-digit id (neither CPF nor CNPJ)', () => {
    const r = UserDocumentSchema.safeParse({
      id: '1234567890',
      userId: 'uid_123',
      documentType: 'cpf',
      createdAt: fakeTimestamp('2026-05-17T10:00:00.000Z'),
    })
    expect(r.success).toBe(false)
  })
})

describe('ReserveUserDocumentInputSchema', () => {
  it('accepts a formatted CPF payload (server normalizes)', () => {
    const r = ReserveUserDocumentInputSchema.safeParse({
      documentType: 'cpf',
      documentNumber: '123.456.789-09',
    })
    expect(r.success).toBe(true)
  })

  it('accepts a stripped CPF payload', () => {
    const r = ReserveUserDocumentInputSchema.safeParse({
      documentType: 'cpf',
      documentNumber: '12345678909',
    })
    expect(r.success).toBe(true)
  })

  it('rejects an unknown documentType', () => {
    const r = ReserveUserDocumentInputSchema.safeParse({
      documentType: 'rg',
      documentNumber: '123456789',
    })
    expect(r.success).toBe(false)
  })

  it('rejects an empty documentNumber', () => {
    const r = ReserveUserDocumentInputSchema.safeParse({
      documentType: 'cpf',
      documentNumber: '',
    })
    expect(r.success).toBe(false)
  })
})

describe('ReserveUserDocumentOutputSchema', () => {
  it('requires success: true literal', () => {
    const r = ReserveUserDocumentOutputSchema.safeParse({
      success: false,
      documentType: 'cpf',
      documentNumber: '12345678909',
    })
    expect(r.success).toBe(false)
  })

  it('requires normalized documentNumber on output', () => {
    const r = ReserveUserDocumentOutputSchema.safeParse({
      success: true,
      documentType: 'cpf',
      documentNumber: '123.456.789-09',
    })
    expect(r.success).toBe(false)
  })
})
