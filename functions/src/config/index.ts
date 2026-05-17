import { defineSecret } from 'firebase-functions/params'

// ========================================
// SECRETS (Credenciais sensíveis)
// ========================================

// SuitPay Secrets - TEMPORARIAMENTE DESABILITADOS
// export const suitpayClientId = defineSecret('SUITPAY_CLIENT_ID')
// export const suitpayClientSecret = defineSecret('SUITPAY_CLIENT_SECRET')

// TEMPORÁRIO: Exportar objetos vazios para não quebrar imports
export const suitpayClientId = { value: () => '' }
export const suitpayClientSecret = { value: () => '' }

// Google Ads Secrets (migrar no futuro)
export const googleAdsClientSecret = defineSecret('GOOGLE_ADS_CLIENT_SECRET')

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
  
  // SuitPay (não sensível)
  suitpay: {
    apiUrl: 'https://ws.suitpay.app/api/v1',
    apiUrlSandbox: 'https://sandbox.ws.suitpay.app/api/v1',
    webhookPath: '/suitpayWebhook',
    allowedIPs: ['3.132.137.46']
  },
  
  // Google Ads (não sensível)
  googleAds: {
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
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
 * Obtém a URL completa do webhook
 */
export function getWebhookUrl(path: string): string {
  return `${config.urls.functions}${path}`
}

/**
 * Verifica se está em produção
 */
export function isProduction(): boolean {
  return config.project.environment === 'production'
}

/**
 * Obtém URL de redirect baseado no ambiente
 */
export function getRedirectUrl(prodUrl: string, devUrl: string): string {
  return isProduction() ? prodUrl : devUrl
}