import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import { TransactionSchema, TransactionStatusSchema, TransactionTypeSchema } from './transaction'

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
      createdAt: Timestamp.fromDate(new Date('2026-04-25T10:00:00Z')),
      completedAt: Timestamp.fromDate(new Date('2026-04-25T10:01:00Z')),
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
