import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
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
const getMetaAdsConfig = () => {
  // Primeiro, verificar se estamos no emulador
  if (process.env.FUNCTIONS_EMULATOR) {
    try {
      const localConfig = require('../../.runtimeconfig.json')
      console.log('Emulator - Local config loaded for Meta:', JSON.stringify(localConfig.meta_ads, null, 2))
      if (localConfig.meta_ads) {
        return {
          appId: localConfig.meta_ads.app_id,
          appSecret: localConfig.meta_ads.app_secret,
          redirectUri: localConfig.meta_ads.redirect_uri || 'https://adsmart-web.web.app/auth/meta-ads/callback',
          redirectUriDev: localConfig.meta_ads.redirect_uri_dev || 'http://localhost:5173/auth/meta-ads/callback'
        }
      }
    } catch (error) {
      console.error('Erro ao carregar config local:', error)
    }
  }
  
  // Em produção com Functions v2, usar process.env diretamente
  console.log('Production - Checking Meta environment variables...')
  
  // Verificar se temos as variáveis de ambiente (Functions v2)
  if (process.env.META_ADS__APP_ID) {
    console.log('Found v2 Meta environment variables')
    return {
      appId: process.env.META_ADS__APP_ID,
      appSecret: process.env.META_ADS__APP_SECRET || '',
      redirectUri: process.env.META_ADS__REDIRECT_URI || 'https://adsmart-web.web.app/auth/meta-ads/callback',
      redirectUriDev: process.env.META_ADS__REDIRECT_URI_DEV || 'http://localhost:5173/auth/meta-ads/callback'
    }
  }
  
  // Tentar usar functions.config() para retrocompatibilidade
  try {
    const functions = require('firebase-functions')
    const functionConfig = functions.config()
    console.log('Production - Meta config:', JSON.stringify(functionConfig.meta_ads, null, 2))
    
    if (functionConfig.meta_ads) {
      return {
        appId: functionConfig.meta_ads.app_id,
        appSecret: functionConfig.meta_ads.app_secret,
        redirectUri: functionConfig.meta_ads.redirect_uri || 'https://adsmart-web.web.app/auth/meta-ads/callback',
        redirectUriDev: functionConfig.meta_ads.redirect_uri_dev || 'http://localhost:5173/auth/meta-ads/callback'
      }
    }
  } catch (error) {
    console.log('functions.config() not available (v2 functions)')
  }
  
  // Fallback direto com valores hardcoded para produção
  console.log('Using hardcoded Meta production values')
  return {
    appId: '4052927898253765',
    appSecret: '2f0e01c4fd98450545053e84c90f250a',
    redirectUri: 'https://adsmart-web.web.app/auth/meta-ads/callback',
    redirectUriDev: 'http://localhost:5173/auth/meta-ads/callback'
  }
}

// Carregar configurações
const metaConfig = getMetaAdsConfig()

