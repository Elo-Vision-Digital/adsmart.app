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

// Interface para tokens temporários
interface TemporaryTokenData {
  userId: string
  accessToken: string
  refreshToken: string
  expiresAt: number
  scope: string
  createdAt: admin.firestore.Timestamp
}

/**
 * Processa o callback OAuth e retorna contas disponíveis para seleção
 */
export const handleGoogleAdsCallbackWithSelection = onCall(async (request) => {
  console.log('=== INICIANDO handleGoogleAdsCallbackWithSelection ===')
  
  // Verificar autenticação
  if (!request.auth) {
    console.error('Erro: Usuário não autenticado')
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }

  const { code, state } = request.data
  const userId = request.auth.uid

  console.log('Dados recebidos:', { 
    hasCode: !!code, 
    hasState: !!state, 
    userId,
    codeLength: code?.length,
    stateLength: state?.length 
  })

  if (!code || !state) {
    console.error('Erro: Código ou state ausente')
    throw new HttpsError('invalid-argument', 'Código ou state ausente')
  }

  try {
    // Verificar state token
    console.log('1. Verificando state token...')
    const stateDoc = await admin.firestore().collection('oauth_states').doc(state).get()
    
    if (!stateDoc.exists) {
      console.error('Erro: State não encontrado no Firestore')
      throw new HttpsError('invalid-argument', 'State inválido')
    }

    const stateData = stateDoc.data()!
    console.log('State data completo:', JSON.stringify(stateData, null, 2))
    
    // Verificar se o state pertence ao usuário correto
    if (stateData.userId !== userId) {
      console.error('Erro: State pertence a outro usuário')
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
      console.error('Erro: State expirado')
      throw new HttpsError('deadline-exceeded', 'State expirado')
    }

    // Deletar state usado
    await admin.firestore().collection('oauth_states').doc(state).delete()
    console.log('State validado e deletado')

    // Obter configurações OAuth
    console.log('2. Obtendo configurações OAuth...')
    const config = await getGoogleAdsConfig()
    
    // CORREÇÃO CRÍTICA: Determinar o redirect URI correto
    const isLocalEnv = stateData.isLocalEnv === true
    
    // Se não tiver isLocalEnv no state ou for false, usar produção
    const redirectUri = isLocalEnv 
      ? 'http://localhost:5173/auth/google-ads/callback'
      : 'https://adsmart.app/auth/google-ads/callback'

    console.log('Determinação do redirect URI:', {
      stateIsLocalEnv: stateData.isLocalEnv,
      isLocalEnvBoolean: isLocalEnv,
      redirectUriFinal: redirectUri,
      environment: isLocalEnv ? 'development' : 'production'
    })

    console.log('3. Trocando código por tokens...')
    console.log('Token exchange params completos:', {
      code: code.substring(0, 20) + '...',
      client_id: config.clientId,
      client_secret: config.clientSecret.substring(0, 10) + '...',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })

    // Trocar código por tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })

    console.log('Token response status:', tokenResponse.status)
    console.log('Token response keys:', Object.keys(tokenResponse.data))

    const { access_token, refresh_token, expires_in, scope } = tokenResponse.data

    if (!access_token) {
      console.error('Erro: Access token não recebido')
      throw new Error('Access token não recebido do Google')
    }

    console.log('4. Obtendo informações do usuário...')
    // Obter informações do usuário Google usando a API diretamente
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    })
    
    const googleUserInfo = userInfoResponse.data
    console.log('User info obtido:', { 
      hasName: !!googleUserInfo.name, 
      hasEmail: !!googleUserInfo.email 
    })

    console.log('5. Listando contas Google Ads...')
    // Obter lista de contas Google Ads acessíveis
    try {
      const googleAdsAccounts = await listAccessibleGoogleAdsAccounts(access_token)
      console.log(`Encontradas ${googleAdsAccounts.length} contas Google Ads`)
      
      // Criar token temporário para armazenar credenciais até a seleção ser confirmada
      const temporaryTokenId = admin.firestore().collection('temporary_oauth_tokens').doc().id
      
      const temporaryTokenData: TemporaryTokenData = {
        userId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + (expires_in * 1000),
        scope,
        createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp
      }

      console.log('6. Salvando token temporário...')
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
          accountsFound: googleAdsAccounts.length
        },
        SecuritySeverity.INFO
      )

      console.log('=== SUCESSO: Retornando dados ===')
      return {
        success: true,
        accountsAvailable: googleAdsAccounts.map(account => ({
          id: account.customerId.replace(/-/g, ''),
          name: account.descriptiveName || 'Conta sem nome',
          currency: account.currencyCode,
          type: account.type,
          email: account.email
        })),
        mainAccount: {
          name: googleUserInfo.name || googleUserInfo.email || 'Conta Google',
          email: googleUserInfo.email
        },
        temporaryToken: temporaryTokenId
      }
    } catch (apiError: any) {
      console.error('ERRO ao listar contas Google Ads:', {
        message: apiError.message,
        status: apiError.response?.status,
        data: apiError.response?.data
      })
      
      // Se não houver contas ou erro de permissão, retornar lista vazia
      if (apiError.response?.status === 403 || apiError.response?.status === 401) {
        console.log('Erro de permissão ao acessar Google Ads - retornando lista vazia')
        
        // Ainda assim, salvar o token para permitir reconexão futura
        const temporaryTokenId = admin.firestore().collection('temporary_oauth_tokens').doc().id
        
        const temporaryTokenData: TemporaryTokenData = {
          userId,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: Date.now() + (expires_in * 1000),
          scope,
          createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp
        }

        await admin.firestore()
          .collection('temporary_oauth_tokens')
          .doc(temporaryTokenId)
          .set({
            ...temporaryTokenData,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
          })

        return {
          success: true,
          accountsAvailable: [],
          mainAccount: {
            name: googleUserInfo.name || googleUserInfo.email || 'Conta Google',
            email: googleUserInfo.email
          },
          temporaryToken: temporaryTokenId
        }
      }
      
      // Para outros erros, propagar
      throw apiError
    }

  } catch (error: any) {
    console.error('=== ERRO DETALHADO ===')
    console.error('Mensagem:', error.message)
    console.error('Status:', error.response?.status)
    console.error('Data:', JSON.stringify(error.response?.data, null, 2))
    console.error('Config usada:', error.config)
    console.error('Stack:', error.stack)
    
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
      throw new HttpsError('internal', error.response.data.error_description || error.response.data.error || 'Erro ao processar OAuth')
    }
    
    throw new HttpsError('internal', error.message || 'Erro ao conectar conta Google Ads')
  }
})

