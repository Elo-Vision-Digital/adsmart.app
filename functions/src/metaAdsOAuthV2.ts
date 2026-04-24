import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import axios from 'axios'
import { metaAdsAppSecret } from './config'
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

// Interface para tokens temporários
interface TemporaryTokenData {
  userId: string
  accessToken: string
  expiresAt: number
  scope: string
  tokenType: string
  createdAt: admin.firestore.Timestamp
}

/**
 * Processa o callback OAuth e retorna contas disponíveis para seleção
 */
export const handleMetaAdsCallbackWithSelection = onCall({ secrets: [metaAdsAppSecret] }, async (request) => {
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

    // Obter configurações Meta Ads
    const config = await getMetaAdsConfig()
    
    // IMPORTANTE: Usar o isLocalEnv armazenado no state para determinar o redirect URI
    const redirectUri = stateData.isLocalEnv 
      ? config.redirectUriDev 
      : config.redirectUri

    console.log('Processando callback OAuth:', {
      isLocalEnv: stateData.isLocalEnv,
      redirectUri,
      platform: 'meta_ads'
    })

    // Trocar código por tokens
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    tokenUrl.searchParams.append('client_id', config.appId)
    tokenUrl.searchParams.append('client_secret', config.appSecret)
    tokenUrl.searchParams.append('redirect_uri', redirectUri)
    tokenUrl.searchParams.append('code', code)

    const tokenResponse = await axios.get(tokenUrl.toString())
    const { access_token, token_type } = tokenResponse.data

    // Obter token de longo prazo
    const longLivedTokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    longLivedTokenUrl.searchParams.append('grant_type', 'fb_exchange_token')
    longLivedTokenUrl.searchParams.append('client_id', config.appId)
    longLivedTokenUrl.searchParams.append('client_secret', config.appSecret)
    longLivedTokenUrl.searchParams.append('fb_exchange_token', access_token)

    const longLivedResponse = await axios.get(longLivedTokenUrl.toString())
    const longLivedToken = longLivedResponse.data.access_token
    const longLivedExpiresIn = longLivedResponse.data.expires_in || 5184000 // 60 dias padrão

    // Obter informações do usuário e Business Managers
    const userInfo = await getUserInfoAndBusinessManagers(longLivedToken)
    
    // Obter todas as contas de anúncios acessíveis
    const allAdAccounts = await getAllAccessibleAdAccounts(longLivedToken, userInfo.businessManagers)

    // Criar token temporário para armazenar credenciais até a seleção ser confirmada
    const temporaryTokenId = admin.firestore().collection('temporary_oauth_tokens').doc().id
    
    const temporaryTokenData: TemporaryTokenData = {
      userId,
      accessToken: longLivedToken,
      expiresAt: Date.now() + (longLivedExpiresIn * 1000),
      scope: 'ads_read,ads_management,business_management,read_insights',
      tokenType: token_type || 'bearer',
      createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp
    }

    // Salvar token temporário (expira em 30 minutos)
    await admin.firestore()
      .collection('temporary_oauth_tokens')
      .doc(temporaryTokenId)
      .set({
        ...temporaryTokenData,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
      })

    // Log de sucesso parcial
    await securityLogger.logEvent(
      OAuthEventType.OAUTH_SUCCESS,
      userId,
      { 
        step: 'token_exchange',
        accountsFound: allAdAccounts.length,
        businessManagersFound: userInfo.businessManagers.length
      },
      SecuritySeverity.INFO
    )

    // Organizar contas por Business Manager
    const businessManagersMap = new Map()
    
    // Primeiro, adicionar todas as BMs conhecidas
    userInfo.businessManagers.forEach((bm: any) => {
      businessManagersMap.set(bm.id, {
        id: bm.id,
        name: bm.name,
        accounts: []
      })
    })
    
    // Adicionar grupo para contas pessoais
    businessManagersMap.set('personal', {
      id: 'personal',
      name: 'Contas Pessoais',
      accounts: []
    })
    
    // Distribuir as contas nas BMs corretas
    allAdAccounts.forEach(account => {
      const bmId = account.businessManagerId || 'personal'
      
      if (businessManagersMap.has(bmId)) {
        businessManagersMap.get(bmId).accounts.push({
          id: account.id,
          name: account.name,
          currency: account.currency,
          type: account.account_status === 1 ? 'Ativa' : 'Inativa',
          businessManager: account.businessManagerName || 'Conta Pessoal',
          businessManagerId: account.businessManagerId
        })
      } else {
        // Se a BM não estiver no mapa, adicionar nas contas pessoais
        businessManagersMap.get('personal').accounts.push({
          id: account.id,
          name: account.name,
          currency: account.currency,
          type: account.account_status === 1 ? 'Ativa' : 'Inativa',
          businessManager: account.businessManagerName || 'Conta Pessoal',
          businessManagerId: account.businessManagerId
        })
      }
    })
    
    // Converter para array, colocando contas pessoais primeiro se houver contas
    const businessManagersWithAccounts = []
    
    // Adicionar contas pessoais primeiro, se houver
    const personalBM = businessManagersMap.get('personal')
    if (personalBM && personalBM.accounts.length > 0) {
      businessManagersWithAccounts.push(personalBM)
    }
    
    // Adicionar outras BMs
    businessManagersMap.forEach((bm, id) => {
      if (id !== 'personal') {
        businessManagersWithAccounts.push(bm)
      }
    })

    console.log(`Retornando ${businessManagersWithAccounts.length} Business Managers com contas`)
    console.log('Business Managers detalhadas:', JSON.stringify(businessManagersWithAccounts, null, 2))
    console.log('Total de contas por BM:', businessManagersWithAccounts.map(bm => `${bm.name}: ${bm.accounts.length} contas`))

    return {
      success: true,
      accountsAvailable: allAdAccounts.map(account => ({
        id: account.id,
        name: account.name,
        currency: account.currency,
        type: account.account_status === 1 ? 'Ativa' : 'Inativa',
        businessManager: account.businessManagerName || 'Conta Pessoal',
        businessManagerId: account.businessManagerId
      })),
      businessManagers: businessManagersWithAccounts,
      mainAccount: {
        name: userInfo.email || userInfo.name || 'Conta Facebook',  // CORREÇÃO: Email primeiro
        email: userInfo.email  // Sempre incluir o email
      },
      temporaryToken: temporaryTokenId
    }

  } catch (error: any) {
    // Rethrow semantic HttpsError (e.g. invalid-argument, permission-denied,
    // deadline-exceeded) so callers can distinguish CSRF/validation failures
    // from genuine server faults.
    if (error instanceof HttpsError) {
      throw error
    }

    console.error('Erro detalhado Meta Ads:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    })

    await securityLogger.logEvent(
      OAuthEventType.OAUTH_ERROR,
      userId,
      {
        error: error.message,
        code: error.response?.status,
        details: error.response?.data,
      },
      SecuritySeverity.ERROR
    )

    if (error.response?.data?.error) {
      throw new HttpsError(
        'internal',
        error.response.data.error.message || 'Erro ao processar OAuth'
      )
    }

    throw new HttpsError('internal', 'Erro ao conectar conta Meta Ads')
  }
})

