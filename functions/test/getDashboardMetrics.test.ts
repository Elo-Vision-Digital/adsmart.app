import { describe, it, expect, beforeAll } from 'vitest'
import functionsTest from 'firebase-functions-test'

const testEnv = functionsTest()

beforeAll(() => {
  process.env.GCLOUD_PROJECT = 'adsmart-test'
})

const validInput = {
  startDate: '2026-04-01T00:00:00.000Z',
  endDate: '2026-04-26T23:59:59.999Z',
}

const adminAuth = {
  uid: 'admin-uid',
  token: { email: 'agency.elovisiondigital@gmail.com', admin: true },
}

describe('getDashboardMetrics — authorization', () => {
  it('rejects unauthenticated callers', async () => {
    const { getDashboardMetrics } = await import('../src/getDashboardMetrics')
    const wrapped = testEnv.wrap(getDashboardMetrics)
    await expect(
      wrapped({ data: validInput, auth: undefined } as any)
    ).rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('rejects non-admin authenticated callers', async () => {
    const { getDashboardMetrics } = await import('../src/getDashboardMetrics')
    const wrapped = testEnv.wrap(getDashboardMetrics)
    await expect(
      wrapped({
        data: validInput,
        auth: { uid: 'u', token: { email: 'regular@user.com', admin: false } },
      } as any)
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })
})

describe('getDashboardMetrics — input validation', () => {
  it('rejects malformed input shape', async () => {
    const { getDashboardMetrics } = await import('../src/getDashboardMetrics')
    const wrapped = testEnv.wrap(getDashboardMetrics)
    await expect(
      wrapped({ data: { startDate: 'bad', endDate: 'bad' }, auth: adminAuth } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects inverted range', async () => {
    const { getDashboardMetrics } = await import('../src/getDashboardMetrics')
    const wrapped = testEnv.wrap(getDashboardMetrics)
    await expect(
      wrapped({
        data: { startDate: validInput.endDate, endDate: validInput.startDate },
        auth: adminAuth,
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects ranges over 365 days', async () => {
    const { getDashboardMetrics } = await import('../src/getDashboardMetrics')
    const wrapped = testEnv.wrap(getDashboardMetrics)
    await expect(
      wrapped({
        data: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2026-01-01T00:00:00.000Z',
        },
        auth: adminAuth,
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })
})
