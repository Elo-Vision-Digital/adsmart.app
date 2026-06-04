import * as admin from 'firebase-admin'

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp()
}

export { checkRateLimit } from './rateLimiter'
export { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger'

// ✅ Exportar funções de backup
// export { scheduledBackup, restoreBackup } from './backupScheduler'

// ✅ NOVO: Exportar funções de gerenciamento de preços
export {
  getProductPrices,
  updateProductPrices,
  initializeDefaultPrices
} from './priceManager'

// ✅ ADICIONADO: Exportar função pública de preços
export { getPublicProductPrices } from './getPublicProductPrices'

// ✅ NOVO: Exportar funções OAuth Google Ads
export {
  getGoogleAdsAuthUrl,
  handleGoogleAdsCallback,
  confirmGoogleAdsAccountSelection,
  getGoogleAdsCampaigns
} from './googleAdsOAuth'

// ✅ NOVO: Exportar funções OAuth Meta Ads
export {
  getMetaAdsAuthUrl,
  handleMetaAdsCallback,
  confirmMetaAdsAccountSelection,
  getMetaAdsCampaigns
} from './metaAdsOAuth'

// SuitPay (suitpayWebhook, createPixPayment, checkPaymentStatus) removed
// in ADR-021 (2026-05-18). Stripe integration is the planned replacement
// (FUTURE §8 — see docs/research/08-stripe-future.md and docs/PAYMENTS.md).

// ✅ NOVO: Exportar função de exclusão de dados
export { deleteUserData } from './deleteUserData'

// ✅ NOVO: Exportar função de gestão de saldo para admins
export { addUserCredits } from './adminWalletManager'

// Auth blocking trigger that seeds users/{uid} (profile) and
// users/{uid}/wallet/current (balance: 0) at signup time. Phase 3
// firestore.rules forbid client-side writes to either path.
export { bootstrapUser } from './bootstrapUser'

// Atomic CPF/CNPJ reservation. Enforces uniqueness across users and
// per-user immutability. See ADR-012.
export { reserveUserDocument } from './reserveUserDocument'

// Subprojeto 2 — admin dashboard read-only metrics
export { getDashboardMetrics } from './getDashboardMetrics'

console.log('🚀 Funções exportadas do index.ts')