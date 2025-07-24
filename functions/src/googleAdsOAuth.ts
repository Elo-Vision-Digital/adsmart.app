import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import axios from 'axios'
import { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger'

// Inicializar admin se ainda não foi
if (!admin.apps.length) {
  admin.initializeApp()
}

// Adicionar tipos de eventos OAuth que faltam
const OAuthEventType = {
  ...SecurityEventType,
  OAUTH_INIT: 'oauth_init' as SecurityEventType,
  OAUTH_SUCCESS: 'oauth_success' as SecurityEventType,
  OAUTH_ERROR: 'oauth_error' as SecurityEventType
}

// Obter configurações do Firebase Functions Config
const getGoogleAdsConfig = () => {
  // Primeiro, verificar se estamos no emulador
  if (process.env.FUNCTIONS_EMULATOR) {
    try {
      const localConfig = require('../../.runtimeconfig.json')
      console.log('Emulator - Local config loaded:', JSON.stringify(localConfig, null, 2))
      if (localConfig.google_ads) {
        return {
          clientId: localConfig.google_ads.client_id,
          clientSecret: localConfig.google_ads.client_secret,
          developerToken: localConfig.google_ads.developer_token,
          redirectUri: localConfig.google_ads.redirect_uri || 'https://adsmart-web.web.app/auth/google-ads/callback',
          redirectUriDev: localConfig.google_ads.redirect_uri_dev || 'http://localhost:5173/auth/google-ads/callback'
        }
      }
    } catch (error) {
      console.error('Erro ao carregar config local:', error)
    }
  }
  
  // Em produção com Functions v2, usar process.env diretamente
  // As configurações setadas com firebase functions:config:set são mapeadas para process.env
  console.log('Production - Checking environment variables...')
  
  // Verificar se temos as variáveis de ambiente (Functions v2)
  if (process.env.GOOGLE_ADS__CLIENT_ID) {
    console.log('Found v2 environment variables')
    return {
      clientId: process.env.GOOGLE_ADS__CLIENT_ID,
      clientSecret: process.env.GOOGLE_ADS__CLIENT_SECRET || '',
      developerToken: process.env.GOOGLE_ADS__DEVELOPER_TOKEN || '',
      redirectUri: process.env.GOOGLE_ADS__REDIRECT_URI || 'https://adsmart-web.web.app/auth/google-ads/callback',
      redirectUriDev: process.env.GOOGLE_ADS__REDIRECT_URI_DEV || 'http://localhost:5173/auth/google-ads/callback'
    }
  }
  
  // Tentar usar functions.config() para retrocompatibilidade
  try {
    const functionConfig = functions.config()
    console.log('Production - Functions config:', JSON.stringify(functionConfig, null, 2))
    
    if (functionConfig.google_ads) {
      return {
        clientId: functionConfig.google_ads.client_id,
        clientSecret: functionConfig.google_ads.client_secret,
        developerToken: functionConfig.google_ads.developer_token,
        redirectUri: functionConfig.google_ads.redirect_uri || 'https://adsmart-web.web.app/auth/google-ads/callback',
        redirectUriDev: functionConfig.google_ads.redirect_uri_dev || 'http://localhost:5173/auth/google-ads/callback'
      }
    }
  } catch (error) {
    console.log('functions.config() not available (v2 functions)')
  }
  
  // Fallback direto com valores hardcoded para produção
  console.log('Using hardcoded production values')
  return {
    clientId: '422483165860-dll4jj0j020et27n1fu1aenqqu08j3lr.apps.googleusercontent.com',
    clientSecret: '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',
    developerToken: 'wRhu9OHLIWdbht2HY3B9yw',
    redirectUri: 'https://adsmart-web.web.app/auth/google-ads/callback',
    redirectUriDev: 'http://localhost:5173/auth/google-ads/callback'
  }
}

// Forçar carregamento direto das configurações para debug
let GOOGLE_ADS_CONFIG: any = {
  scope: 'https://www.googleapis.com/auth/adwords',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  apiVersion: 'v17' // Versão atual da API do Google Ads
}

// Carregar configurações imediatamente
try {
  const config = getGoogleAdsConfig()
  GOOGLE_ADS_CONFIG = { ...GOOGLE_ADS_CONFIG, ...config }
  console.log('Configuração Google Ads carregada:', GOOGLE_ADS_CONFIG)
} catch (error) {
  console.error('Erro ao carregar configuração Google Ads:', error)
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
  console.log('=== getGoogleAdsAuthUrl chamada ===')
  console.log('Emulator?', process.env.FUNCTIONS_EMULATOR ? 'SIM' : 'NÃO')
  console.log('Config carregada:', GOOGLE_ADS_CONFIG)
  
  // Verificar autenticação
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }

  const userId = request.auth.uid

  // Verificar se o client_id está configurado
  if (!GOOGLE_ADS_CONFIG.clientId) {
    console.error('Client ID não configurado!', GOOGLE_ADS_CONFIG)
    throw new HttpsError('failed-precondition', 'Google Ads OAuth não está configurado corretamente')
  }

  // Log de segurança
  await securityLogger.logEvent(
    OAuthEventType.OAUTH_INIT,
    userId,
    { platform: 'google_ads' },
    SecuritySeverity.INFO
  )

  // Gerar state token para prevenir CSRF
  const state = admin.firestore().collection('oauth_states').doc().id
  
  // Salvar state no Firestore com TTL de 10 minutos
  try {
    const db = admin.firestore()
    await db.collection('oauth_states').doc(state).set({
      userId,
      platform: 'google_ads',
      createdAt: admin.firestore.FieldValue?.serverTimestamp?.() || new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
    })
  } catch (error) {
    console.error('Erro ao salvar state:', error)
    // Continuar mesmo se falhar ao salvar o state
  }

  // Usar redirect URI correto baseado no ambiente
  const redirectUri = process.env.FUNCTIONS_EMULATOR 
    ? GOOGLE_ADS_CONFIG.redirectUriDev 
    : GOOGLE_ADS_CONFIG.redirectUri

  // Construir URL de autorização
  const authUrl = new URL(GOOGLE_ADS_CONFIG.authUrl)
  authUrl.searchParams.append('client_id', GOOGLE_ADS_CONFIG.clientId)
  authUrl.searchParams.append('redirect_uri', redirectUri)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('scope', GOOGLE_ADS_CONFIG.scope)
  authUrl.searchParams.append('state', state)
  authUrl.searchParams.append('access_type', 'offline') // Para obter refresh token
  authUrl.searchParams.append('prompt', 'consent') // Forçar consentimento para obter refresh token

  console.log('OAuth URL gerada:', authUrl.toString())

  return {
    authUrl: authUrl.toString(),
    state
  }
})

