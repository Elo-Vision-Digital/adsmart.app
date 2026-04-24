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

const STATE_COLLECTION = 'oauth_states'

beforeEach(async () => {
  const a = getAdmin()
  const snap = await a.firestore().collection(STATE_COLLECTION).get()
  await Promise.all(snap.docs.map((d) => d.ref.delete()))
})

describe('handleMetaAdsCallbackWithSelection — state validation', () => {
  it('rejects unauthenticated callers', async () => {
    const { handleMetaAdsCallbackWithSelection } = await import('../src/metaAdsOAuthV2')
    const wrapped = testEnv.wrap(handleMetaAdsCallbackWithSelection)

    await expect(
      wrapped({
        data: { code: 'x', state: 'y' },
        auth: undefined,
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('rejects missing code', async () => {
    const { handleMetaAdsCallbackWithSelection } = await import('../src/metaAdsOAuthV2')
    const wrapped = testEnv.wrap(handleMetaAdsCallbackWithSelection)

    await expect(
      wrapped({
        data: { state: 'y' },
        auth: { uid: 'u1', token: {} },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects missing state', async () => {
    const { handleMetaAdsCallbackWithSelection } = await import('../src/metaAdsOAuthV2')
    const wrapped = testEnv.wrap(handleMetaAdsCallbackWithSelection)

    await expect(
      wrapped({
        data: { code: 'x' },
        auth: { uid: 'u1', token: {} },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects state not present in Firestore', async () => {
    const { handleMetaAdsCallbackWithSelection } = await import('../src/metaAdsOAuthV2')
    const wrapped = testEnv.wrap(handleMetaAdsCallbackWithSelection)

    // NOTE: Meta handler wraps inner HttpsError via a catch-all try/catch.
    // Unlike Google Ads, Meta's catch block discards the original message
    // (falls through to the generic fallback at line 257), so the outer
    // error surfaces as `internal` with the generic Meta message.
    await expect(
      wrapped({
        data: { code: 'x', state: 'does-not-exist' },
        auth: { uid: 'u1', token: {} },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({
      code: 'internal',
      message: 'Erro ao conectar conta Meta Ads',
    })
  })

  it('rejects state belonging to another user', async () => {
    const a = getAdmin()
    await a.firestore().collection(STATE_COLLECTION).doc('state-x').set({
      userId: 'OTHER_USER',
      expiresAt: a.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
    })

    const { handleMetaAdsCallbackWithSelection } = await import('../src/metaAdsOAuthV2')
    const wrapped = testEnv.wrap(handleMetaAdsCallbackWithSelection)

    // NOTE: inner `permission-denied` is rewrapped as `internal` with the
    // generic Meta fallback message (original message is not preserved).
    await expect(
      wrapped({
        data: { code: 'x', state: 'state-x' },
        auth: { uid: 'u1', token: {} },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({
      code: 'internal',
      message: 'Erro ao conectar conta Meta Ads',
    })
  })

  it('rejects expired state', async () => {
    const a = getAdmin()
    await a.firestore().collection(STATE_COLLECTION).doc('state-x').set({
      userId: 'u1',
      expiresAt: a.firestore.Timestamp.fromDate(new Date(Date.now() - 60 * 1000)),
    })

    const { handleMetaAdsCallbackWithSelection } = await import('../src/metaAdsOAuthV2')
    const wrapped = testEnv.wrap(handleMetaAdsCallbackWithSelection)

    // NOTE: inner `deadline-exceeded` is rewrapped as `internal` with the
    // generic Meta fallback message (original message is not preserved).
    await expect(
      wrapped({
        data: { code: 'x', state: 'state-x' },
        auth: { uid: 'u1', token: {} },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({
      code: 'internal',
      message: 'Erro ao conectar conta Meta Ads',
    })
  })
})
