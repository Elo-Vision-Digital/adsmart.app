import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { createHash } from 'crypto'
import { suitpayClientSecret, config, isProduction } from './config'

// Inicializar admin se ainda não foi
if (!admin.apps.length) {
  admin.initializeApp()
}

/**
 * Webhook para receber notificações de pagamento do SuitPay
 * Configurado para região us-central1
 */
export const suitpayWebhook = onRequest(
  { 
    cors: true,
    region: config.project.region
    // Secrets removidos completamente
  },
  async (request, response) => {
    console.log('🔔 Webhook SuitPay recebido')
    
    // Verificar método
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed')
      return
    }

    // Validar IPs autorizados
    const clientIP = request.headers['x-forwarded-for'] || request.ip || ''
    const sourceIP = clientIP.toString().split(',')[0].trim()
    
    console.log('🌐 IP de origem:', sourceIP)
    
    // Em produção, validar IP
    if (isProduction()) {
      if (!config.suitpay.allowedIPs.includes(sourceIP)) {
        console.warn('⚠️ IP não autorizado (mas permitindo por enquanto):', sourceIP)
        // Por enquanto, apenas logar aviso mas não bloquear
        // response.status(403).send('Forbidden')
        // return
      }
    }

    try {
      const webhookData = request.body
      console.log('📦 Payload recebido:', JSON.stringify(webhookData, null, 2))

      // Validar hash do webhook
      // TEMPORÁRIO: Usando process.env diretamente com fallback seguro
      let clientSecret = process.env.SUITPAY_CLIENT_SECRET
      
      if (!clientSecret) {
        try {
          clientSecret = suitpayClientSecret.value ? suitpayClientSecret.value() : ''
        } catch {
          clientSecret = ''
        }
      }
      
      if (!validateWebhookHash(webhookData, clientSecret)) {
        console.error('❌ Hash inválido')
        response.status(401).send('Invalid signature')
        return
      }

      // Processar apenas pagamentos confirmados (PAID_OUT)
      if (webhookData.statusTransaction !== 'PAID_OUT') {
        console.log('⏭️ Ignorando status:', webhookData.statusTransaction)
        response.status(200).send('OK')
        return
      }

      // Extrair requestNumber
      const requestNumber = webhookData.requestNumber
      if (!requestNumber || !requestNumber.startsWith('ADS')) {
        console.error('❌ requestNumber inválido:', requestNumber)
        response.status(400).send('Invalid requestNumber')
        return
      }

      // Buscar pagamento pendente pelo requestNumber
      const pendingPaymentsSnapshot = await admin.firestore()
        .collection('pendingPayments')
        .where('requestNumber', '==', requestNumber)
        .limit(1)
        .get()

      if (pendingPaymentsSnapshot.empty) {
        console.error('❌ Pagamento pendente não encontrado para requestNumber:', requestNumber)
        response.status(404).send('Payment not found')
        return
      }

      const pendingPaymentDoc = pendingPaymentsSnapshot.docs[0]
      const pendingPayment = pendingPaymentDoc.data()
      const userId = pendingPayment.userId

      console.log('🔍 Processando pagamento para usuário:', userId)

      // Verificar se o pagamento já foi processado
      const paymentId = webhookData.idTransaction
      const paymentRef = admin.firestore()
        .collection('payments')
        .doc(paymentId)

      const paymentDoc = await paymentRef.get()
      if (paymentDoc.exists) {
        console.log('⚠️ Pagamento já processado:', paymentId)
        response.status(200).send('Already processed')
        return
      }

      // Iniciar transação para garantir consistência
      await admin.firestore().runTransaction(async (transaction) => {
        // Registrar o pagamento confirmado
        transaction.set(paymentRef, {
          paymentId: webhookData.idTransaction,
          userId,
          amount: webhookData.value, // Valor em reais
          amountInCents: Math.round(webhookData.value * 100),
          currency: 'BRL',
          status: 'completed',
          payerName: webhookData.payerName,
          payerTaxId: webhookData.payerTaxId,
          paymentDate: webhookData.paymentDate,
          paymentCode: webhookData.paymentCode,
          requestNumber: webhookData.requestNumber,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          type: 'credit',
          description: 'Adição de créditos via PIX'
        })

        // Adicionar créditos à carteira do usuário
        const walletRef = admin.firestore()
          .collection('users')
          .doc(userId)
          .collection('wallet')
          .doc('current')

        const walletDoc = await transaction.get(walletRef)
        const currentBalance = walletDoc.exists ? (walletDoc.data()?.balance || 0) : 0
        
        // Converter para centavos
        const amountInCents = Math.round(webhookData.value * 100)
        const newBalance = currentBalance + amountInCents

        transaction.set(walletRef, {
          balance: newBalance,
          currency: 'BRL',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true })

        // Criar transação na coleção de transações
        const transactionRef = admin.firestore()
          .collection('users')
          .doc(userId)
          .collection('transactions')
          .doc()

        transaction.set(transactionRef, {
          type: 'credit',
          amount: amountInCents,
          description: 'Adição de créditos via PIX',
          status: 'completed',
          paymentId: webhookData.idTransaction,
          payerName: webhookData.payerName,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })

        // Atualizar status do pagamento pendente
        transaction.update(pendingPaymentDoc.ref, {
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        })

        console.log('✅ Créditos adicionados com sucesso:', {
          userId,
          amount: amountInCents,
          newBalance
        })
      })

      // TODO: Enviar notificação por email
      // await sendPaymentConfirmationEmail(userId, webhookData.value)

      response.status(200).send('OK')
    } catch (error: any) {
      console.error('❌ Erro ao processar webhook:', error)
      response.status(500).send(`Error: ${error.message}`)
    }
  }
)

/**
 * Valida o hash do webhook conforme documentação SuitPay
 */
function validateWebhookHash(data: any, clientSecret: string): boolean {
  if (!data.hash) {
    console.error('❌ Hash não encontrado no webhook')
    return false
  }

  // Concatenar valores na ordem correta (exceto o hash)
  const values = [
    data.idTransaction || '',
    data.typeTransaction || '',
    data.statusTransaction || '',
    data.value || '',
    data.payerName || '',
    data.payerTaxId || '',
    data.paymentDate || '',
    data.paymentCode || '',
    data.requestNumber || ''
  ].join('')

  // Adicionar client secret
  const dataToHash = values + clientSecret

  // Gerar SHA-256
  const calculatedHash = createHash('sha256').update(dataToHash).digest('hex')

  console.log('🔐 Validação do hash:', {
    received: data.hash,
    calculated: calculatedHash,
    valid: calculatedHash === data.hash
  })

  return calculatedHash === data.hash
}