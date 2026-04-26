import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import {
  GetDashboardMetricsInputSchema,
  type GetDashboardMetricsOutput,
} from '@adsmart/shared'

const ADMIN_EMAILS = ['agency.elovisiondigital@gmail.com', 'admin@adsmart.app']

function assertAdmin(auth: { uid: string; token: { email?: string; admin?: boolean } } | undefined) {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }
  const isAdmin = auth.token.admin === true || ADMIN_EMAILS.includes(auth.token.email ?? '')
  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Acesso restrito a administradores')
  }
}

export const getDashboardMetrics = onCall(async (request) => {
  assertAdmin(request.auth as any)

  const parsed = GetDashboardMetricsInputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? 'Invalid input')
  }
  const { startDate, endDate } = parsed.data

  // Aggregation logic added in Task 7. For now, return zeros to satisfy the auth/validation tests.
  const days = Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
  )
  const empty: GetDashboardMetricsOutput = {
    range: { startDate, endDate, days },
    revenue: { realCents: 0, creditsCents: 0, sparkline: [] },
    users: { newCount: 0, activeCount: 0, totalCount: 0, sparkline: [] },
    integrations: { byPlatform: [] },
    generatedAt: new Date().toISOString(),
  }
  void admin // touch to silence unused-import; aggregation lands next task
  return empty
})
