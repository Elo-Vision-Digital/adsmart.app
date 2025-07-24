import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import axios from 'axios'

// Inicializar admin se ainda não foi
if (!admin.apps.length) {
  admin.initializeApp()
}

// Configuração do SuitPay
const SUITPAY_CONFIG = {
  baseUrl: 'https://ws.suitpay.app/api/v1',
  clientId: 'zennytecnologiagmailcom_1751904729049',
  clientSecret: 'd1c48e60e3f4706d1d84a3f7a2652f22f6d89297857cd377650063eba25bc3d0bada6d0151c14ce8aa48a18344cfe2f0'
}

// Possíveis endpoints para tentar
const PIX_ENDPOINTS = [
  '/pix',
  '/pix/create',
  '/pix/qrcode',
  '/payment/pix',
  '/pix/qrcode/create',
  '/qrcode/pix'
]

/**
 * Tenta criar pagamento PIX em diferentes endpoints
 */
async function tryCreatePixPayment(paymentData: any, headers: any) {
  let lastError: any = null
  
  for (const endpoint of PIX_ENDPOINTS) {
    try {
      console.log(`🔄 Tentando endpoint: ${SUITPAY_CONFIG.baseUrl}${endpoint}`)
      
      const response = await axios.post(
        `${SUITPAY_CONFIG.baseUrl}${endpoint}`,
        paymentData,
        {
          headers,
          validateStatus: function (status) {
            return status >= 200 && status < 500
          },
          timeout: 30000 // 30 segundos
        }
      )
      
      console.log(`📡 Response status para ${endpoint}:`, response.status)
      
      // Se não for 404, retornar a resposta (mesmo que seja erro)
      if (response.status !== 404) {
        return { response, endpoint }
      }
      
      lastError = { 
        endpoint, 
        status: response.status, 
        data: response.data 
      }
      
    } catch (error: any) {
      console.error(`❌ Erro no endpoint ${endpoint}:`, error.message)
      lastError = error
    }
  }
  
  throw lastError
}

/**
 * Cria um pagamento PIX via SuitPay
 */
