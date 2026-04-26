import { describe, it, expect } from 'vitest'
import functionsTest from 'firebase-functions-test'

// Hoisted to module scope so it is set BEFORE functionsTest() initializes its
// internal Firebase app — initializing without a project ID can leave the test
// env unable to wrap callables consistently.
process.env.GCLOUD_PROJECT = 'adsmart-test'

const testEnv = functionsTest()

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

// Empty-Firestore payload-shape test only runs when the Firestore emulator is
// reachable. Without an emulator the v2 callable hangs on the first
// collectionGroup query. The auth/validation suite above covers the
// pre-Firestore paths.
async function isFirestoreEmulatorReachable(host: string): Promise<boolean> {
  try {
    const res = await fetch(`http://${host}/`, { signal: AbortSignal.timeout(500) })
    return res.status > 0
  } catch {
    return false
  }
}

describe('getDashboardMetrics — payload shape (empty Firestore)', () => {
  it('returns zeroed metrics with valid shape', async () => {
    const host = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
    const reachable = await isFirestoreEmulatorReachable(host)
    if (!reachable) {
      // eslint-disable-next-line no-console
      console.warn(`Skipping empty-Firestore payload test — emulator not reachable at ${host}`)
      return
    }
    const { getDashboardMetrics } = await import('../src/getDashboardMetrics')
    const { GetDashboardMetricsOutputSchema } = await import('@adsmart/shared')
    const wrapped = testEnv.wrap(getDashboardMetrics)
    const result = (await wrapped({ data: validInput, auth: adminAuth } as any)) as unknown
    const parsed = GetDashboardMetricsOutputSchema.safeParse(result)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.revenue.realCents).toBe(0)
      expect(parsed.data.revenue.creditsCents).toBe(0)
      expect(parsed.data.users.newCount).toBe(0)
      expect(parsed.data.users.activeCount).toBe(0)
      expect(parsed.data.integrations.byPlatform).toEqual([])
    }
  })
})