/**
 * Confirma a seleção de contas e salva no Firestore
 */
export const confirmMetaAdsAccountSelection = onCall({ secrets: [metaAdsAppSecret] }, async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }

  const { temporaryToken, selectedAccountIds } = request.data
  const userId = request.auth.uid

  if (!temporaryToken || !selectedAccountIds || selectedAccountIds.length === 0) {
    throw new HttpsError('invalid-argument', 'Token ou contas não especificadas')
  }

  try {
    // Buscar token temporário
    const tokenDoc = await admin.firestore()
      .collection('temporary_oauth_tokens')
      .doc(temporaryToken)
      .get()

    if (!tokenDoc.exists) {
      throw new HttpsError('not-found', 'Token expirado ou inválido')
    }

    const tokenData = tokenDoc.data() as TemporaryTokenData

    // Verificar se o token pertence ao usuário
    if (tokenData.userId !== userId) {
      throw new HttpsError('permission-denied', 'Token não autorizado')
    }

    // Verificar se não expirou
    if ((tokenData.expiresAt as any).toDate() < new Date()) {
      throw new HttpsError('deadline-exceeded', 'Token expirado')
    }

    // Buscar detalhes completos das contas selecionadas
    const selectedAccounts = await getAdAccountDetails(
      tokenData.accessToken, 
      selectedAccountIds
    )

    // Criptografar tokens antes de armazenar
    const encryptedTokens = await encryptTokens({
      accessToken: tokenData.accessToken,
      expiresAt: tokenData.expiresAt,
      scope: tokenData.scope,
      tokenType: tokenData.tokenType
    })

    // Salvar tokens e contas selecionadas
    const batch = admin.firestore().batch()

    // Salvar tokens criptografados
    const tokenRef = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('oauth_tokens')
      .doc('meta_ads')

    batch.set(tokenRef, {
      ...encryptedTokens,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    // Salvar informações das contas selecionadas
    for (const account of selectedAccounts) {
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSyncAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
    }

    await batch.commit()

    // Deletar token temporário
    await admin.firestore()
      .collection('temporary_oauth_tokens')
      .doc(temporaryToken)
      .delete()

    // Log de sucesso final
    await securityLogger.logEvent(
      OAuthEventType.OAUTH_SUCCESS,
      userId,
      { 
        accountsConnected: selectedAccounts.length,
        accountIds: selectedAccounts.map(a => a.id)
      },
      SecuritySeverity.INFO
    )

    return {
      success: true,
      accountsConnected: selectedAccounts.length
    }

  } catch (error: any) {
    console.error('Erro ao confirmar seleção:', error)
    throw new HttpsError('internal', 'Erro ao salvar contas selecionadas')
  }
})

