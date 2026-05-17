import { describe, it, expect, beforeAll } from 'vitest'
import functionsTest from 'firebase-functions-test'

const testEnv = functionsTest()

beforeAll(() => {
  process.env.GCLOUD_PROJECT = 'adsmart-test'
})

describe('addUserCredits — authorization', () => {
  it('rejects unauthenticated callers', async () => {
    const { addUserCredits } = await import('../src/adminWalletManager')
    const wrapped = testEnv.wrap(addUserCredits)

    await expect(
      wrapped({
        data: { targetEmail: 'u@x.com', amount: 1000, reason: 'test reason text' },
        auth: undefined,
      } as any)
    ).rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('rejects non-admin authenticated callers', async () => {
    const { addUserCredits } = await import('../src/adminWalletManager')
    const wrapped = testEnv.wrap(addUserCredits)

    await expect(
      wrapped({
        data: { targetEmail: 'u@x.com', amount: 1000, reason: 'test reason text' },
        auth: {
          uid: 'not-admin',
          token: { email: 'regular@user.com', admin: false },
        },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('rejects missing targetEmail', async () => {
    const { addUserCredits } = await import('../src/adminWalletManager')
    const wrapped = testEnv.wrap(addUserCredits)

    await expect(
      wrapped({
        data: { amount: 1000, reason: 'test reason text' },
        auth: {
          uid: 'admin',
          token: { email: 'agency.elovisiondigital@gmail.com', admin: true },
        },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects non-positive amount', async () => {
    const { addUserCredits } = await import('../src/adminWalletManager')
    const wrapped = testEnv.wrap(addUserCredits)

    await expect(
      wrapped({
        data: { targetEmail: 'u@x.com', amount: 0, reason: 'test reason text' },
        auth: {
          uid: 'admin',
          token: { email: 'agency.elovisiondigital@gmail.com', admin: true },
        },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects amount above per-transaction cap', async () => {
    const { addUserCredits } = await import('../src/adminWalletManager')
    const wrapped = testEnv.wrap(addUserCredits)

    await expect(
      wrapped({
        data: { targetEmail: 'u@x.com', amount: 100001, reason: 'test reason text' },
        auth: {
          uid: 'admin',
          token: { email: 'agency.elovisiondigital@gmail.com', admin: true },
        },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects reason shorter than 10 chars', async () => {
    const { addUserCredits } = await import('../src/adminWalletManager')
    const wrapped = testEnv.wrap(addUserCredits)

    await expect(
      wrapped({
        data: { targetEmail: 'u@x.com', amount: 1000, reason: 'short' },
        auth: {
          uid: 'admin',
          token: { email: 'agency.elovisiondigital@gmail.com', admin: true },
        },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('accepts admin via `token.admin` claim even if email not in allowlist', async () => {
    const { addUserCredits } = await import('../src/adminWalletManager')
    const wrapped = testEnv.wrap(addUserCredits)

    // Will fail later in the flow (user lookup in emulator for nonexistent@x.com) but NOT with permission-denied
    await expect(
      wrapped({
        data: { targetEmail: 'nonexistent@x.com', amount: 1000, reason: 'test reason text' },
        auth: {
          uid: 'admin',
          token: { email: 'any@any.com', admin: true },
        },
        rawRequest: { ip: '127.0.0.1', headers: {} },
      } as any)
    ).rejects.not.toMatchObject({ code: 'permission-denied' })
  })
})
