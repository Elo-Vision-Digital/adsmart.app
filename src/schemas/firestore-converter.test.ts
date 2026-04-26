import { Timestamp } from 'firebase/firestore'
import { describe, expect, it, vi } from 'vitest'
import * as z from 'zod'
import { zodConverter, zTimestamp } from './firestore-converter'

describe('zTimestamp()', () => {
  it('converts a Firestore Timestamp to a native Date', () => {
    const ts = Timestamp.fromDate(new Date('2026-04-26T12:00:00Z'))
    const parsed = zTimestamp().parse(ts)
    expect(parsed).toBeInstanceOf(Date)
    expect(parsed.toISOString()).toBe('2026-04-26T12:00:00.000Z')
  })

  it('passes through a native Date unchanged', () => {
    const date = new Date('2026-04-26T12:00:00Z')
    const parsed = zTimestamp().parse(date)
    expect(parsed).toBeInstanceOf(Date)
    expect(parsed.getTime()).toBe(date.getTime())
  })

  it('rejects values that are neither Date nor Timestamp', () => {
    const result = zTimestamp().safeParse('2026-04-26')
    expect(result.success).toBe(false)
  })
})

describe('zodConverter()', () => {
  const FooSchema = z.object({
    id: z.string(),
    name: z.string(),
    count: z.number().int(),
  })

  describe('fromFirestore', () => {
    it('returns parsed data for a valid snapshot', () => {
      const converter = zodConverter(FooSchema, 'Foo')
      const snapshot = {
        id: 'doc-1',
        data: () => ({ name: 'hello', count: 42 }),
      } as never
      const result = converter.fromFirestore(snapshot)
      expect(result).toEqual({ id: 'doc-1', name: 'hello', count: 42 })
    })

    it('logs a structured error and returns the raw shape on schema mismatch', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const converter = zodConverter(FooSchema, 'Foo')
      const snapshot = {
        id: 'doc-2',
        data: () => ({ name: 123, count: 'oops' }),
      } as never

      const result = converter.fromFirestore(snapshot)

      expect(consoleSpy).toHaveBeenCalledOnce()
      expect(consoleSpy.mock.calls[0]?.[0]).toContain('[zodConverter:Foo]')
      expect(result).toEqual({ id: 'doc-2', name: 123, count: 'oops' })

      consoleSpy.mockRestore()
    })
  })

  describe('toFirestore', () => {
    it('strips the id field before writing', () => {
      const converter = zodConverter(FooSchema, 'Foo')
      const written = converter.toFirestore({ id: 'doc-1', name: 'hello', count: 42 })
      expect(written).toEqual({ name: 'hello', count: 42 })
      expect(written).not.toHaveProperty('id')
    })

    it('throws on invalid input (strict parse)', () => {
      const converter = zodConverter(FooSchema, 'Foo')
      expect(() =>
        converter.toFirestore({ id: 'doc-1', name: 'hello', count: 'not-a-number' } as never)
      ).toThrow()
    })
  })
})
