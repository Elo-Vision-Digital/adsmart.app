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
export { scheduledBackup, restoreBackup } from './backupScheduler'

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
  getGoogleAdsCampaigns
} from './googleAdsOAuth'

// ✅ NOVO: Exportar funções OAuth Meta Ads
export {
  getMetaAdsAuthUrl,
  handleMetaAdsCallback,
  getMetaAdsCampaigns
} from './metaAdsOAuth'

// ✅ NOVO: Exportar funções SuitPay
export { suitpayWebhook } from './suitpayWebhook'
export { createPixPayment, checkPaymentStatus } from './suitpayPayment'

console.log('🚀 Funções exportadas do index.ts')