import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { setDoc, doc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'adsmart-rules-test',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
})

describe('users/{userId}', () => {
  it('owner can read their doc', async () => {
    const uid = 'u1'
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${uid}`), {
        email: 'u1@x.com',
        createdAt: new Date(),
      })
    })
    const db = env.authenticatedContext(uid).firestore()
    await assertSucceeds(getDoc(doc(db, `users/${uid}`)))
  })

  it('stranger cannot read someone else doc', async () => {
    const uid = 'u1'
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${uid}`), {
        email: 'u1@x.com',
        createdAt: new Date(),
      })
    })
    const db = env.authenticatedContext('stranger').firestore()
    await assertFails(getDoc(doc(db, `users/${uid}`)))
  })

  it('creating user with valid fields succeeds', async () => {
    const uid = 'u1'
    const db = env.authenticatedContext(uid).firestore()
    await assertSucceeds(
      setDoc(doc(db, `users/${uid}`), {
        email: 'u1@x.com',
        createdAt: serverTimestamp(),
      })
    )
  })

  it('creating user with invalid email fails', async () => {
    const uid = 'u1'
    const db = env.authenticatedContext(uid).firestore()
    await assertFails(
      setDoc(doc(db, `users/${uid}`), {
        email: 'not-an-email',
        createdAt: serverTimestamp(),
      })
    )
  })

  it('deleting own user doc is blocked', async () => {
    const uid = 'u1'
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${uid}`), {
        email: 'u1@x.com',
        createdAt: new Date(),
      })
    })
    const db = env.authenticatedContext(uid).firestore()
    await assertFails(deleteDoc(doc(db, `users/${uid}`)))
  })
})

describe('client-write-blocked collections', () => {
  const blocked = [
    'productPrices/p1',
    'reportTemplates/t1',
    'systemConfig/c1',
    'securityLogs/l1',
    'backupMetadata/b1',
  ]

  for (const path of blocked) {
    it(`write to ${path} is blocked even for authenticated users`, async () => {
      const db = env.authenticatedContext('u1').firestore()
      await assertFails(setDoc(doc(db, path), { any: 'value' }))
    })
  }

  it('authenticated user CAN read productPrices', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'productPrices/p1'), { price: 10 })
    })
    const db = env.authenticatedContext('u1').firestore()
    await assertSucceeds(getDoc(doc(db, 'productPrices/p1')))
  })

  it('securityLogs read is ALSO blocked for authenticated users', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'securityLogs/l1'), { any: 'value' })
    })
    const db = env.authenticatedContext('u1').firestore()
    await assertFails(getDoc(doc(db, 'securityLogs/l1')))
  })
})

describe('campaigns/{id}', () => {
  it('owner reads their campaign', async () => {
    const uid = 'u1'
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'campaigns/c1'), {
        userId: uid,
        name: 'C',
        budget: 0,
        status: 'draft',
        createdAt: new Date(),
      })
    })
    const db = env.authenticatedContext(uid).firestore()
    await assertSucceeds(getDoc(doc(db, 'campaigns/c1')))
  })

  it('non-owner cannot read someone else campaign', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'campaigns/c1'), {
        userId: 'owner',
        name: 'C',
        budget: 0,
        status: 'draft',
        createdAt: new Date(),
      })
    })
    const db = env.authenticatedContext('stranger').firestore()
    await assertFails(getDoc(doc(db, 'campaigns/c1')))
  })
})