/**
 * Obter informações do usuário e Business Managers
 */
async function getUserInfoAndBusinessManagers(accessToken: string): Promise<any> {
  try {
    // Buscar informações do usuário
    const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        access_token: accessToken,
        fields: 'id,name,email'
      }
    })

    const userData = userResponse.data

    // Buscar TODAS as Business Managers com paginação
    let businessManagers: any[] = []
    let nextUrl = `https://graph.facebook.com/v18.0/${userData.id}/businesses`
    let hasMore = true

    while (hasMore) {
      const response = await axios.get(nextUrl, {
        params: nextUrl === `https://graph.facebook.com/v18.0/${userData.id}/businesses` ? {
          access_token: accessToken,
          fields: 'id,name,created_time,primary_page',
          limit: 100  // Buscar até 100 BMs por vez
        } : undefined
      })

      businessManagers = [...businessManagers, ...(response.data.data || [])]
      
      // Verificar se há mais páginas
      if (response.data.paging?.next) {
        nextUrl = response.data.paging.next
      } else {
        hasMore = false
      }
    }

    console.log(`Encontradas ${businessManagers.length} Business Managers`)

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      businessManagers: businessManagers
    }
  } catch (error: any) {
    console.error('Erro ao buscar informações do usuário:', error.response?.data || error)
    throw error
  }
}

/**
 * Obter todas as contas de anúncios acessíveis
 */
