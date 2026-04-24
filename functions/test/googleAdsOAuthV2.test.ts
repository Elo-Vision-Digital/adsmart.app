import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import functionsTest from 'firebase-functions-test'
import { getAdmin } from './helpers/firestore'

const testEnv = functionsTest()

beforeAll(() => {
  process.env.GCLOUD_PROJECT = 'adsmart-test'
})

afterAll(() => {
  testEnv.cleanup()
})

beforeEach(async () => {
  const a = getAdmin()
  const snap = await a.firestore().collection('oauth_states').get()
  await Promise.all(snap.docs.map((d) => d.ref.delete()))
})

describe('handleGoogleAdsCallbackWithSelection — state validation', () => {
  it('rejects unauthenticated callers', async () => {
    const { handleGoogleAdsCallbackWithSelection } = await import('../src/googleAdsOAuthV2')
    const wrapped = testEnv.wrap(handleGoogleAdsCallbackWithSelection)

    await expect(
      wrapped({
        data: { code: 'x', state: 'y' },
        auth: undefined,
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('rejects missing code', async () => {
    const { handleGoogleAdsCallbackWithSelection } = await import('../src/googleAdsOAuthV2')
    const wrapped = testEnv.wrap(handleGoogleAdsCallbackWithSelection)

    await expect(
      wrapped({
        data: { state: 'y' },
        auth: { uid: 'u1', token: {} },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects missing state', async () => {
    const { handleGoogleAdsCallbackWithSelection } = await import('../src/googleAdsOAuthV2')
    const wrapped = testEnv.wrap(handleGoogleAdsCallbackWithSelection)

    await expect(
      wrapped({
        data: { code: 'x' },
        auth: { uid: 'u1', token: {} },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects state not present in Firestore', async () => {
    const { handleGoogleAdsCallbackWithSelection } = await import('../src/googleAdsOAuthV2')
    const wrapped = testEnv.wrap(handleGoogleAdsCallbackWithSelection)

    // NOTE: handler wraps inner HttpsError in an outer `internal` HttpsError
    // via a catch-all try/catch block. We assert on the message which is
    // preserved from the original `invalid-argument` error.
    await expect(
      wrapped({
        data: { code: 'x', state: 'does-not-exist' },
        auth: { uid: 'u1', token: {} },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'internal', message: 'State inválido' })
  })

  it('rejects state belonging to another user', async () => {
    const a = getAdmin()
    await a.firestore().collection('oauth_states').doc('state-x').set({
      userId: 'OTHER_USER',
      expiresAt: a.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
    })

    const { handleGoogleAdsCallbackWithSelection } = await import('../src/googleAdsOAuthV2')
    const wrapped = testEnv.wrap(handleGoogleAdsCallbackWithSelection)

    // NOTE: outer try/catch rewraps inner `permission-denied` as `internal`,
    // preserving the message `State não autorizado`.
    await expect(
      wrapped({
        data: { code: 'x', state: 'state-x' },
        auth: { uid: 'u1', token: {} },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'internal', message: 'State não autorizado' })
  })

  it('rejects expired state', async () => {
    const a = getAdmin()
    await a.firestore().collection('oauth_states').doc('state-x').set({
      userId: 'u1',
      expiresAt: a.firestore.Timestamp.fromDate(new Date(Date.now() - 60 * 1000)),
    })

    const { handleGoogleAdsCallbackWithSelection } = await import('../src/googleAdsOAuthV2')
    const wrapped = testEnv.wrap(handleGoogleAdsCallbackWithSelection)

    // NOTE: outer try/catch rewraps inner `deadline-exceeded` as `internal`,
    // preserving the message `State expirado`.
    await expect(
      wrapped({
        data: { code: 'x', state: 'state-x' },
        auth: { uid: 'u1', token: {} },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'internal', message: 'State expirado' })
  })
})
