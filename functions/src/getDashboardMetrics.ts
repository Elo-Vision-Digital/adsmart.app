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
  const startKey = dayKey(new Date(startISO))
  const endKey = dayKey(new Date(endISO))
  const days: string[] = []
  let cursor = startKey
  let safety = 0
  while (cursor <= endKey && safety < 400) {
    days.push(cursor)
    // Advance one calendar day in BRT-key space.
    const [y, m, d] = cursor.split('-').map((s) => Number.parseInt(s, 10))
    const next = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0))
    cursor = dayKey(next)
    safety += 1
  }
  return days
}

export const getDashboardMetrics = onCall({ memory: '512MiB' }, async (request) => {
  assertAdmin(request.auth)

  const parsed = GetDashboardMetricsInputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? 'Invalid input')
  }
  const { startDate, endDate } = parsed.data
  const startTs = admin.firestore.Timestamp.fromDate(new Date(startDate))
  const endTs = admin.firestore.Timestamp.fromDate(new Date(endDate))
  const db = admin.firestore()

  // Run the 7 independent reads in parallel. Aggregates and materialized snapshots
  // are not transactional with each other; in-flight writes can introduce a small
  // drift (≤ ε) between card totals (aggregates) and sparkline sums (materialized).
  // The Math.max(0, ...) floors guard against transient negative residuals.
  const [
    allCreditsTotal,
    grantedTotal,
    txSnap,
    usersInRangeSnap,
    totalUsersAgg,
    activeTxSnap,
    adAccountsSnap,
  ] = await Promise.all([
    // 1. Total credits (real + granted) — single aggregate
    db
      .collectionGroup('transactions')
      .where('type', '==', 'credit')
      .where('status', '==', 'completed')
      .where('createdAt', '>=', startTs)
      .where('createdAt', '<=', endTs)
      .aggregate({ totalCents: admin.firestore.AggregateField.sum('amount') })
      .get(),
    // 2. Granted credits aggregate (adminAction == true)
    db
      .collectionGroup('transactions')
      .where('type', '==', 'credit')
      .where('status', '==', 'completed')
      .where('adminAction', '==', true)
      .where('createdAt', '>=', startTs)
      .where('createdAt', '<=', endTs)
      .aggregate({ creditsCents: admin.firestore.AggregateField.sum('amount') })
      .get(),
    // 3. Materialized read of credits-in-range for sparkline split (real vs credits per day).
    //    Project only the fields needed; drop description/payerName/payerCpf/etc.
    db
      .collectionGroup('transactions')
      .where('type', '==', 'credit')
      .where('status', '==', 'completed')
      .where('createdAt', '>=', startTs)
      .where('createdAt', '<=', endTs)
      .select('amount', 'adminAction', 'createdAt', 'type', 'status')
      .get(),
    // 4. Users created in range — full snapshot drives both newCount + sparkline
    db
      .collection('users')
      .where('createdAt', '>=', startTs)
      .where('createdAt', '<=', endTs)
      .select('createdAt')
      .get(),
    // 5. Total users (snapshot)
    db
      .collection('users')
      .aggregate({ totalCount: admin.firestore.AggregateField.count() })
      .get(),
    // 6. Active users — distinct uid in transactions in range (only need parent ref)
    db
      .collectionGroup('transactions')
      .where('createdAt', '>=', startTs)
      .where('createdAt', '<=', endTs)
      .select('amount', 'adminAction', 'createdAt', 'type', 'status')
      .get(),
    // 7. Integrations — distinct active users per platform (snapshot, range-independent)
    db
      .collectionGroup('adAccounts')
      .where('isActive', '==', true)
      .select('platform', 'isActive')
      .get(),
  ])

  // Revenue totals.
  // `adminAction` is set ONLY when an admin manually credits a wallet via
  // adminWalletManager. Default credit flows (PIX, Asaas, etc) omit the field,
  // so totalCents - grantedCents == realCents (revenue). A Math.max(0, ...) floor
  // protects against the rare race where the granted aggregate observed a write
  // the totals aggregate did not (or vice-versa).
  const totalCents = allCreditsTotal.data().totalCents ?? 0
  const creditsCents = grantedTotal.data().creditsCents ?? 0
  const realCents = Math.max(0, totalCents - creditsCents)

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

  // Users — newCount + per-day sparkline
  const newCount = usersInRangeSnap.size
  const newByDay = new Map<string, number>()
  for (const doc of usersInRangeSnap.docs) {
    const d = doc.data() as { createdAt?: admin.firestore.Timestamp }
    if (!d.createdAt) continue
    const key = dayKey(d.createdAt.toDate())
    newByDay.set(key, (newByDay.get(key) ?? 0) + 1)
  }

  const totalCount = totalUsersAgg.data().totalCount ?? 0

  // Active users (distinct uid in transactions in range)
  const activeUids = new Set<string>()
  for (const doc of activeTxSnap.docs) {
    const uid = doc.ref.parent.parent?.id
    if (uid) activeUids.add(uid)
  }
  const activeCount = activeUids.size

  // Integrations
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

  // Derive `days` from the sparkline length so the card count is always
  // consistent with the chart (n days inclusive ⇒ n-1 day deltas).
  const days = Math.max(0, allDays.length - 1)

  const out: GetDashboardMetricsOutput = {
    range: { startDate, endDate, days },
    revenue: { realCents, creditsCents, sparkline: revenueSparkline },
    users: { newCount, activeCount, totalCount, sparkline: usersSparkline },
    integrations: { byPlatform },
    generatedAt: new Date().toISOString(),
  }
  return out
})
