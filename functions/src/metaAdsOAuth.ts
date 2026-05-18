import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import axios from 'axios'
import { CampaignSchema } from '@adsmart/shared'
import { encryptionKey, metaAdsAppSecret } from './config'
import { encryptString, detectAndDecrypt } from './lib/oauthCrypto'
import { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger'

// Inicializar admin se ainda não foi
if (!admin.apps.length) {
  admin.initializeApp()
}

// OAuth Event Types
const OAuthEventType = {
  ...SecurityEventType,
  OAUTH_INIT: 'oauth_init' as SecurityEventType,
  OAUTH_SUCCESS: 'oauth_success' as SecurityEventType,
  OAUTH_ERROR: 'oauth_error' as SecurityEventType
}

// Configurações OAuth do Meta Ads (app secret via defineSecret; demais valores via process.env)
const META_ADS_CONFIG = {
  appId: process.env.META_ADS_APP_ID || '4052927898253765',
  redirectUri: process.env.META_ADS_REDIRECT_URI || 'https://adsmart.app/auth/meta-ads/callback',
  redirectUriDev: process.env.META_ADS_REDIRECT_URI_DEV || 'http://localhost:5173/auth/meta-ads/callback',
  scope: 'ads_read,ads_management,business_management,read_insights',
  authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
  apiVersion: 'v18.0'
}

// Interface para os tokens armazenados
interface MetaAdsTokens {
  accessToken: string
  expiresAt: number
  scope: string
  tokenType: string
}

/**
 * Gera a URL de autorização OAuth para Meta Ads
 */
export const getMetaAdsAuthUrl = onCall({ secrets: [metaAdsAppSecret] }, async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }

  const userId = request.auth.uid
  const { isLocalEnv } = request.data || {}

  // Log de segurança
  await securityLogger.logEvent(
    OAuthEventType.OAUTH_INIT,
    userId,
    { platform: 'meta_ads', isLocalEnv },
    SecuritySeverity.INFO
  )

  // Gerar state token para prevenir CSRF
  const state = admin.firestore().collection('oauth_states').doc().id
  
  // Salvar state no Firestore com TTL de 10 minutos
  await admin.firestore().collection('oauth_states').doc(state).set({
    userId,
    platform: 'meta_ads',
    isLocalEnv: !!isLocalEnv,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
  })

  // Usar redirect URI correto baseado no ambiente
  const redirectUri = isLocalEnv 
    ? META_ADS_CONFIG.redirectUriDev 
    : META_ADS_CONFIG.redirectUri

  console.log('OAuth URL sendo gerada:', {
    isLocalEnv,
    redirectUri,
    platform: 'meta_ads'
  })

  // Construir URL de autorização
  const authUrl = new URL(META_ADS_CONFIG.authUrl)
  authUrl.searchParams.append('client_id', META_ADS_CONFIG.appId)
  authUrl.searchParams.append('redirect_uri', redirectUri)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('scope', META_ADS_CONFIG.scope)
  authUrl.searchParams.append('state', state)

  return {
    authUrl: authUrl.toString(),
    state
  }
})

/**
 * Processa o callback OAuth e troca o código por tokens
 * NOTA: Esta função agora redireciona para a v2 automaticamente
 */
export const handleMetaAdsCallback = onCall({ secrets: [metaAdsAppSecret] }, async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }

  const { code, state } = request.data
  const userId = request.auth.uid

  if (!code || !state) {
    throw new HttpsError('invalid-argument', 'Código ou state ausente')
  }

  try {
    // Verificar state token
    const stateDoc = await admin.firestore().collection('oauth_states').doc(state).get()
    
    if (!stateDoc.exists) {
      throw new HttpsError('invalid-argument', 'State inválido')
    }

    const stateData = stateDoc.data()!
    
    // Verificar se o state pertence ao usuário correto
    if (stateData.userId !== userId) {
      await securityLogger.logEvent(
        OAuthEventType.OAUTH_ERROR,
        userId,
        { 
          reason: 'Tentativa de usar state de outro usuário',
          attemptedState: state 
        },
        SecuritySeverity.WARNING
      )
      throw new HttpsError('permission-denied', 'State não autorizado')
    }

    // Verificar se o state não expirou
    if (stateData.expiresAt.toDate() < new Date()) {
      throw new HttpsError('deadline-exceeded', 'State expirado')
    }

    // Deletar state usado (importante fazer isso antes de retornar erro)
    await admin.firestore().collection('oauth_states').doc(state).delete()

    // Esta função está deprecated - retornar erro informativo
    // O frontend deve capturar este erro e chamar a função v2
    throw new HttpsError(
      'failed-precondition', 
      'Esta função está deprecated. Use o novo fluxo OAuth v2 com seleção de contas.'
    )

  } catch (error: any) {
    // Se já for um HttpsError, repassar
    if (error instanceof HttpsError) {
      throw error
    }
    
    // Log de erro
    await securityLogger.logEvent(
      OAuthEventType.OAUTH_ERROR,
      userId,
      { 
        error: error.message,
        code: error.code
      },
      SecuritySeverity.ERROR
    )

    throw new HttpsError('internal', 'Erro ao processar callback OAuth')
  }
})

