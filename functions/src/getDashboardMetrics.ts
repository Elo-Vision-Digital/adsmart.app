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

  // [INSTRUMENTATION 2026-04-28] Promise.allSettled with labeled queries to pinpoint
  // which of the 7 reads is throwing FAILED_PRECONDITION (Subprojeto 2 Task 18 dev smoke).
  // Revert to Promise.all once the missing index/exemption is identified and deployed.
  const labeledQueries = [
    {
      label: 'Q1_allCreditsTotal_agg',
      run: () =>
        db
          .collectionGroup('transactions')
          .where('type', '==', 'credit')
          .where('status', '==', 'completed')
          .where('createdAt', '>=', startTs)
          .where('createdAt', '<=', endTs)
          .aggregate({ totalCents: admin.firestore.AggregateField.sum('amount') })
          .get(),
    },
    {
      label: 'Q2_grantedTotal_agg',
      run: () =>
        db
          .collectionGroup('transactions')
          .where('type', '==', 'credit')
          .where('status', '==', 'completed')
          .where('adminAction', '==', true)
          .where('createdAt', '>=', startTs)
          .where('createdAt', '<=', endTs)
          .aggregate({ creditsCents: admin.firestore.AggregateField.sum('amount') })
          .get(),
    },
    {
      label: 'Q3_txSnap',
      run: () =>
        db
          .collectionGroup('transactions')
          .where('type', '==', 'credit')
          .where('status', '==', 'completed')
          .where('createdAt', '>=', startTs)
          .where('createdAt', '<=', endTs)
          .select('amount', 'adminAction', 'createdAt', 'type', 'status')
          .get(),
    },
    {
      label: 'Q4_usersInRangeSnap',
      run: () =>
        db
          .collection('users')
          .where('createdAt', '>=', startTs)
          .where('createdAt', '<=', endTs)
          .select('createdAt')
          .get(),
    },
    {
      label: 'Q5_totalUsers_agg',
      run: () =>
        db
          .collection('users')
          .aggregate({ totalCount: admin.firestore.AggregateField.count() })
          .get(),
    },
    {
      label: 'Q6_activeTxSnap',
      run: () =>
        db
          .collectionGroup('transactions')
          .where('createdAt', '>=', startTs)
          .where('createdAt', '<=', endTs)
          .select('amount', 'adminAction', 'createdAt', 'type', 'status')
          .get(),
    },
    {
      label: 'Q7_adAccountsSnap',
      run: () =>
        db
          .collectionGroup('adAccounts')
          .where('isActive', '==', true)
          .select('platform', 'isActive')
          .get(),
    },
  ]

  const settled = await Promise.allSettled(labeledQueries.map((q) => q.run()))
  const failures: Array<{ label: string; err: unknown }> = []
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i]
    if (r.status === 'rejected') {
      failures.push({ label: labeledQueries[i].label, err: r.reason })
    }
  }

  if (failures.length > 0) {
    for (const f of failures) {
      const e = f.err as {
        code?: number
        message?: string
        details?: string
        metadata?: unknown
        stack?: string
      }
      console.error(`[dashboard:fail:${f.label}]`, {
        code: e?.code,
        message: e?.message,
        details: e?.details ?? '(empty)',
        stackHead: typeof e?.stack === 'string' ? e.stack.split('\n').slice(0, 5).join(' | ') : '(no stack)',
      })
    }
    throw new HttpsError(
      'internal',
      `Dashboard query failures: ${failures.map((f) => f.label).join(', ')}`,
    )
  }

  type AnySnap = FirebaseFirestore.QuerySnapshot | FirebaseFirestore.AggregateQuerySnapshot<Record<string, FirebaseFirestore.AggregateField<number>>>
  const fulfilled = settled.map((r) => (r as PromiseFulfilledResult<AnySnap>).value)
  const [
    allCreditsTotal,
    grantedTotal,
    txSnap,
    usersInRangeSnap,
    totalUsersAgg,
    activeTxSnap,
    adAccountsSnap,
  ] = fulfilled as [
    FirebaseFirestore.AggregateQuerySnapshot<{ totalCents: FirebaseFirestore.AggregateField<number> }>,
    FirebaseFirestore.AggregateQuerySnapshot<{ creditsCents: FirebaseFirestore.AggregateField<number> }>,
    FirebaseFirestore.QuerySnapshot,
    FirebaseFirestore.QuerySnapshot,
    FirebaseFirestore.AggregateQuerySnapshot<{ totalCount: FirebaseFirestore.AggregateField<number> }>,
    FirebaseFirestore.QuerySnapshot,
    FirebaseFirestore.QuerySnapshot,
  ]

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
