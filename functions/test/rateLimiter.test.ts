import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { getAdmin, clearCollection } from './helpers/firestore'

beforeAll(() => {
  getAdmin()
})

describe('checkRateLimit', () => {
  const userId = 'user-rate-limit-test'
  const action = 'recaptcha_verify'

  beforeEach(async () => {
    await clearCollection('rateLimits')
  })

  it('allows the first attempt and creates the document', async () => {
    const { checkRateLimit } = await import('../src/rateLimiter')
    const result = await checkRateLimit(userId, action, 3, 15)
    expect(result).toBe(true)

    const doc = await getAdmin().firestore().collection('rateLimits').doc(`${userId}_${action}`).get()
    expect(doc.exists).toBe(true)
    expect(doc.data()?.attempts).toBe(1)
    expect(doc.data()?.blocked).toBe(false)
  })

  it('increments attempts on subsequent calls within the window', async () => {
    const { checkRateLimit } = await import('../src/rateLimiter')
    await checkRateLimit(userId, action, 3, 15)
    await checkRateLimit(userId, action, 3, 15)
    const doc = await getAdmin().firestore().collection('rateLimits').doc(`${userId}_${action}`).get()
    expect(doc.data()?.attempts).toBe(2)
  })

  it('blocks after maxAttempts reached', async () => {
    const { checkRateLimit } = await import('../src/rateLimiter')
    await checkRateLimit(userId, action, 3, 15)
    await checkRateLimit(userId, action, 3, 15)
    await checkRateLimit(userId, action, 3, 15)

    await expect(checkRateLimit(userId, action, 3, 15)).rejects.toMatchObject({
      code: 'resource-exhausted',
    })

    const doc = await getAdmin().firestore().collection('rateLimits').doc(`${userId}_${action}`).get()
    expect(doc.data()?.blocked).toBe(true)
  })

  it('resets the counter after the window expires', async () => {
    const { checkRateLimit } = await import('../src/rateLimiter')
    const a = getAdmin()

    const twentyMinAgo = new Date(Date.now() - 20 * 60 * 1000)
    await a.firestore().collection('rateLimits').doc(`${userId}_${action}`).set({
      attempts: 5,
      firstAttempt: a.firestore.Timestamp.fromDate(twentyMinAgo),
      lastAttempt: a.firestore.Timestamp.fromDate(twentyMinAgo),
      blocked: false,
    })

    const result = await checkRateLimit(userId, action, 5, 15)
    expect(result).toBe(true)

    const doc = await a.firestore().collection('rateLimits').doc(`${userId}_${action}`).get()
    expect(doc.data()?.attempts).toBe(1)
    expect(doc.data()?.blocked).toBe(false)
  })

  it('keeps blocking while blocked flag is still within window', async () => {
    const { checkRateLimit } = await import('../src/rateLimiter')
    const a = getAdmin()

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    await a.firestore().collection('rateLimits').doc(`${userId}_${action}`).set({
      attempts: 5,
      firstAttempt: a.firestore.Timestamp.fromDate(fiveMinAgo),
      lastAttempt: a.firestore.Timestamp.fromDate(fiveMinAgo),
      blocked: true,
    })

    await expect(checkRateLimit(userId, action, 5, 15)).rejects.toMatchObject({
      code: 'resource-exhausted',
    })
  })
})