/**
 * Processa o callback OAuth e troca o código por tokens
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

    // Deletar state usado
    await admin.firestore().collection('oauth_states').doc(state).delete()

    // Usar redirect URI correto baseado no ambiente
    const redirectUri = process.env.FUNCTIONS_EMULATOR 
      ? GOOGLE_ADS_CONFIG.redirectUriDev 
      : GOOGLE_ADS_CONFIG.redirectUri

    // Trocar código por tokens
    const tokenResponse = await axios.post(GOOGLE_ADS_CONFIG.tokenUrl, {
      code,
      client_id: GOOGLE_ADS_CONFIG.clientId,
      client_secret: GOOGLE_ADS_CONFIG.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })

    const { access_token, refresh_token, expires_in, scope } = tokenResponse.data

    // Criptografar tokens antes de armazenar
    const encryptedTokens = await encryptTokens({
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Date.now() + (expires_in * 1000),
      scope
    })

    // Obter informações da conta Google Ads
    const accountInfo = await getGoogleAdsAccountInfo(access_token)

    // Salvar tokens e informações da conta
    const batch = admin.firestore().batch()

    // Salvar tokens criptografados
    const tokenRef = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('oauth_tokens')
      .doc('google_ads')

    batch.set(tokenRef, {
      ...encryptedTokens,
      updatedAt: admin.firestore.FieldValue?.serverTimestamp?.() || new Date()
    })

    // Salvar informações das contas
    for (const account of accountInfo) {
      const accountRef = admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('adAccounts')
        .doc(`google_ads_${account.customerId}`)

      batch.set(accountRef, {
        platform: 'google_ads',
        accountId: account.customerId,
        accountName: account.name,
        email: account.email || request.auth.token.email,
        isActive: true,
        createdAt: admin.firestore.FieldValue?.serverTimestamp?.() || new Date(),
        updatedAt: admin.firestore.FieldValue?.serverTimestamp?.() || new Date(),
        lastSyncAt: admin.firestore.FieldValue?.serverTimestamp?.() || new Date()
      }, { merge: true })
    }

    await batch.commit()

    // Log de sucesso
    await securityLogger.logEvent(
      OAuthEventType.OAUTH_SUCCESS,
      userId,
      { 
        accountsConnected: accountInfo.length,
        accountIds: accountInfo.map(a => a.customerId)
      },
      SecuritySeverity.INFO
    )

    return {
      success: true,
      accountsConnected: accountInfo.length,
      accounts: accountInfo.map(account => ({
        id: account.customerId,
        name: account.name
      }))
    }

  } catch (error: any) {
    // Log de erro
    await securityLogger.logEvent(
      OAuthEventType.OAUTH_ERROR,
      userId,
      { 
        error: error.message,
        code: error.response?.status
      },
      SecuritySeverity.ERROR
    )

    if (error.response?.data?.error) {
      throw new HttpsError('internal', error.response.data.error_description || 'Erro ao processar OAuth')
    }
    
    throw new HttpsError('internal', 'Erro ao conectar conta Google Ads')
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
        lastSyncAt: admin.firestore.FieldValue?.serverTimestamp?.() || new Date()
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
        updatedAt: admin.firestore.FieldValue?.serverTimestamp?.() || new Date()
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
 * Buscar informações das contas Google Ads
 */
