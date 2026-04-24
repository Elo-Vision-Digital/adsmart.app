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

    await expect(
      wrapped({
        data: { code: 'x', state: 'does-not-exist' },
        auth: { uid: 'u1', token: {} },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects state belonging to another user', async () => {
    const a = getAdmin()
    await a.firestore().collection(STATE_COLLECTION).doc('state-x').set({
      userId: 'OTHER_USER',
      expiresAt: a.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
    })

    const { handleMetaAdsCallbackWithSelection } = await import('../src/metaAdsOAuthV2')
    const wrapped = testEnv.wrap(handleMetaAdsCallbackWithSelection)

    await expect(
      wrapped({
        data: { code: 'x', state: 'state-x' },
        auth: { uid: 'u1', token: {} },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('rejects expired state', async () => {
    const a = getAdmin()
    await a.firestore().collection(STATE_COLLECTION).doc('state-x').set({
      userId: 'u1',
      expiresAt: a.firestore.Timestamp.fromDate(new Date(Date.now() - 60 * 1000)),
    })

    const { handleMetaAdsCallbackWithSelection } = await import('../src/metaAdsOAuthV2')
    const wrapped = testEnv.wrap(handleMetaAdsCallbackWithSelection)

    await expect(
      wrapped({
        data: { code: 'x', state: 'state-x' },
        auth: { uid: 'u1', token: {} },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'deadline-exceeded' })
  })
})
