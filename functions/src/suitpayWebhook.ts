import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

// Inicializar admin se ainda não foi
if (!admin.apps.length) {
  admin.initializeApp()
}

// Interface para o webhook do SuitPay
interface SuitPayWebhookPayload {
  id: string
  type: 'payment.confirmed' | 'payment.failed' | 'payment.expired'
  amount: number
  currency: string
  status: 'paid' | 'failed' | 'expired'
  reference_id: string
  customer: {
    name: string
    email: string
    document: string
  }
  pix?: {
    qr_code: string
    qr_code_text: string
    expires_at: string
  }
  paid_at?: string
  created_at: string
}


/**
 * Webhook para receber notificações de pagamento do SuitPay
 */
export const suitpayWebhook = onRequest(async (request, response) => {
  console.log('🔔 Webhook SuitPay recebido')
  
  // Verificar método
  if (request.method !== 'POST') {
    response.status(405).send('Method Not Allowed')
    return
  }

  try {
    // Log para debug
    console.log('🔔 Headers recebidos:', request.headers)
    console.log('🌐 IP de origem:', request.ip)
    
    // Por enquanto, vamos prosseguir sem validação de assinatura
    // A SuitPay pode validar por IP ou outro método
    
    const payload: SuitPayWebhookPayload = request.body
    console.log('📦 Payload recebido:', JSON.stringify(payload, null, 2))

    // Processar apenas pagamentos confirmados
    if (payload.type !== 'payment.confirmed' || payload.status !== 'paid') {
      console.log('⏭️ Ignorando evento:', payload.type, payload.status)
      response.status(200).send('OK')
      return
    }

    // Buscar o usuário pelo reference_id (que deve ser o userId)
    const userId = payload.reference_id
    if (!userId) {
      console.error('❌ reference_id não encontrado no payload')
      response.status(400).send('Missing reference_id')
      return
    }

    console.log('🔍 Processando pagamento para usuário:', userId)

    // Verificar se o pagamento já foi processado
    const paymentRef = admin.firestore()
      .collection('payments')
      .doc(payload.id)

    const paymentDoc = await paymentRef.get()
    if (paymentDoc.exists) {
      console.log('⚠️ Pagamento já processado:', payload.id)
      response.status(200).send('Already processed')
      return
    }

    // Iniciar transação para garantir consistência
    await admin.firestore().runTransaction(async (transaction) => {
      // Registrar o pagamento
      transaction.set(paymentRef, {
        paymentId: payload.id,
        userId,
        amount: payload.amount,
        currency: payload.currency,
        status: payload.status,
        customer: payload.customer,
        paidAt: payload.paid_at ? new Date(payload.paid_at) : admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date(payload.created_at),
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        type: 'credit',
        description: `Adição de créditos via PIX`
      })

      // Adicionar créditos à carteira do usuário
      const walletRef = admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('wallet')
        .doc('current')

      const walletDoc = await transaction.get(walletRef)
      const currentBalance = walletDoc.exists ? (walletDoc.data()?.balance || 0) : 0
      
      // SuitPay envia o valor em reais, precisamos converter para centavos
      const amountInCents = Math.round(payload.amount * 100)
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
        description: `Adição de créditos via PIX`,
        status: 'completed',
        paymentId: payload.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })

      console.log('✅ Créditos adicionados com sucesso:', {
        userId,
        amount: amountInCents,
        newBalance
      })
    })

    // Enviar notificação para o usuário (opcional)
    // TODO: Implementar notificação por email ou push

    response.status(200).send('OK')
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error)
    response.status(500).send(`Error: ${error.message}`)
  }
})
