// @adsmart/shared — Zod schemas for Firestore documents shared between
// apps/web (frontend) and functions/ (Cloud Functions).

export { zTimestamp } from './firestore'

export {
  ReportSchema,
  ReportStatusSchema,
  ReportTypeSchema,
  type DateRange,
  type Report,
  type ReportStatus,
  type ReportType,
  DateRangeSchema,
} from './schemas/report'

export { AdAccountSchema, AdPlatformSchema, type AdAccount, type AdPlatform } from './schemas/adAccount'

export { CampaignSchema, type Campaign } from './schemas/campaign'

export { UserWalletSchema, type UserWallet } from './schemas/userWallet'

export {
  TransactionSchema,
  TransactionStatusSchema,
  TransactionTypeSchema,
  type Transaction,
  type TransactionStatus,
  type TransactionType,
} from './schemas/transaction'

export {
  GetDashboardMetricsInputSchema,
  GetDashboardMetricsOutputSchema,
  DASHBOARD_METRICS_MAX_RANGE_DAYS,
  type GetDashboardMetricsInput,
  type GetDashboardMetricsOutput,
} from './schemas/dashboardMetrics'

export { ADMIN_EMAILS, isAdminUser, type IdTokenClaims } from './auth/admin'

export {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PasswordPolicy,
  PasswordSchema,
  validatePassword,
  type PasswordValidationResult,
} from './auth/password'