/**
 * Busca campanhas do Meta Ads
 */
export const getMetaAdsCampaigns = onCall(
  { secrets: [metaAdsAppSecret, encryptionKey] },
  async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }

  const { accountId } = request.data
  const userId = request.auth.uid

  if (!accountId) {
    throw new HttpsError('invalid-argument', 'ID da conta é obrigatório')
  }

  try {
    // Obter tokens
    const tokens = await getValidTokens(userId)
    
    // Buscar campanhas via API do Meta Ads
    const campaigns = await fetchMetaAdsCampaigns(tokens.accessToken, accountId)

    // Salvar campanhas no Firestore para cache
    const batch = admin.firestore().batch()
    
    for (const campaign of campaigns) {
      const campaignRef = admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('campaigns')
        .doc(`meta_ads_${campaign.id}`)

      const validated = CampaignSchema.omit({ id: true, lastSyncAt: true }).parse({
        accountId,
        platform: 'meta_ads',
        campaignId: campaign.id,
        campaignName: campaign.name,
        status: campaign.status.toLowerCase(),
        objective: campaign.objective,
        budget: campaign.daily_budget || campaign.lifetime_budget || 0,
        spend: campaign.spend || 0,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
      })

      batch.set(campaignRef, {
        ...validated,
        lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
    }

    await batch.commit()

    return {
      success: true,
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status.toLowerCase(),
        objective: c.objective,
        budget: c.daily_budget || c.lifetime_budget || 0,
        spend: c.spend || 0
      }))
    }

  } catch (error: any) {
    console.error('Erro ao buscar campanhas:', error)
    throw new HttpsError('internal', 'Erro ao buscar campanhas')
  }
})

/**
 * Função auxiliar para obter tokens válidos
 */
async function getValidTokens(userId: string): Promise<MetaAdsTokens> {
  const tokenDoc = await admin.firestore()
    .collection('users')
    .doc(userId)
    .collection('oauth_tokens')
    .doc('meta_ads')
    .get()

  if (!tokenDoc.exists) {
    throw new HttpsError('not-found', 'Tokens não encontrados. Reconecte sua conta.')
  }

  const raw = tokenDoc.data() as {
    accessToken: unknown
    expiresAt: number
    scope: string
    tokenType?: string
  }

  // detectAndDecrypt accepts both the v1 EncryptedField (ADR-019) and the
  // pre-Sprint-3 legacy Base64 string. Legacy tokens are migrated below.
  const secret = encryptionKey.value()
  const tokens: MetaAdsTokens = {
    accessToken: detectAndDecrypt(raw.accessToken, secret),
    expiresAt: raw.expiresAt,
    scope: raw.scope,
    tokenType: raw.tokenType || 'bearer',
  }

  // Meta long-lived tokens last 60 days. Warn at 7 days remaining;
  // there is no automated refresh — the user must re-connect.
  const daysUntilExpiry = (tokens.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)
  if (daysUntilExpiry < 7) {
    console.warn(
      `Token Meta Ads expirando em ${daysUntilExpiry.toFixed(0)} dias para usuário ${userId}`
    )
  }

  // Opportunistic migration of legacy Base64-stored tokens to AES-GCM
  // on the next read after ADR-019 ships. Fire-and-forget — the
  // plaintext is already in `tokens`.
  if (typeof raw.accessToken === 'string') {
    await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('oauth_tokens')
      .doc('meta_ads')
      .update({
        accessToken: encryptString(tokens.accessToken, secret),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
  }

  return tokens
}

/**
 * Buscar campanhas do Meta Ads
 */
async function fetchMetaAdsCampaigns(accessToken: string, accountId: string): Promise<any[]> {
  try {
    // Adicionar prefixo act_ se não tiver
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`
    
    const url = `https://graph.facebook.com/${META_ADS_CONFIG.apiVersion}/${formattedAccountId}/campaigns`
    const params = {
      access_token: accessToken,
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,spend,impressions,clicks',
      limit: 100
    }

    const response = await axios.get(url, { params })
    
    return response.data.data || []
  } catch (error: any) {
    console.error('Erro ao buscar campanhas Meta Ads:', error.response?.data || error)
    throw error
  }
}

// Token encryption lives in ./lib/oauthCrypto.ts (ADR-019).