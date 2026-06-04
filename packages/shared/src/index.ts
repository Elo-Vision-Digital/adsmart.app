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

export {
  DEFAULT_PRODUCT_PRICES,
  ProductPriceCategorySchema,
  ProductPriceSchema,
  ProductPriceTypeSchema,
  UpdateProductPriceInputSchema,
  UpdateProductPricesInputSchema,
  type ProductPrice,
  type ProductPriceCategory,
  type ProductPriceType,
  type UpdateProductPriceInput,
  type UpdateProductPricesInput,
} from './schemas/productPrice'

export {
  DocumentTypeSchema,
  UserClientUpdateSchema,
  UserSchema,
  type DocumentType,
  type User,
  type UserClientUpdate,
} from './schemas/user'

export {
  ReserveUserDocumentInputSchema,
  ReserveUserDocumentOutputSchema,
  UserDocumentSchema,
  type ReserveUserDocumentInput,
  type ReserveUserDocumentOutput,
  type UserDocument,
} from './schemas/userDocument'

export {
  OAuthPlatformSchema,
  OAuthStateSchema,
  TemporaryOAuthTokenSchema,
  type OAuthPlatform,
  type OAuthState,
  type TemporaryOAuthToken,
} from './schemas/oauthState'

export { RateLimitSchema, type RateLimit } from './schemas/rateLimit'

// Foundation schemas adicionados para o  (Fase -1 ).
// Detalhes em docs// FOUND-1.

export { BusinessTypeSchema, type BusinessType } from './schemas/businessType'

export {
  ProcessedRequestSchema,
  ProcessedRequestSourceSchema,
  type ProcessedRequest,
  type ProcessedRequestSource,
} from './schemas/processedRequest'

export {
  CreateReportShareInputSchema,
  PublicReportShareSchema,
  type CreateReportShareInput,
  type PublicReportShare,
} from './schemas/publicReportShare'

export {
  AIReportInsightSchema,
  AIReportRecommendationSchema,
  AIReportTopMetricSchema,
  InsightImpactSchema,
  InsightSentimentSchema,
  type AIReportInsight,
  type AIReportRecommendation,
  type AIReportTopMetric,
  type InsightImpact,
  type InsightSentiment,
} from './schemas/aiReportInsight'

export {
  LLMCallSchema,
  LLMProviderSchema,
  LLMTaskSchema,
  type LLMCall,
  type LLMProvider,
  type LLMTask,
} from './schemas/llmCall'

export {
  CampaignBreakdownSchema,
  PlatformKPIsSchema,
  ReportPlatformDataSchema,
  TimeSeriesPointSchema,
  type CampaignBreakdown,
  type PlatformKPIs,
  type ReportPlatformData,
  type TimeSeriesPoint,
} from './schemas/reportPlatformData'

export { ADMIN_EMAILS, isAdminUser, type IdTokenClaims } from './auth/admin'

export {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PasswordPolicy,
  PasswordSchema,
  validatePassword,
  type PasswordValidationResult,
} from './auth/password'

export {
  ProjectSchema,
  ProjectClientUpdateSchema,
  type Project,
  type ProjectClientUpdate,
} from './schemas/project'
