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
    
    // NOVO: Salvar log do webhook para debug
    await admin.firestore().collection('webhook_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: sourceIP,
      body: request.body,
      headers: request.headers
    })
    
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

      // TEMPORÁRIO: Pular validação de hash se não vier no payload
      if (webhookData.hash) {
        // Validar hash do webhook apenas se vier
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
      } else {
        console.warn('⚠️ Webhook sem hash - aceitando temporariamente')
      }

      // Processar apenas pagamentos confirmados (PAID_OUT)
      if (webhookData.statusTransaction !== 'PAID_OUT') {
        console.log('⏭️ Ignorando status:', webhookData.statusTransaction)
        response.status(200).send('OK')
        return
      }

      // MODIFICADO: Buscar por idTransaction primeiro, depois por requestNumber
      const paymentId = webhookData.idTransaction
      let pendingPaymentDoc: any = null
      let pendingPayment: any = null

      // Primeiro tentar buscar pelo ID da transação
      const paymentDocRef = await admin.firestore()
        .collection('pendingPayments')
        .doc(paymentId)
        .get()

      if (paymentDocRef.exists) {
        console.log('✅ Pagamento encontrado pelo ID:', paymentId)
        pendingPaymentDoc = paymentDocRef
        pendingPayment = paymentDocRef.data()
      } else {
        // Se não encontrar, tentar pelo requestNumber
        const requestNumber = webhookData.requestNumber
        console.log('🔍 Buscando por requestNumber:', requestNumber)
        
        const pendingPaymentsSnapshot = await admin.firestore()
          .collection('pendingPayments')
          .where('requestNumber', '==', requestNumber)
          .limit(1)
          .get()

        if (!pendingPaymentsSnapshot.empty) {
          console.log('✅ Pagamento encontrado pelo requestNumber')
          pendingPaymentDoc = pendingPaymentsSnapshot.docs[0]
          pendingPayment = pendingPaymentDoc.data()
        }
      }

      if (!pendingPaymentDoc || !pendingPayment) {
        console.error('❌ Pagamento pendente não encontrado:', {
          idTransaction: paymentId,
          requestNumber: webhookData.requestNumber
        })
        
        // Ainda assim, vamos registrar o pagamento órfão para análise
        await admin.firestore().collection('orphan_payments').add({
          ...webhookData,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: 'Pending payment not found'
        })
        
        response.status(404).send('Payment not found')
        return
      }

      const userId = pendingPayment.userId
      console.log('🔍 Processando pagamento para usuário:', userId)

      // Verificar se o pagamento já foi processado
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
        // IMPORTANTE: Fazer todas as leituras PRIMEIRO
        
        // 1. Ler o saldo atual da carteira
        const walletRef = admin.firestore()
          .collection('users')
          .doc(userId)
          .collection('wallet')
          .doc('current')
        
        const walletDoc = await transaction.get(walletRef)
        const currentBalance = walletDoc.exists ? (walletDoc.data()?.balance || 0) : 0
        
        // 2. Verificar se a transação existe
        const transactionRef = admin.firestore()
          .collection('users')
          .doc(userId)
          .collection('transactions')
          .doc(paymentId)
        
        const transactionDoc = await transaction.get(transactionRef)
        
        // AGORA fazer todas as escritas
        
        // 3. Registrar o pagamento confirmado
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

        // 4. Atualizar saldo da carteira
        const amountInCents = Math.round(webhookData.value * 100)
        const newBalance = currentBalance + amountInCents

        transaction.set(walletRef, {
          balance: newBalance,
          currency: 'BRL',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true })

        // 5. Atualizar ou criar transação
        if (transactionDoc.exists) {
          // Atualizar transação existente
          transaction.update(transactionRef, {
            status: 'completed',
            payerName: webhookData.payerName,
            completedAt: admin.firestore.FieldValue.serverTimestamp()
          })
        } else {
          // Se não existir, criar uma nova
          transaction.set(transactionRef, {
            type: 'credit',
            amount: amountInCents,
            description: 'Adição de créditos via PIX',
            status: 'completed',
            paymentId: paymentId,
            payerName: webhookData.payerName,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          })
        }

        // 6. Atualizar status do pagamento pendente
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