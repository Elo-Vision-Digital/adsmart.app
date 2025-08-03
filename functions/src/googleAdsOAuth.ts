import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import axios from 'axios'
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

// Configurações OAuth do Google Ads (usando apenas process.env)
const GOOGLE_ADS_CONFIG = {
  clientId: process.env.GOOGLE_ADS_CLIENT_ID || '422483165860-npdsq44121mh4chg2gers6qade02bo5l.apps.googleusercontent.com',
  clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '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',
  developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || 'wRhu9OHLIWdbht2HY3B9yw',
  redirectUri: process.env.GOOGLE_ADS_REDIRECT_URI || 'https://adsmart.app/auth/google-ads/callback',
  redirectUriDev: process.env.GOOGLE_ADS_REDIRECT_URI_DEV || 'http://localhost:5173/auth/google-ads/callback',
  scope: 'https://www.googleapis.com/auth/adwords',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  apiVersion: 'v17'
}

// Interface para os tokens armazenados
interface GoogleAdsTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
  scope: string
}

/**
 * Gera a URL de autorização OAuth para Google Ads
 */
export const getGoogleAdsAuthUrl = onCall(async (request) => {
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
    { platform: 'google_ads', isLocalEnv },
    SecuritySeverity.INFO
  )

  // Gerar state token para prevenir CSRF
  const state = admin.firestore().collection('oauth_states').doc().id
  
  // Salvar state no Firestore com TTL de 10 minutos
  await admin.firestore().collection('oauth_states').doc(state).set({
    userId,
    platform: 'google_ads',
    isLocalEnv: !!isLocalEnv,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
  })

  // Usar redirect URI correto baseado no ambiente
  const redirectUri = isLocalEnv 
    ? GOOGLE_ADS_CONFIG.redirectUriDev 
    : GOOGLE_ADS_CONFIG.redirectUri

  console.log('OAuth URL sendo gerada:', {
    isLocalEnv,
    redirectUri,
    platform: 'google_ads'
  })

  // Construir URL de autorização
  const authUrl = new URL(GOOGLE_ADS_CONFIG.authUrl)
  authUrl.searchParams.append('client_id', GOOGLE_ADS_CONFIG.clientId)
  authUrl.searchParams.append('redirect_uri', redirectUri)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('scope', GOOGLE_ADS_CONFIG.scope)
  authUrl.searchParams.append('state', state)
  authUrl.searchParams.append('access_type', 'offline') // Para obter refresh token
  authUrl.searchParams.append('prompt', 'consent') // Forçar consentimento para obter refresh token

  return {
    authUrl: authUrl.toString(),
    state
  }
})

/**
 * Processa o callback OAuth e troca o código por tokens
 * NOTA: Esta função agora redireciona para a v2 automaticamente
 */
export const handleGoogleAdsCallback = onCall(async (request) => {
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
 * Busca campanhas do Google Ads
 */
export const getGoogleAdsCampaigns = onCall(async (request) => {
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
    
    // Buscar campanhas via API do Google Ads
    const campaigns = await fetchGoogleAdsCampaigns(tokens.accessToken, accountId)

    // Salvar campanhas no Firestore para cache
    const batch = admin.firestore().batch()
    
    for (const campaign of campaigns) {
      const campaignRef = admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('campaigns')
        .doc(`google_ads_${campaign.id}`)

      batch.set(campaignRef, {
        accountId,
        platform: 'google_ads',
        campaignId: campaign.id.toString(),
        campaignName: campaign.name,
        status: campaign.status.toLowerCase(),
        budget: campaign.budget,
        spend: campaign.spend || 0,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        lastSyncAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
    }

    await batch.commit()

    return {
      success: true,
      campaigns: campaigns.map(c => ({
        id: c.id.toString(),
        name: c.name,
        status: c.status.toLowerCase(),
        budget: c.budget,
        spend: c.spend || 0
      }))
    }

  } catch (error: any) {
    console.error('Erro ao buscar campanhas:', error)
    throw new HttpsError('internal', 'Erro ao buscar campanhas')
  }
})

/**
 * Função auxiliar para obter tokens válidos (com refresh automático)
 */
async function getValidTokens(userId: string): Promise<GoogleAdsTokens> {
  const tokenDoc = await admin.firestore()
    .collection('users')
    .doc(userId)
    .collection('oauth_tokens')
    .doc('google_ads')
    .get()

  if (!tokenDoc.exists) {
    throw new HttpsError('not-found', 'Tokens não encontrados. Reconecte sua conta.')
  }

  const encryptedTokens = tokenDoc.data()!
  const tokens = await decryptTokens(encryptedTokens)

  // Verificar se o token expirou
  if (tokens.expiresAt < Date.now() + 60000) { // 1 minuto de margem
    // Renovar token
    const newTokens = await refreshGoogleAdsToken(tokens.refreshToken)
    
    // Salvar novos tokens
    const encryptedNewTokens = await encryptTokens(newTokens)
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('oauth_tokens')
      .doc('google_ads')
      .update({
        ...encryptedNewTokens,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })

    return newTokens
  }

  return tokens
}

/**
 * Renovar access token usando refresh token
 */
async function refreshGoogleAdsToken(refreshToken: string): Promise<GoogleAdsTokens> {
  const response = await axios.post(GOOGLE_ADS_CONFIG.tokenUrl, {
    refresh_token: refreshToken,
    client_id: GOOGLE_ADS_CONFIG.clientId,
    client_secret: GOOGLE_ADS_CONFIG.clientSecret,
    grant_type: 'refresh_token'
  })

  const { access_token, expires_in, scope } = response.data

  return {
    accessToken: access_token,
    refreshToken, // Mantém o mesmo refresh token
    expiresAt: Date.now() + (expires_in * 1000),
    scope
  }
}

/**
 * Buscar campanhas do Google Ads
 */
async function fetchGoogleAdsCampaigns(accessToken: string, accountId: string): Promise<any[]> {
  try {
    // TODO: Implementar integração real com Google Ads API v17
    // Por enquanto retornar array vazio
    console.log('fetchGoogleAdsCampaigns - Implementação pendente para conta:', accountId)
    return []
  } catch (error) {
    console.error('Erro ao buscar campanhas Google Ads:', error)
    return []
  }
}

/**
 * Funções de criptografia (simplificadas)
 * TODO: Implementar criptografia real com crypto-js ou similar
 */
async function encryptTokens(tokens: GoogleAdsTokens): Promise<any> {
  return {
    accessToken: Buffer.from(tokens.accessToken).toString('base64'),
    refreshToken: Buffer.from(tokens.refreshToken).toString('base64'),
    expiresAt: tokens.expiresAt,
    scope: tokens.scope
  }
}

async function decryptTokens(encryptedTokens: any): Promise<GoogleAdsTokens> {
  return {
    accessToken: Buffer.from(encryptedTokens.accessToken, 'base64').toString(),
    refreshToken: Buffer.from(encryptedTokens.refreshToken, 'base64').toString(),
    expiresAt: encryptedTokens.expiresAt,
    scope: encryptedTokens.scope
  }
}