// Configurações OAuth do Meta Ads (Facebook)
const META_ADS_CONFIG = {
  appId: metaConfig.appId,
  appSecret: metaConfig.appSecret,
  redirectUri: process.env.FUNCTIONS_EMULATOR ? metaConfig.redirectUriDev : metaConfig.redirectUri,
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
export const getMetaAdsAuthUrl = onCall(async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }

  const userId = request.auth.uid

  // Log de segurança
  await securityLogger.logEvent(
    OAuthEventType.OAUTH_INIT,
    userId,
    { platform: 'meta_ads' },
    SecuritySeverity.INFO
  )

  // Gerar state token para prevenir CSRF
  const state = admin.firestore().collection('oauth_states').doc().id
  
  // Salvar state no Firestore com TTL de 10 minutos
  try {
    const db = admin.firestore()
    await db.collection('oauth_states').doc(state).set({
      userId,
      platform: 'meta_ads',
      createdAt: admin.firestore.FieldValue?.serverTimestamp?.() || new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
    })
  } catch (error) {
    console.error('Erro ao salvar state:', error)
    // Continuar mesmo se falhar ao salvar o state
  }

  // Construir URL de autorização
  const authUrl = new URL(META_ADS_CONFIG.authUrl)
  authUrl.searchParams.append('client_id', META_ADS_CONFIG.appId)
  authUrl.searchParams.append('redirect_uri', META_ADS_CONFIG.redirectUri)
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
 */
export const handleMetaAdsCallback = onCall(async (request) => {
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

    // Trocar código por tokens
    console.log('Trocando código por token Meta Ads...');
    console.log('URL:', META_ADS_CONFIG.tokenUrl);
    console.log('Params:', {
      client_id: META_ADS_CONFIG.appId,
      client_secret: '***',
      redirect_uri: META_ADS_CONFIG.redirectUri,
      code: code.substring(0, 10) + '...'
    });
    
    const tokenUrl = new URL(META_ADS_CONFIG.tokenUrl)
    tokenUrl.searchParams.append('client_id', META_ADS_CONFIG.appId)
    tokenUrl.searchParams.append('client_secret', META_ADS_CONFIG.appSecret)
    tokenUrl.searchParams.append('redirect_uri', META_ADS_CONFIG.redirectUri)
    tokenUrl.searchParams.append('code', code)

    const tokenResponse = await axios.get(tokenUrl.toString())
    const { access_token, token_type } = tokenResponse.data

    // Obter token de longo prazo
    const longLivedTokenUrl = new URL(`https://graph.facebook.com/${META_ADS_CONFIG.apiVersion}/oauth/access_token`)
    longLivedTokenUrl.searchParams.append('grant_type', 'fb_exchange_token')
    longLivedTokenUrl.searchParams.append('client_id', META_ADS_CONFIG.appId)
    longLivedTokenUrl.searchParams.append('client_secret', META_ADS_CONFIG.appSecret)
    longLivedTokenUrl.searchParams.append('fb_exchange_token', access_token)

    const longLivedResponse = await axios.get(longLivedTokenUrl.toString())
    const longLivedToken = longLivedResponse.data.access_token
    const longLivedExpiresIn = longLivedResponse.data.expires_in || 5184000 // 60 dias padrão

    // Criptografar tokens antes de armazenar
    const encryptedTokens = await encryptTokens({
      accessToken: longLivedToken,
      expiresAt: Date.now() + (longLivedExpiresIn * 1000),
      scope: META_ADS_CONFIG.scope,
      tokenType: token_type || 'bearer'
    })

    // Obter informações das contas de anúncios
    const adAccounts = await getMetaAdsAccounts(longLivedToken)

    // Salvar tokens e informações das contas
    const batch = admin.firestore().batch()

    // Salvar tokens criptografados
    const tokenRef = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('oauth_tokens')
      .doc('meta_ads')

    batch.set(tokenRef, {
      ...encryptedTokens,
      updatedAt: admin.firestore.FieldValue?.serverTimestamp?.() || new Date()
    })

    // Salvar informações das contas
    for (const account of adAccounts) {
      const accountRef = admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('adAccounts')
        .doc(`meta_ads_${account.id}`)

      batch.set(accountRef, {
        platform: 'meta_ads',
        accountId: account.id,
        accountName: account.name,
        email: account.email || request.auth.token.email,
        currency: account.currency,
        timezone: account.timezone_name,
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
        accountsConnected: adAccounts.length,
        accountIds: adAccounts.map(a => a.id)
      },
      SecuritySeverity.INFO
    )

    return {
      success: true,
      accountsConnected: adAccounts.length,
      accounts: adAccounts.map(account => ({
        id: account.id,
        name: account.name,
        currency: account.currency
      }))
    }

  } catch (error: any) {
    console.error('Erro detalhado Meta Ads:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        params: error.config?.params
      }
    });
    
    // Log de erro
    await securityLogger.logEvent(
      OAuthEventType.OAUTH_ERROR,
      userId,
      { 
        error: error.message,
        code: error.response?.status,
        details: error.response?.data
      },
      SecuritySeverity.ERROR
    )

    if (error.response?.data?.error) {
      throw new HttpsError('internal', error.response.data.error.message || 'Erro ao processar OAuth')
    }
    
    throw new HttpsError('internal', 'Erro ao conectar conta Meta Ads')
  }
})

/**
 * Busca campanhas do Meta Ads
 */
export const getMetaAdsCampaigns = onCall(async (request) => {
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

      batch.set(campaignRef, {
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
        lastSyncAt: admin.firestore.FieldValue?.serverTimestamp?.() || new Date()
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

  const encryptedTokens = tokenDoc.data()!
  const tokens = await decryptTokens(encryptedTokens)

  // Meta Ads tokens de longo prazo duram 60 dias
  // Verificar se está próximo de expirar (menos de 7 dias)
  const daysUntilExpiry = (tokens.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)
  
  if (daysUntilExpiry < 7) {
    console.warn(`Token Meta Ads expirando em ${daysUntilExpiry.toFixed(0)} dias para usuário ${userId}`)
    // TODO: Implementar notificação para o usuário renovar a conexão
  }

  return tokens
}

/**
 * Buscar contas de anúncios do Meta Ads
 */
async function getMetaAdsAccounts(accessToken: string): Promise<any[]> {
  try {
    // Buscar contas de anúncios do usuário
    const url = `https://graph.facebook.com/${META_ADS_CONFIG.apiVersion}/me/adaccounts`
    const params = {
      access_token: accessToken,
      fields: 'id,name,currency,timezone_name,account_status'
    }

    const response = await axios.get(url, { params })
    
    // Filtrar apenas contas ativas
    const accounts = response.data.data.filter((account: any) => 
      account.account_status === 1 // 1 = ACTIVE
    )

    return accounts.map((account: any) => ({
      id: account.id.replace('act_', ''), // Remover prefixo act_
      name: account.name,
      currency: account.currency,
      timezone_name: account.timezone_name
    }))
  } catch (error: any) {
    console.error('Erro ao buscar contas Meta Ads:', error.response?.data || error)
    throw error
  }
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

/**
 * Funções de criptografia (simplificadas para o exemplo)
 * Em produção, use uma biblioteca de criptografia robusta
 */
async function encryptTokens(tokens: MetaAdsTokens): Promise<any> {
  // TODO: Implementar criptografia real
  // Por enquanto, apenas retorna os tokens
  return {
    accessToken: Buffer.from(tokens.accessToken).toString('base64'),
    expiresAt: tokens.expiresAt,
    scope: tokens.scope,
    tokenType: tokens.tokenType
  }
}

async function decryptTokens(encryptedTokens: any): Promise<MetaAdsTokens> {
  // TODO: Implementar descriptografia real
  // Por enquanto, apenas decodifica do base64
  return {
    accessToken: Buffer.from(encryptedTokens.accessToken, 'base64').toString(),
    expiresAt: encryptedTokens.expiresAt,
    scope: encryptedTokens.scope,
    tokenType: encryptedTokens.tokenType || 'bearer'
  }
}