import * as admin from 'firebase-admin'

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp()
}

export { verifyRecaptcha } from './recaptcha'
export { checkRateLimit } from './rateLimiter'
export { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger'
export { getSecurityStats } from './securityStats'

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
  // handleGoogleAdsCallback_DEPRECATED, // NÃO EXPORTAR - Usar v2
  getGoogleAdsCampaigns
} from './googleAdsOAuth'

// ✅ NOVO: Exportar funções OAuth Meta Ads
export {
  getMetaAdsAuthUrl,
  // handleMetaAdsCallback_DEPRECATED, // NÃO EXPORTAR - Usar v2
  getMetaAdsCampaigns
} from './metaAdsOAuth'

// ✅ NOVO: Exportar funções OAuth v2 com seleção de contas
export {
  handleGoogleAdsCallbackWithSelection,
  confirmGoogleAdsAccountSelection
} from './googleAdsOAuthV2'

export {
  handleMetaAdsCallbackWithSelection,
  confirmMetaAdsAccountSelection
} from './metaAdsOAuthV2'

// ✅ NOVO: Exportar funções SuitPay
export { suitpayWebhook } from './suitpayWebhook'
export { createPixPayment, checkPaymentStatus } from './suitpayPayment'

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

console.log('🚀 Funções exportadas do index.ts')