/**
 * Confirma a seleção de contas e salva no Firestore
 */
export const confirmGoogleAdsAccountSelection = onCall(async (request) => {
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
    const selectedAccounts = await getGoogleAdsAccountDetails(
      tokenData.accessToken, 
      selectedAccountIds
    )

    // Criptografar tokens antes de armazenar
    const encryptedTokens = await encryptTokens({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt,
      scope: tokenData.scope
    })

    // Salvar tokens e contas selecionadas
    const batch = admin.firestore().batch()

    // Salvar tokens criptografados
    const tokenRef = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('oauth_tokens')
      .doc('google_ads')

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
        .doc(`google_ads_${account.customerId}`)

      batch.set(accountRef, {
        platform: 'google_ads',
        accountId: account.customerId,
        accountName: account.descriptiveName,
        email: account.email || request.auth.token.email,
        currency: account.currencyCode,
        timezone: account.timeZone,
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
        accountIds: selectedAccounts.map(a => a.customerId)
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
 * Lista todas as contas Google Ads acessíveis
 */
async function listAccessibleGoogleAdsAccounts(accessToken: string): Promise<any[]> {
  try {
    console.log('listAccessibleGoogleAdsAccounts: Iniciando...')
    
    // MODO TESTE: Apenas se explicitamente ativado
    if (process.env.GOOGLE_ADS_TEST_MODE === 'true') {
      console.log('MODO TESTE EXPLICITAMENTE ATIVADO - Retornando conta fictícia')
      return [{
        customerId: '1234567890',
        descriptiveName: 'Conta de Teste - Adsmart',
        currencyCode: 'BRL',
        timeZone: 'America/Sao_Paulo',
        type: 'GOOGLE_ADS'
      }]
    }
    
    // Obter developer token primeiro
    const developerToken = await getDeveloperToken()
    console.log('Developer token:', {
      exists: !!developerToken,
      length: developerToken?.length,
      prefix: developerToken?.substring(0, 5) + '...'
    })
    
    // Usar Google Ads API v17
    const apiEndpoint = 'https://googleads.googleapis.com/v17/customers:listAccessibleCustomers'
    
    console.log('Preparando requisição para Google Ads API:')
    console.log('Endpoint:', apiEndpoint)
    console.log('Headers a serem enviados:', {
      'Authorization': `Bearer ${accessToken.substring(0, 20)}...`,
      'Content-Type': 'application/json',
      'developer-token': developerToken
    })
    
    try {
      const response = await axios.get(apiEndpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'developer-token': developerToken
        }
      })

      console.log('Resposta da API Google Ads:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataKeys: Object.keys(response.data || {})
      })

      const customerIds = response.data.resourceNames || []
      
      console.log(`API retornou ${customerIds.length} contas acessíveis`)
      
      if (customerIds.length === 0) {
        console.log('Nenhuma conta Google Ads encontrada para este usuário')
        return []
      }

      // Buscar detalhes de cada conta
      const accounts = []
      for (const resourceName of customerIds) {
        const customerId = resourceName.replace('customers/', '')
        
        try {
          console.log(`Buscando detalhes da conta ${customerId}...`)
          const customerResponse = await axios.post(
            `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
            {
              query: `
                SELECT 
                  customer.id,
                  customer.descriptive_name,
                  customer.currency_code,
                  customer.time_zone,
                  customer.manager,
                  customer.test_account
                FROM customer
                WHERE customer.id = ${customerId}
              `
            },
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'developer-token': developerToken,
                'login-customer-id': customerId
              }
            }
          )

          const customerData = customerResponse.data.results?.[0]?.customer
          
          if (customerData && !customerData.testAccount && !customerData.manager) {
            accounts.push({
              customerId: customerData.id,
              descriptiveName: customerData.descriptiveName,
              currencyCode: customerData.currencyCode,
              timeZone: customerData.timeZone,
              type: 'GOOGLE_ADS'
            })
            console.log(`Conta ${customerId} adicionada à lista`)
          } else {
            console.log(`Conta ${customerId} ignorada:`, {
              isTestAccount: customerData?.testAccount,
              isManager: customerData?.manager
            })
          }
        } catch (err: any) {
          console.error(`Erro ao buscar detalhes da conta ${customerId}:`, {
            message: err.message,
            status: err.response?.status,
            error: err.response?.data?.error
          })
        }
      }

      console.log(`Total de ${accounts.length} contas válidas encontradas`)
      return accounts
      
    } catch (apiError: any) {
      console.error('ERRO na chamada da API Google Ads:')
      console.error('Status:', apiError.response?.status)
      console.error('Status Text:', apiError.response?.statusText)
      console.error('Error Data:', JSON.stringify(apiError.response?.data, null, 2))
      console.error('Error Headers:', apiError.response?.headers)
      
      // Verificar se é erro de autenticação
      if (apiError.response?.status === 401) {
        console.error('Erro 401 - Possíveis causas:')
        console.error('1. Developer token inválido ou expirado')
        console.error('2. Token de acesso OAuth expirado')
        console.error('3. Permissões insuficientes')
        console.error('4. Conta não tem acesso ao Google Ads')
      }
      
      throw apiError
    }
    
  } catch (error: any) {
    console.error('ERRO GERAL em listAccessibleGoogleAdsAccounts:')
    console.error('Mensagem:', error.message)
    console.error('Stack:', error.stack)
    
    // Se for erro de autenticação/autorização, retornar array vazio
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.log('Erro de autorização - retornando array vazio')
      return []
    }
    
    throw error
  }
}

/**
 * Busca detalhes completos das contas selecionadas
 */
async function getGoogleAdsAccountDetails(accessToken: string, accountIds: string[]): Promise<any[]> {
  // MODO TESTE: Apenas se explicitamente ativado
  if (process.env.GOOGLE_ADS_TEST_MODE === 'true') {
    console.log('MODO TESTE EXPLICITAMENTE ATIVADO - Retornando detalhes fictícios das contas')
    return accountIds.map(id => ({
      customerId: id,
      descriptiveName: `Conta de Teste ${id}`,
      currencyCode: 'BRL',
      timeZone: 'America/Sao_Paulo'
    }))
  }

  const accounts = []
  const developerToken = await getDeveloperToken()
  
  for (const accountId of accountIds) {
    try {
      const response = await axios.post(
        `https://googleads.googleapis.com/v17/customers/${accountId}/googleAds:search`,
        {
          query: `
            SELECT 
              customer.id,
              customer.descriptive_name,
              customer.currency_code,
              customer.time_zone
            FROM customer
            WHERE customer.id = ${accountId}
          `
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'developer-token': developerToken
          }
        }
      )

      const customerData = response.data.results?.[0]?.customer
      if (customerData) {
        accounts.push(customerData)
      }
    } catch (error: any) {
      console.error(`Erro ao buscar detalhes da conta ${accountId}:`, {
        message: error.message,
        response: error.response?.data
      })
    }
  }
  
  return accounts
}

/**
 * Obter developer token do Google Ads
 */
async function getDeveloperToken(): Promise<string> {
  const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || 'wRhu9OHLIWdbht2HY3B9yw'
  console.log('Developer token configurado')
  return token
}

/**
 * Obter configurações do Google Ads
 * IMPORTANTE: Agora incluindo todos os escopos necessários
 */
async function getGoogleAdsConfig() {
  const config = {
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '422483165860-npdsq44121mh4chg2gers6qade02bo5l.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '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',
    redirectUri: process.env.GOOGLE_ADS_REDIRECT_URI || 'https://adsmart.app/auth/google-ads/callback',
    redirectUriDev: process.env.GOOGLE_ADS_REDIRECT_URI_DEV || 'http://localhost:5173/auth/google-ads/callback',
    // ALTERAÇÃO IMPORTANTE: Adicionar todos os escopos necessários
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/adwords'
    ].join(' ')
  }
  
  console.log('Configurações carregadas com escopos:', config.scope)
  return config
}

/**
 * Funções de criptografia (simplificadas)
 * TODO: Implementar criptografia real com crypto-js ou similar
 */
async function encryptTokens(tokens: any): Promise<any> {
  return {
    accessToken: Buffer.from(tokens.accessToken).toString('base64'),
    refreshToken: Buffer.from(tokens.refreshToken).toString('base64'),
    expiresAt: tokens.expiresAt,
    scope: tokens.scope
  }
}