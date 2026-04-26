import * as admin from 'firebase-admin'
import { type CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https'
import {
  GetDashboardMetricsInputSchema,
  type GetDashboardMetricsOutput,
} from '@adsmart/shared'

if (!admin.apps.length) {
  admin.initializeApp()
}

const ADMIN_EMAILS = ['agency.elovisiondigital@gmail.com', 'admin@adsmart.app']

function assertAdmin(auth: CallableRequest['auth']) {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }
  const email = typeof auth.token.email === 'string' ? auth.token.email : ''
  const isAdmin = auth.token.admin === true || ADMIN_EMAILS.includes(email)
  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Acesso restrito a administradores')
  }
}

const TZ = 'America/Sao_Paulo'
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function dayKey(date: Date): string {
  return dayKeyFormatter.format(date) // YYYY-MM-DD in São Paulo TZ
}

function enumerateDays(startISO: string, endISO: string): string[] {
  const start = new Date(startISO)
  const end = new Date(endISO)
  const days: string[] = []
  const cursor = new Date(start)
  while (cursor.getTime() <= end.getTime()) {
    days.push(dayKey(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return Array.from(new Set(days))
}

export const getDashboardMetrics = onCall(async (request) => {
  assertAdmin(request.auth)

  const parsed = GetDashboardMetricsInputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? 'Invalid input')
  }
  const { startDate, endDate } = parsed.data
  const startTs = admin.firestore.Timestamp.fromDate(new Date(startDate))
  const endTs = admin.firestore.Timestamp.fromDate(new Date(endDate))
  const db = admin.firestore()

  // 1. Total credits (real + granted) — single aggregate
  const allCreditsTotal = await db
    .collectionGroup('transactions')
    .where('type', '==', 'credit')
    .where('status', '==', 'completed')
    .where('createdAt', '>=', startTs)
    .where('createdAt', '<=', endTs)
    .aggregate({ totalCents: admin.firestore.AggregateField.sum('amount') })
    .get()
  const totalCents = allCreditsTotal.data().totalCents ?? 0

  // 2. Granted credits aggregate (adminAction == true)
  const grantedTotal = await db
    .collectionGroup('transactions')
    .where('type', '==', 'credit')
    .where('status', '==', 'completed')
    .where('adminAction', '==', true)
    .where('createdAt', '>=', startTs)
    .where('createdAt', '<=', endTs)
    .aggregate({ creditsCents: admin.firestore.AggregateField.sum('amount') })
    .get()
  const creditsCents = grantedTotal.data().creditsCents ?? 0
  const realCents = Math.max(0, totalCents - creditsCents)

  // 3. Materialized read of credits-in-range for sparkline split (real vs credits per day)
  const txSnap = await db
    .collectionGroup('transactions')
    .where('type', '==', 'credit')
    .where('status', '==', 'completed')
    .where('createdAt', '>=', startTs)
    .where('createdAt', '<=', endTs)
    .get()
  const revenueByDay = new Map<string, { realCents: number; creditsCents: number }>()
  for (const doc of txSnap.docs) {
    const d = doc.data() as {
      amount?: number
      adminAction?: boolean
      createdAt?: admin.firestore.Timestamp
    }
    if (!d.createdAt || typeof d.amount !== 'number') continue
    const key = dayKey(d.createdAt.toDate())
    const bucket = revenueByDay.get(key) ?? { realCents: 0, creditsCents: 0 }
    if (d.adminAction === true) bucket.creditsCents += d.amount
    else bucket.realCents += d.amount
    revenueByDay.set(key, bucket)
  }

  // 4. Users — newCount aggregate + sparkline
  const usersInRangeSnap = await db
    .collection('users')
    .where('createdAt', '>=', startTs)
    .where('createdAt', '<=', endTs)
    .get()
  const newCount = usersInRangeSnap.size
  const newByDay = new Map<string, number>()
  for (const doc of usersInRangeSnap.docs) {
    const d = doc.data() as { createdAt?: admin.firestore.Timestamp }
    if (!d.createdAt) continue
    const key = dayKey(d.createdAt.toDate())
    newByDay.set(key, (newByDay.get(key) ?? 0) + 1)
  }

  // 5. Total users (snapshot)
  const totalUsersAgg = await db
    .collection('users')
    .aggregate({ totalCount: admin.firestore.AggregateField.count() })
    .get()
  const totalCount = totalUsersAgg.data().totalCount ?? 0

  // 6. Active users (distinct uid in transactions in range)
  const activeUids = new Set<string>()
  const activeTxSnap = await db
    .collectionGroup('transactions')
    .where('createdAt', '>=', startTs)
    .where('createdAt', '<=', endTs)
    .get()
  for (const doc of activeTxSnap.docs) {
    const uid = doc.ref.parent.parent?.id
    if (uid) activeUids.add(uid)
  }
  const activeCount = activeUids.size

  // 7. Integrations — distinct active users per platform (snapshot, range-independent)
  const adAccountsSnap = await db
    .collectionGroup('adAccounts')
    .where('isActive', '==', true)
    .get()
  const platformUserSets = new Map<'google_ads' | 'meta_ads', Set<string>>()
  for (const doc of adAccountsSnap.docs) {
    const d = doc.data() as { platform?: 'google_ads' | 'meta_ads' }
    const uid = doc.ref.parent.parent?.id
    if (!uid || !d.platform) continue
    let set = platformUserSets.get(d.platform)
    if (!set) {
      set = new Set<string>()
      platformUserSets.set(d.platform, set)
    }
    set.add(uid)
  }
  const byPlatform = Array.from(platformUserSets.entries())
    .map(([platform, set]) => ({ platform, distinctUserCount: set.size }))
    .sort((a, b) => b.distinctUserCount - a.distinctUserCount)

  // Build sparklines with zero-fill across the day range
  const allDays = enumerateDays(startDate, endDate)
  const revenueSparkline = allDays.map((date) => {
    const b = revenueByDay.get(date) ?? { realCents: 0, creditsCents: 0 }
    return { date, realCents: b.realCents, creditsCents: b.creditsCents }
  })
  const usersSparkline = allDays.map((date) => ({ date, newCount: newByDay.get(date) ?? 0 }))

  const days = Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
  )

  const out: GetDashboardMetricsOutput = {
    range: { startDate, endDate, days },
    revenue: { realCents, creditsCents, sparkline: revenueSparkline },
    users: { newCount, activeCount, totalCount, sparkline: usersSparkline },
    integrations: { byPlatform },
    generatedAt: new Date().toISOString(),
  }
  return out
})
