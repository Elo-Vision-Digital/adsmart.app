import { fakeTimestamp } from './test-helpers'
import { describe, expect, it } from 'vitest'
import {
  TransactionProviderSchema,
  TransactionSchema,
  TransactionStatusSchema,
  TransactionTypeSchema,
} from './transaction'

const validTransaction = {
  id: 'tx-001',
  type: 'credit',
  amount: 5000,
  description: 'Adição de créditos via PIX',
  status: 'completed',
  createdAt: new Date('2026-04-25T10:00:00Z'),
}

describe('TransactionSchema', () => {
  it('parses a minimal valid transaction', () => {
    const result = TransactionSchema.safeParse(validTransaction)
    expect(result.success).toBe(true)
  })

  it('parses an admin-credit transaction with all optional admin metadata', () => {
    const adminTx = {
      ...validTransaction,
      adminAction: true,
      adminEmail: 'admin@adsmart.app',
      adminReason: 'Compensação manual',
      adminIP: '192.0.2.1',
    }
    const result = TransactionSchema.safeParse(adminTx)
    expect(result.success).toBe(true)
  })

  it('parses a SuitPay PIX credit with payer metadata and completedAt', () => {
    const pixTx = {
      ...validTransaction,
      paymentId: 'pix-9999',
      payerName: 'João da Silva',
      payerCpf: '123***',
      completedAt: new Date('2026-04-25T10:01:00Z'),
    }
    const result = TransactionSchema.safeParse(pixTx)
    expect(result.success).toBe(true)
  })

  it('parses a debit transaction with reportId', () => {
    const debitTx = {
      ...validTransaction,
      type: 'debit',
      description: 'Geração de relatório',
      reportId: 'report-123',
    }
    const result = TransactionSchema.safeParse(debitTx)
    expect(result.success).toBe(true)
  })

  it('rejects when description is missing', () => {
    const { description, ...incomplete } = validTransaction
    void description
    const result = TransactionSchema.safeParse(incomplete)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'description')).toBe(true)
    }
  })

  it('rejects an invalid type', () => {
    const result = TransactionSchema.safeParse({ ...validTransaction, type: 'refund' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['type'])
    }
  })

  it('rejects an invalid status', () => {
    const result = TransactionSchema.safeParse({ ...validTransaction, status: 'cancelled' })
    expect(result.success).toBe(false)
  })

  it('rejects a non-integer amount', () => {
    const result = TransactionSchema.safeParse({ ...validTransaction, amount: 50.5 })
    expect(result.success).toBe(false)
  })

  it('normalizes Firestore Timestamps on createdAt and completedAt', () => {
    const result = TransactionSchema.parse({
      ...validTransaction,
      createdAt: fakeTimestamp('2026-04-25T10:00:00Z'),
      completedAt: fakeTimestamp('2026-04-25T10:01:00Z'),
    })
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.completedAt).toBeInstanceOf(Date)
  })
})

describe('TransactionTypeSchema', () => {
  it('accepts credit and debit', () => {
    expect(TransactionTypeSchema.parse('credit')).toBe('credit')
    expect(TransactionTypeSchema.parse('debit')).toBe('debit')
  })
})

describe('TransactionStatusSchema', () => {
  it('accepts the three states', () => {
    for (const s of ['pending', 'completed', 'failed'] as const) {
      expect(TransactionStatusSchema.parse(s)).toBe(s)
    }
  })
})

describe('TransactionProviderSchema', () => {
  it.each(['admin', 'stripe', 'legacy'])('parses provider %s', (p) => {
    expect(TransactionProviderSchema.safeParse(p).success).toBe(true)
  })

  it('rejects unknown provider', () => {
    expect(TransactionProviderSchema.safeParse('asaas').success).toBe(false)
    expect(TransactionProviderSchema.safeParse('suitpay').success).toBe(false)
  })
})

describe('TransactionSchema — campos novos do redesign (FOUND-1)', () => {
  it('parses transaction with provider and clientRequestId', () => {
    const tx = {
      ...validTransaction,
      provider: 'admin' as const,
      clientRequestId: 'd1bcad8e-1a4f-4f0c-b3e0-2ad7b6e9b0e1',
    }
    expect(TransactionSchema.safeParse(tx).success).toBe(true)
  })

  it('parses transaction with stripe future fields (preparation only)', () => {
    const tx = {
      ...validTransaction,
      provider: 'stripe' as const,
      stripePaymentIntentId: 'pi_1ABC123',
      stripeCustomerId: 'cus_XYZ',
      stripeChargeId: 'ch_DEF456',
    }
    expect(TransactionSchema.safeParse(tx).success).toBe(true)
  })

  it('rejects clientRequestId longer than 64 chars', () => {
    const tx = { ...validTransaction, clientRequestId: 'x'.repeat(65) }
    expect(TransactionSchema.safeParse(tx).success).toBe(false)
  })
})
