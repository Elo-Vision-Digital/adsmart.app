import { defineSecret, defineString } from 'firebase-functions/params'

export const googleAdsClientSecret = defineSecret('GOOGLE_ADS_CLIENT_SECRET')
export const googleAdsDeveloperToken = defineSecret('GOOGLE_ADS_DEVELOPER_TOKEN')
export const metaAdsAppSecret = defineSecret('META_ADS_APP_SECRET')
export const encryptionKey = defineSecret('ENCRYPTION_KEY')

export const googleAdsClientId = defineString('GOOGLE_ADS_CLIENT_ID')
export const googleAdsRedirectUri = defineString('GOOGLE_ADS_REDIRECT_URI')
export const googleAdsRedirectUriDev = defineString('GOOGLE_ADS_REDIRECT_URI_DEV')
export const metaAdsAppId = defineString('META_ADS_APP_ID')
export const metaAdsRedirectUri = defineString('META_ADS_REDIRECT_URI')
export const metaAdsRedirectUriDev = defineString('META_ADS_REDIRECT_URI_DEV')

export const config = {
  project: {
    region: process.env.FUNCTION_REGION || 'us-central1',
  },
  googleAds: {
    scope: 'https://www.googleapis.com/auth/adwords',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiVersion: 'v17',
  },
  metaAds: {
    scope:
      'ads_read,ads_management,business_management,pages_show_list,pages_read_engagement,read_insights',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    apiVersion: 'v18.0',
  },
}