async function getAllAccessibleAdAccounts(accessToken: string, businessManagers: any[]): Promise<any[]> {
  const accountsMap = new Map() // Para evitar duplicatas

  // Buscar contas pessoais primeiro
  try {
    const personalAccountsResponse = await axios.get('https://graph.facebook.com/v18.0/me/adaccounts', {
      params: {
        access_token: accessToken,
        fields: 'id,name,currency,timezone_name,account_status,business',
        limit: 200  // Buscar mais contas por vez
      }
    })

    const personalAccounts = personalAccountsResponse.data.data || []
    console.log(`Encontradas ${personalAccounts.length} contas no endpoint /me/adaccounts`)
    
    // DEBUG: Log completo da primeira conta para entender a estrutura
    if (personalAccounts.length > 0) {
      console.log('=== DEBUG PRIMEIRA CONTA ===')
      console.log('Conta completa:', JSON.stringify(personalAccounts[0], null, 2))
      console.log('=========================')
    }
    
    for (const account of personalAccounts) {
      const accountId = account.id.replace('act_', '')
      
      // CORREÇÃO: Verificar se a conta tem business e qual é o ID
      const businessId = account.business?.id || null
      const businessName = account.business?.name || null
      
      console.log(`Conta ${account.name}: business.id = ${businessId}, business.name = ${businessName}`)
      
      if (!accountsMap.has(accountId)) {
        accountsMap.set(accountId, {
          ...account,
          id: accountId,
          businessManagerId: businessId,
          businessManagerName: businessId ? businessName : null
        })
      }
    }
  } catch (error) {
    console.error('Erro ao buscar contas pessoais:', error)
  }

  // Buscar contas de cada Business Manager
  for (const bm of businessManagers) {
    try {
      // Buscar contas owned (próprias)
      const bmOwnedResponse = await axios.get(`https://graph.facebook.com/v18.0/${bm.id}/owned_ad_accounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,currency,timezone_name,account_status',
          limit: 200
        }
      })

      const bmOwnedAccounts = bmOwnedResponse.data.data || []
      console.log(`BM ${bm.name}: ${bmOwnedAccounts.length} contas owned`)
      
      for (const account of bmOwnedAccounts) {
        const accountId = account.id.replace('act_', '')
        if (!accountsMap.has(accountId)) {
          accountsMap.set(accountId, {
            ...account,
            id: accountId,
            businessManagerId: bm.id,
            businessManagerName: bm.name
          })
        } else {
          // CORREÇÃO: Atualizar informações do BM se ainda não tiver
          const existingAccount = accountsMap.get(accountId)
          if (!existingAccount.businessManagerId) {
            existingAccount.businessManagerId = bm.id
            existingAccount.businessManagerName = bm.name
            accountsMap.set(accountId, existingAccount)
          }
        }
      }

      // Buscar contas client (clientes)
      const bmClientResponse = await axios.get(`https://graph.facebook.com/v18.0/${bm.id}/client_ad_accounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,currency,timezone_name,account_status',
          limit: 200
        }
      })

      const bmClientAccounts = bmClientResponse.data.data || []
      console.log(`BM ${bm.name}: ${bmClientAccounts.length} contas client`)
      
      for (const account of bmClientAccounts) {
        const accountId = account.id.replace('act_', '')
        if (!accountsMap.has(accountId)) {
          accountsMap.set(accountId, {
            ...account,
            id: accountId,
            businessManagerId: bm.id,
            businessManagerName: `${bm.name} (Cliente)`
          })
        } else {
          // CORREÇÃO: Atualizar informações do BM se ainda não tiver
          const existingAccount = accountsMap.get(accountId)
          if (!existingAccount.businessManagerId) {
            existingAccount.businessManagerId = bm.id
            existingAccount.businessManagerName = `${bm.name} (Cliente)`
            accountsMap.set(accountId, existingAccount)
          }
        }
      }

    } catch (error: any) {
      console.error(`Erro ao buscar contas do BM ${bm.name} (${bm.id}):`, error.response?.data || error)
    }
  }

  // Converter Map para Array e filtrar apenas contas ativas
  const allAccountsArray = Array.from(accountsMap.values())
    .filter(account => account.account_status === 1)
    .sort((a, b) => {
      // Ordenar por BM e depois por nome da conta
      const aName = a.businessManagerName || 'ZZZ_Pessoal' // Colocar pessoais no final
      const bName = b.businessManagerName || 'ZZZ_Pessoal'
      
      if (aName === bName) {
        return a.name.localeCompare(b.name)
      }
      return aName.localeCompare(bName)
    })

  console.log(`Total de ${allAccountsArray.length} contas ativas encontradas`)
  console.log('Resumo por BM:')
  
  // Log resumo de contas por BM
  const bmSummary = new Map()
  allAccountsArray.forEach(account => {
    const bmName = account.businessManagerName || 'Contas Pessoais'
    bmSummary.set(bmName, (bmSummary.get(bmName) || 0) + 1)
  })
  
  bmSummary.forEach((count, bmName) => {
    console.log(`- ${bmName}: ${count} contas`)
  })
  
  return allAccountsArray
}

/**
 * Buscar detalhes das contas selecionadas
 */
async function getAdAccountDetails(accessToken: string, accountIds: string[]): Promise<any[]> {
  const accounts = []

  for (const accountId of accountIds) {
    try {
      // Adicionar prefixo act_ se não tiver
      const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`
      
      const response = await axios.get(`https://graph.facebook.com/v18.0/${formattedAccountId}`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,currency,timezone_name,account_status'
        }
      })

      const accountData = response.data
      accounts.push({
        ...accountData,
        id: accountData.id.replace('act_', '')
      })
    } catch (error) {
      console.error(`Erro ao buscar detalhes da conta ${accountId}:`, error)
    }
  }

  return accounts
}

/**
 * Obter configurações do Meta Ads
 */
async function getMetaAdsConfig() {
  // App secret via defineSecret (Secret Manager); demais valores via process.env
  return {
    appId: process.env.META_ADS_APP_ID || '4052927898253765',
    appSecret: metaAdsAppSecret.value(),
    redirectUri: 'https://adsmart.app/auth/meta-ads/callback',
    redirectUriDev: 'http://localhost:5173/auth/meta-ads/callback'
  }
}

/**
 * Funções de criptografia (simplificadas)
 * TODO: Implementar criptografia real com crypto-js ou similar
 */
async function encryptTokens(tokens: any): Promise<any> {
  return {
    accessToken: Buffer.from(tokens.accessToken).toString('base64'),
    expiresAt: tokens.expiresAt,
    scope: tokens.scope,
    tokenType: tokens.tokenType
  }
}