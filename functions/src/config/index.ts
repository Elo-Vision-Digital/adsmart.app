import { defineSecret, defineString } from 'firebase-functions/params'

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
// NON-SECRET PARAMS (defineString — ADR pending 2026-05-18)
// ========================================
// Single source of truth for non-secret app config. Read via `.value()`
// inside function handlers (not at module load — params resolve at
// runtime). Defaults baked in keep dev/local builds working without an
// .env override. See docs/superpowers/specs/2026-05-18-functions-config-modernization-design.md

// Google Ads (non-secret)
export const googleAdsClientId = defineString('GOOGLE_ADS_CLIENT_ID', {
  default: '422483165860-npdsq44121mh4chg2gers6qade02bo5l.apps.googleusercontent.com',
})
export const googleAdsRedirectUri = defineString('GOOGLE_ADS_REDIRECT_URI', {
  default: 'https://adsmart.app/auth/google-ads/callback',
})
export const googleAdsRedirectUriDev = defineString('GOOGLE_ADS_REDIRECT_URI_DEV', {
  default: 'http://localhost:5173/auth/google-ads/callback',
})

// Meta Ads (non-secret)
export const metaAdsAppId = defineString('META_ADS_APP_ID', {
  default: '4052927898253765',
})
export const metaAdsRedirectUri = defineString('META_ADS_REDIRECT_URI', {
  default: 'https://adsmart.app/auth/meta-ads/callback',
})
export const metaAdsRedirectUriDev = defineString('META_ADS_REDIRECT_URI_DEV', {
  default: 'http://localhost:5173/auth/meta-ads/callback',
})

// ========================================
// CONFIGURAÇÕES (Não sensíveis — constantes puras)
// ========================================
// Values that are not env-overridable — fixed at code level. For env-
// overridable values use the defineString exports above.

export const config = {
  project: {
    id: process.env.GCLOUD_PROJECT || 'adsmart-web',
    region: process.env.FUNCTION_REGION || 'us-central1',
    environment: process.env.NODE_ENV || 'production',
  },

  // URLs base (host names — not env-overridable)
  urls: {
    hosting: 'https://adsmart.app',
    hostingDev: 'http://localhost:5173',
  },

  // Google Ads constants (scope/auth URLs are part of the protocol, not config)
  googleAds: {
    scope: 'https://www.googleapis.com/auth/adwords',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiVersion: 'v17',
  },

  // Meta Ads constants
  metaAds: {
    scope:
      'ads_read,ads_management,business_management,pages_show_list,pages_read_engagement,read_insights',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    apiVersion: 'v18.0',
  },
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