export const createPixPayment = onCall({ cors: true }, async (request) => {
  console.log('🚀 === INICIO DA FUNCAO createPixPayment ===')
  console.log('🚀 Request data:', JSON.stringify(request.data))
  console.log('🚀 Auth exists:', !!request.auth)
  
  // Verificar autenticação
  if (!request.auth) {
    console.log('❌ Usuário não autenticado')
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }

  const { amount } = request.data
  const userId = request.auth.uid
  const userEmail = request.auth.token.email || ''

  // Validar valor
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw new HttpsError('invalid-argument', 'Valor inválido')
  }

  // Valor mínimo de R$ 5,00
  if (amount < 5) {
    throw new HttpsError('invalid-argument', 'Valor mínimo é R$ 5,00')
  }

  try {
    console.log('🔍 Iniciando criação de pagamento PIX')
    console.log('🔍 Request auth:', { uid: request.auth.uid, email: request.auth.token.email })
    console.log('🔍 Amount:', amount)
    console.log('🔍 Config:', { ...SUITPAY_CONFIG, clientSecret: '***' })
    
    console.log('💳 Criando pagamento PIX para usuário:', userId)
    
    // Buscar dados do usuário
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get()
    
    const userData = userDoc.data() || {}
    const userName = userData.displayName || request.auth.token.name || 'Cliente AdSmart'

    // Gerar data de vencimento (1 hora a partir de agora)
    const dueDate = new Date()
    dueDate.setHours(dueDate.getHours() + 1)
    const dueDateString = dueDate.toISOString().split('T')[0] // Formato YYYY-MM-DD

    // Headers de autenticação
    const headers = {
      'ci': SUITPAY_CONFIG.clientId,
      'cs': SUITPAY_CONFIG.clientSecret,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // Tentar diferentes estruturas de dados
    const paymentDataStructures = [
      // Estrutura 1: Baseada no SDK PHP (valor em reais)
      {
        dueDate: dueDateString,
        amount: amount, // Em reais
        callbackUrl: 'https://us-central1-adsmart-web.cloudfunctions.net/suitpayWebhook',
        clientData: {
          name: userName,
          document: userData.cpf || '00000000000',
          email: userEmail
        }
      },
      // Estrutura 2: Valor em centavos
      {
        dueDate: dueDateString,
        amount: Math.round(amount * 100), // Em centavos
        callbackUrl: 'https://us-central1-adsmart-web.cloudfunctions.net/suitpayWebhook',
        clientData: {
          name: userName,
          document: userData.cpf || '00000000000',
          email: userEmail
        }
      },
      // Estrutura 3: Com campos adicionais
      {
        value: amount.toFixed(2),
        dueDate: dueDateString,
        customer: {
          name: userName,
          email: userEmail,
          document: userData.cpf || '00000000000'
        },
        callbackUrl: 'https://us-central1-adsmart-web.cloudfunctions.net/suitpayWebhook'
      }
    ]

    let successResponse: any = null
    let lastError: any = null

    // Tentar cada estrutura de dados
    for (let i = 0; i < paymentDataStructures.length; i++) {
      const paymentData = paymentDataStructures[i]
      console.log(`\n🔄 Tentando estrutura ${i + 1}:`, JSON.stringify({
        ...paymentData,
        clientData: paymentData.clientData ? { ...paymentData.clientData, document: '***' } : undefined,
        customer: paymentData.customer ? { ...paymentData.customer, document: '***' } : undefined
      }))

      try {
        const result = await tryCreatePixPayment(paymentData, headers)
        
        if (result.response.status === 200 || result.response.status === 201) {
          console.log('✅ Sucesso com estrutura', i + 1, 'no endpoint', result.endpoint)
          successResponse = result
          break
        } else {
          console.log(`⚠️ Resposta ${result.response.status} com estrutura ${i + 1}`)
          lastError = {
            structure: i + 1,
            endpoint: result.endpoint,
            status: result.response.status,
            data: result.response.data
          }
        }
      } catch (error: any) {
        console.error(`❌ Erro com estrutura ${i + 1}:`, error.message)
        lastError = error
      }
    }

    if (!successResponse) {
      console.error('❌ Todas as tentativas falharam. Último erro:', lastError)
      
      if (lastError?.status === 400) {
        throw new HttpsError('invalid-argument', `Dados inválidos: ${JSON.stringify(lastError.data)}`)
      } else if (lastError?.status === 401) {
        throw new HttpsError('unauthenticated', 'Credenciais SuitPay inválidas')
      } else if (lastError?.status === 422) {
        throw new HttpsError('invalid-argument', `Erro de validação: ${JSON.stringify(lastError.data)}`)
      }
      
      throw new HttpsError('internal', 'Não foi possível criar o pagamento PIX. Tente novamente.')
    }

    const response = successResponse.response
    const responseData = response.data
    console.log('✅ Resposta completa da API SuitPay:', JSON.stringify(responseData, null, 2))

    // Mapear os campos da resposta - múltiplas possibilidades
    const paymentId = responseData.txId || 
                     responseData.txid || 
                     responseData.idTransaction || 
                     responseData.transactionId ||
                     responseData.id ||
                     `${Date.now()}`
    
    const qrCodeText = responseData.copyPasteKey || 
                      responseData.paymentCode || 
                      responseData.pixKey || 
                      responseData.qrCodeText ||
                      responseData.pixCopiaECola ||
                      responseData.emv ||
                      ''
    
    const qrCodeImage = responseData.qrCode || 
                       responseData.qrCodeImage || 
                       responseData.qrCodeBase64 ||
                       responseData.qrcode ||
                       responseData.base64 ||
                       ''
    
    // Extrair tempo de expiração
    const expirationSeconds = responseData.responsePayload?.calendario?.expiracao || 
                            responseData.expiration || 
                            3600
    const expiresAt = responseData.dueDate || 
                     responseData.expiresAt || 
                     new Date(Date.now() + (expirationSeconds * 1000)).toISOString()

    console.log('✅ PIX criado com sucesso:', {
      paymentId,
      qrCodeText: qrCodeText ? qrCodeText.substring(0, 50) + '...' : 'N/A',
      hasQrCodeImage: !!qrCodeImage,
      expiresAt
    })

    // Validar se temos os dados mínimos necessários
    if (!qrCodeText && !qrCodeImage) {
      console.error('❌ Resposta sem dados de pagamento:', responseData)
      throw new HttpsError('internal', 'Resposta da API não contém dados do PIX')
    }

    // Salvar informações do pagamento pendente
    await admin.firestore()
      .collection('pendingPayments')
      .doc(paymentId)
      .set({
        paymentId,
        userId,
        amount: amount,
        amountInCents: Math.round(amount * 100),
        status: 'pending',
        pixCode: qrCodeText,
        qrCode: qrCodeImage,
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(expiresAt)),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        endpoint: successResponse.endpoint,
        rawResponse: responseData
      })

    // Retornar dados do PIX para o frontend
    return {
      success: true,
      paymentId,
      qrCode: qrCodeImage,
      qrCodeText,
      amount: amount,
      expiresAt
    }

  } catch (error: any) {
    console.error('❌ Erro ao criar pagamento PIX:', error)
    
    if (error instanceof HttpsError) {
      throw error
    }
    
    throw new HttpsError('internal', error.message || 'Erro ao processar pagamento. Tente novamente.')
  }
})

/**
 * Verifica o status de um pagamento
 */
export const checkPaymentStatus = onCall({ cors: true }, async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }

  const { paymentId } = request.data
  const userId = request.auth.uid

  if (!paymentId) {
    throw new HttpsError('invalid-argument', 'ID do pagamento é obrigatório')
  }

  try {
    // Verificar se o pagamento pertence ao usuário
    const pendingPayment = await admin.firestore()
      .collection('pendingPayments')
      .doc(paymentId)
      .get()

    if (!pendingPayment.exists || pendingPayment.data()?.userId !== userId) {
      throw new HttpsError('not-found', 'Pagamento não encontrado')
    }

    // Verificar se já foi processado
    const processedPayment = await admin.firestore()
      .collection('payments')
      .doc(paymentId)
      .get()

    if (processedPayment.exists) {
      return {
        status: 'completed',
        paidAt: processedPayment.data()?.paidAt
      }
    }

    // Verificar se expirou
    const expiresAt = pendingPayment.data()?.expiresAt?.toDate()
    if (expiresAt && expiresAt < new Date()) {
      return {
        status: 'expired'
      }
    }

    return {
      status: 'pending'
    }

  } catch (error: any) {
    console.error('❌ Erro ao verificar status do pagamento:', error)
    throw new HttpsError('internal', 'Erro ao verificar pagamento')
  }
})