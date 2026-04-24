/**
 * @deprecated SuitPay integration is being phased out in favor of Asaas.
 * This file will be removed in a future phase. No new features should be
 * added here; existing behaviour is maintained only until Asaas migration
 * completes.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import axios from 'axios'
import { 
  suitpayClientId, 
  suitpayClientSecret, 
  config, 
  getWebhookUrl 
} from './config'

// TEMPORÁRIO: Helper para acessar secrets com fallback
const getSecretValue = (secret: any): string => {
  try {
    return secret.value ? secret.value() : ''
  } catch {
    return ''
  }
}

// Inicializar admin se ainda não foi
if (!admin.apps.length) {
  admin.initializeApp()
}

/**
 * Cria um pagamento PIX via SuitPay
 * Configurado para a região correta
 */
export const createPixPayment = onCall(
  { 
    cors: true,
    region: config.project.region
    // Secrets removidos completamente
  }, 
  async (request) => {
    console.log('🚀 createPixPayment - Início')
    console.log('🌍 Região:', config.project.region)
    
    // Verificar autenticação
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuário não autenticado')
    }

    const { amount, userCpf } = request.data
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
      // Buscar dados do usuário
      const userDocRef = admin.firestore().collection('users').doc(userId)
      const userDoc = await userDocRef.get()
      
      let userData = userDoc.data() || {}
      const userName = userData.displayName || request.auth.token.name || 'Cliente AdSmart'
      
      // Usar CPF fornecido ou do perfil do usuário
      let cpf = userCpf || userData.cpf
      
      // Validar CPF
      if (!cpf) {
        throw new HttpsError('invalid-argument', 'CPF é obrigatório para pagamento PIX')
      }
      
      // Remover caracteres não numéricos do CPF
      cpf = cpf.replace(/\D/g, '')
      
      // Validar formato do CPF (11 dígitos)
      if (cpf.length !== 11) {
        throw new HttpsError('invalid-argument', 'CPF inválido')
      }

      // Se o usuário forneceu um CPF, salvar ou atualizar
      if (userCpf) {
        await userDocRef.set({ 
          cpf: cpf,
          email: userEmail,
          displayName: userName,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
        
        console.log('✅ CPF salvo/atualizado no perfil do usuário')
      }

      // Gerar número do pedido único no formato esperado pelo webhook
      // Formato: ADS + timestamp em base36 (mais curto)
      const timestamp = Date.now().toString(36).toUpperCase()
      const random = Math.random().toString(36).substring(2, 5).toUpperCase()
      const requestNumber = `ADS${timestamp}${random}`
      
      // Data de vencimento (24 horas)
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 1)
      const dueDateString = dueDate.toISOString().split('T')[0] // YYYY-MM-DD

      // Headers conforme documentação
      // TEMPORÁRIO: Usando process.env diretamente
      const clientId = process.env.SUITPAY_CLIENT_ID || getSecretValue(suitpayClientId)
      const clientSecret = process.env.SUITPAY_CLIENT_SECRET || getSecretValue(suitpayClientSecret)
      
      if (!clientId || !clientSecret) {
        console.error('❌ Credenciais SuitPay não encontradas')
        throw new HttpsError('internal', 'Credenciais de pagamento não configuradas')
      }
      
      const headers = {
        'ci': clientId.trim(),
        'cs': clientSecret.trim(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }

      // Payload conforme documentação SuitPay
      const payload = {
        requestNumber: requestNumber,
        dueDate: dueDateString,
        amount: amount, // Em reais
        shippingAmount: 0,
        discountAmount: 0,
        usernameCheckout: userId,
        callbackUrl: getWebhookUrl(config.suitpay.webhookPath),
        client: {
          name: userName,
          document: cpf,
          phoneNumber: userData.phone || '',
          email: userEmail,
          address: {
            codIbge: '5208707', // Código IBGE de Goiânia - OBRIGATÓRIO
            street: userData.address?.street || 'Rua Digital',
            number: userData.address?.number || '150',
            complement: userData.address?.complement || '',
            zipCode: userData.address?.zipCode || '74663-520',
            neighborhood: userData.address?.neighborhood || 'Setor Bueno',
            city: userData.address?.city || 'Goiânia',
            state: userData.address?.state || 'GO'
          }
        },
        products: [
          {
            description: 'Créditos AdSmart',
            quantity: 1,
            value: amount
          }
        ]
      }

      console.log('📤 Enviando para SuitPay:', {
        url: `${config.suitpay.apiUrl}/gateway/request-qrcode`,
        requestNumber,
        amount,
        cpf: cpf.substring(0, 3) + '***'
      })

      // Fazer requisição para SuitPay
      const response = await axios.post(
        `${config.suitpay.apiUrl}/gateway/request-qrcode`,
        payload,
        { 
          headers,
          timeout: 30000,
          validateStatus: (status) => status < 500
        }
      )

      console.log('📥 Resposta SuitPay:', {
        status: response.status,
        statusText: response.statusText,
        data: response.status === 200 ? 'Success' : response.data
      })

      // Se não for sucesso, logar detalhes
      if (response.status !== 200 && response.status !== 201) {
        console.error('❌ Resposta de erro da SuitPay:', {
          status: response.status,
          data: response.data,
          headers: response.headers
        })
        
        throw new HttpsError(
          'failed-precondition',
          `SuitPay retornou erro ${response.status}: ${JSON.stringify(response.data)}`
        )
      }

      const responseData = response.data

      // Validar resposta
      if (!responseData.idTransaction || !responseData.paymentCode) {
        console.error('❌ Resposta inválida:', responseData)
        throw new Error('Resposta inválida da SuitPay')
      }

      // Salvar informações do pagamento pendente com requestNumber
      await admin.firestore()
        .collection('pendingPayments')
        .doc(responseData.idTransaction)
        .set({
          paymentId: responseData.idTransaction,
          userId,
          amount: amount,
          amountInCents: Math.round(amount * 100),
          status: 'pending',
          pixCode: responseData.paymentCode,
          qrCode: responseData.paymentCodeBase64,
          requestNumber: requestNumber, // Importante para o webhook
          cpf: cpf,
          expiresAt: admin.firestore.Timestamp.fromDate(new Date(dueDate)),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })

      // NOVO: Criar transação pendente para aparecer imediatamente
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .doc(responseData.idTransaction) // Usar mesmo ID para atualizar depois
        .set({
          type: 'credit',
          amount: Math.round(amount * 100), // Em centavos
          description: 'Adição de créditos via PIX',
          status: 'pending',
          paymentId: responseData.idTransaction,
          payerName: userName,
          payerCpf: cpf.substring(0, 3) + '***', // Ofuscar CPF
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })

      console.log('✅ Pagamento PIX criado com sucesso')
      console.log('✅ Transação pendente criada')

      // Retornar dados do PIX para o frontend
      return {
        success: true,
        paymentId: responseData.idTransaction,
        qrCode: responseData.paymentCodeBase64 || '',
        qrCodeText: responseData.paymentCode,
        amount: amount,
        expiresAt: dueDate.toISOString()
      }

    } catch (error: any) {
      console.error('❌ Erro detalhado:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      })
      
      // Se já for um HttpsError, repassar
      if (error instanceof HttpsError) {
        throw error
      }
      
      // Tratar erros específicos da SuitPay
      if (error.response?.status === 401) {
        throw new HttpsError('unauthenticated', 'Credenciais SuitPay inválidas. Verifique as configurações.')
      }
      
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.response || error.response.data?.message || 'Dados inválidos'
        throw new HttpsError('invalid-argument', `SuitPay: ${errorMessage}`)
      }

      if (error.response?.status === 403) {
        throw new HttpsError('permission-denied', 'Acesso negado pela SuitPay. Verifique se a conta está ativa e as credenciais estão corretas.')
      }

      if (error.response?.status === 404) {
        throw new HttpsError('not-found', 'Endpoint SuitPay não encontrado. Verifique a URL.')
      }

      if (error.response?.status === 500) {
        throw new HttpsError('internal', 'Erro no servidor SuitPay. Tente novamente.')
      }
      
      // Erro genérico
      throw new HttpsError('internal', error.message || 'Erro ao processar pagamento')
    }
  }
)

/**
 * Verifica o status de um pagamento
 */
export const checkPaymentStatus = onCall(
  { 
    cors: true,
    region: config.project.region
  }, 
  async (request) => {
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
  }
)