async function getGoogleAdsAccountInfo(accessToken: string): Promise<any[]> {
  // Esta é uma implementação simplificada
  // Na prática, você usaria a biblioteca oficial do Google Ads
  // Por enquanto, vamos simular a resposta
  
  // TODO: Implementar chamada real à API do Google Ads
  // Exemplo com google-ads-api:
  // const client = new GoogleAdsApi({ ... })
  // const customers = await client.listAccessibleCustomers()
  
  // Simulação para desenvolvimento
  return [{
    customerId: '123-456-7890',
    name: 'Conta de Demonstração',
    email: 'demo@example.com'
  }]
}

/**
 * Buscar campanhas do Google Ads
 */
async function fetchGoogleAdsCampaigns(accessToken: string, accountId: string): Promise<any[]> {
  // Esta é uma implementação simplificada
  // Na prática, você usaria a biblioteca oficial do Google Ads
  
  // TODO: Implementar chamada real à API do Google Ads
  // Exemplo com google-ads-api:
  // const query = `
  //   SELECT campaign.id, campaign.name, campaign.status, 
  //          campaign_budget.amount_micros, metrics.cost_micros,
  //          metrics.impressions, metrics.clicks
  //   FROM campaign
  //   WHERE campaign.status != 'REMOVED'
  // `
  
  // Simulação para desenvolvimento
  return [
    {
      id: 1001,
      name: 'Campanha de Lançamento - Search',
      status: 'ENABLED',
      budget: 50000, // R$ 500,00
      spend: 35000, // R$ 350,00
      impressions: 45000,
      clicks: 2300
    },
    {
      id: 1002,
      name: 'Campanha de Remarketing',
      status: 'PAUSED',
      budget: 30000, // R$ 300,00
      spend: 15000, // R$ 150,00
      impressions: 25000,
      clicks: 1200
    }
  ]
}

/**
 * Funções de criptografia (simplificadas para o exemplo)
 * Em produção, use uma biblioteca de criptografia robusta
 */
async function encryptTokens(tokens: GoogleAdsTokens): Promise<any> {
  // TODO: Implementar criptografia real
  // Por enquanto, apenas retorna os tokens
  return {
    accessToken: Buffer.from(tokens.accessToken).toString('base64'),
    refreshToken: Buffer.from(tokens.refreshToken).toString('base64'),
    expiresAt: tokens.expiresAt,
    scope: tokens.scope
  }
}

async function decryptTokens(encryptedTokens: any): Promise<GoogleAdsTokens> {
  // TODO: Implementar descriptografia real
  // Por enquanto, apenas decodifica do base64
  return {
    accessToken: Buffer.from(encryptedTokens.accessToken, 'base64').toString(),
    refreshToken: Buffer.from(encryptedTokens.refreshToken, 'base64').toString(),
    expiresAt: encryptedTokens.expiresAt,
    scope: encryptedTokens.scope
  }
}