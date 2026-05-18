import { defineSecret } from 'firebase-functions/params'

// ========================================
// SECRETS (Credenciais sensíveis)
// ========================================

// SuitPay secrets removed in ADR-021 (2026-05-18) together with the
// suitpayPayment/suitpayWebhook Cloud Functions. Payment integration is
// pending Asaas migration.

// Google Ads Secrets
export const googleAdsClientSecret = defineSecret('GOOGLE_ADS_CLIENT_SECRET')
export const googleAdsDeveloperToken = defineSecret('GOOGLE_ADS_DEVELOPER_TOKEN')

// Meta Ads Secrets (migrar no futuro)
export const metaAdsAppSecret = defineSecret('META_ADS_APP_SECRET')

// Security Secrets
export const encryptionKey = defineSecret('ENCRYPTION_KEY')

// ========================================
// CONFIGURAÇÕES (Não sensíveis)
// ========================================

// Configurações do Firebase/Projeto
export const config = {
  project: {
    id: process.env.GCLOUD_PROJECT || 'adsmart-web',
    region: process.env.FUNCTION_REGION || 'us-central1',
    environment: process.env.NODE_ENV || 'production'
  },
  
  // URLs base
  urls: {
    functions: `https://${process.env.FUNCTION_REGION || 'us-central1'}-${process.env.GCLOUD_PROJECT || 'adsmart-web'}.cloudfunctions.net`,
    hosting: 'https://adsmart.app',
    hostingDev: 'http://localhost:5173'
  },
  
  // Google Ads (não sensível) — developer token agora vive em Secret Manager
  // como GOOGLE_ADS_DEVELOPER_TOKEN; usar `googleAdsDeveloperToken.value()`.
  googleAds: {
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    redirectUri: process.env.GOOGLE_ADS_REDIRECT_URI || 'https://adsmart.app/auth/google-ads/callback',
    redirectUriDev: process.env.GOOGLE_ADS_REDIRECT_URI_DEV || 'http://localhost:5173/auth/google-ads/callback',
    scope: 'https://www.googleapis.com/auth/adwords',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiVersion: 'v17'
  },
  
  // Meta Ads (não sensível)
  metaAds: {
    appId: process.env.META_ADS_APP_ID || '',
    redirectUri: process.env.META_ADS_REDIRECT_URI || 'https://adsmart.app/auth/meta-ads/callback',
    redirectUriDev: process.env.META_ADS_REDIRECT_URI_DEV || 'http://localhost:5173/auth/meta-ads/callback',
    scope: 'ads_read,ads_management,business_management,pages_show_list,pages_read_engagement,read_insights',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    apiVersion: 'v18.0'
  }
}

// ========================================
// HELPERS
// ========================================

/**
 * Verifica se está em produção
 */
export function isProduction(): boolean {
  return config.project.environment === 'production'
}