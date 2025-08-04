import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger'

// Inicializar admin se ainda não foi
if (!admin.apps.length) {
  admin.initializeApp()
}

// ✅ Lista de emails de administradores (mesma do priceManager)
const ADMIN_EMAILS = [
  'agency.elovisiondigital@gmail.com', // ✅ Seu Gmail atual (Firebase)
  'admin@adsmart.app', // ✅ Email corporativo futuro
]

// 🔒 CONFIGURAÇÕES DE SEGURANÇA
const SECURITY_CONFIG = {
  MAX_AMOUNT_PER_TRANSACTION: 100000, // R$ 1.000,00 em centavos
  MAX_DAILY_AMOUNT_PER_ADMIN: 500000, // R$ 5.000,00 em centavos
  MAX_TRANSACTIONS_PER_DAY: 50,
  REQUIRE_REASON: true,
  MIN_REASON_LENGTH: 10
}

// Interface para transação
interface Transaction {
  type: 'credit' | 'debit'
  amount: number // em centavos
  description: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: admin.firestore.Timestamp
  adminAction?: boolean
  adminEmail?: string
  adminReason?: string
  adminIP?: string
}

// Interface para wallet
interface Wallet {
  balance: number // em centavos
  currency: 'BRL'
  updatedAt: admin.firestore.Timestamp
}

// Interface para tracking diário
interface DailyAdminActivity {
  date: string
  adminEmail: string
  totalAmount: number
  transactionCount: number
  transactions: Array<{
    targetEmail: string
    amount: number
    timestamp: admin.firestore.Timestamp
  }>
}

/**
 * Verificar limites diários do admin
 */
async function checkAdminDailyLimits(adminEmail: string): Promise<{ 
  canProceed: boolean, 
  totalToday: number, 
  countToday: number 
}> {
  const today = new Date().toISOString().split('T')[0]
  const docRef = admin.firestore()
    .collection('adminActivity')
    .doc(`${adminEmail}_${today}`)
  
  const doc = await docRef.get()
  
  if (!doc.exists) {
    return { canProceed: true, totalToday: 0, countToday: 0 }
  }
  
  const data = doc.data() as DailyAdminActivity
  const canProceed = 
    data.totalAmount < SECURITY_CONFIG.MAX_DAILY_AMOUNT_PER_ADMIN &&
    data.transactionCount < SECURITY_CONFIG.MAX_TRANSACTIONS_PER_DAY
  
  return {
    canProceed,
    totalToday: data.totalAmount,
    countToday: data.transactionCount
  }
}

/**
 * Registrar atividade do admin
 */
async function recordAdminActivity(
  adminEmail: string, 
  targetEmail: string, 
  amount: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const docRef = admin.firestore()
    .collection('adminActivity')
    .doc(`${adminEmail}_${today}`)
  
  await admin.firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef)
    
    if (!doc.exists) {
      // Criar novo registro diário
      const newActivity: DailyAdminActivity = {
        date: today,
        adminEmail,
        totalAmount: amount,
        transactionCount: 1,
        transactions: [{
          targetEmail,
          amount,
          timestamp: admin.firestore.Timestamp.now()
        }]
      }
      transaction.set(docRef, newActivity)
    } else {
      // Atualizar registro existente
      const data = doc.data() as DailyAdminActivity
      transaction.update(docRef, {
        totalAmount: data.totalAmount + amount,
        transactionCount: data.transactionCount + 1,
        transactions: [...data.transactions, {
          targetEmail,
          amount,
          timestamp: admin.firestore.Timestamp.now()
        }]
      })
    }
  })
}

/**
 * Função para administradores adicionarem créditos a qualquer usuário
 */
export const addUserCredits = functions.https.onCall(async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    )
  }

  // Verificar se é admin
  const adminEmail = request.auth.token.email || ''
  const isAdmin = request.auth.token.admin || ADMIN_EMAILS.includes(adminEmail)
  
  if (!isAdmin) {
    // Registrar tentativa não autorizada
    await securityLogger.logEvent(
      SecurityEventType.UNAUTHORIZED_ACCESS,
      request.auth.uid,
      {
        action: 'add_user_credits',
        email: adminEmail,
        ip: request.rawRequest.ip
      },
      SecuritySeverity.WARNING,
      request.rawRequest
    )

    throw new functions.https.HttpsError(
      'permission-denied',
      'Apenas administradores podem adicionar créditos'
    )
  }

  // Validar dados de entrada
  const { targetEmail, amount, reason } = request.data

  if (!targetEmail || typeof targetEmail !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email do usuário é obrigatório'
    )
  }

  if (typeof amount !== 'number' || amount <= 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Valor deve ser um número positivo em centavos'
    )
  }

  // 🔒 Verificar limite por transação
  if (amount > SECURITY_CONFIG.MAX_AMOUNT_PER_TRANSACTION) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Valor máximo por transação: ${SECURITY_CONFIG.MAX_AMOUNT_PER_TRANSACTION / 100} reais`
    )
  }

  // 🔒 Verificar razão obrigatória
  if (SECURITY_CONFIG.REQUIRE_REASON) {
    if (!reason || typeof reason !== 'string' || reason.length < SECURITY_CONFIG.MIN_REASON_LENGTH) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Motivo é obrigatório (mínimo ${SECURITY_CONFIG.MIN_REASON_LENGTH} caracteres)`
      )
    }
  }

  try {
    // 🔒 Verificar limites diários
    const limits = await checkAdminDailyLimits(adminEmail)
    
    if (!limits.canProceed) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Limite diário excedido. Total hoje: R$ ${limits.totalToday / 100}, Transações: ${limits.countToday}`
      )
    }

    // Verificar se nova transação excederia limite diário
    if (limits.totalToday + amount > SECURITY_CONFIG.MAX_DAILY_AMOUNT_PER_ADMIN) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Esta transação excederia o limite diário de R$ ${SECURITY_CONFIG.MAX_DAILY_AMOUNT_PER_ADMIN / 100}`
      )
    }

    // Buscar usuário pelo email
    const usersSnapshot = await admin.auth().getUserByEmail(targetEmail)
    
    if (!usersSnapshot) {
      throw new functions.https.HttpsError(
        'not-found',
        'Usuário não encontrado'
      )
    }

    const targetUserId = usersSnapshot.uid
    const timestamp = admin.firestore.Timestamp.now()

    // Referências do Firestore
    const walletRef = admin.firestore()
      .collection('users')
      .doc(targetUserId)
      .collection('wallet')
      .doc('current')

    const transactionsRef = admin.firestore()
      .collection('users')
      .doc(targetUserId)
      .collection('transactions')

    // Executar transação para garantir consistência
    await admin.firestore().runTransaction(async (transaction) => {
      // Obter saldo atual
      const walletDoc = await transaction.get(walletRef)
      let currentBalance = 0

      if (walletDoc.exists) {
        const walletData = walletDoc.data() as Wallet
        currentBalance = walletData.balance || 0
      }

      // Calcular novo saldo
      const newBalance = currentBalance + amount

      // Criar nova transação de crédito
      const newTransaction: Transaction = {
        type: 'credit',
        amount: amount,
        description: `Créditos adicionados pelo administrador ${adminEmail}. Motivo: ${reason}`,
        status: 'completed',
        createdAt: timestamp,
        adminAction: true,
        adminEmail: adminEmail,
        adminReason: reason,
        adminIP: request.rawRequest.ip
      }

      // Atualizar wallet
      const updatedWallet: Wallet = {
        balance: newBalance,
        currency: 'BRL',
        updatedAt: timestamp
      }

      // Executar operações
      transaction.set(walletRef, updatedWallet, { merge: true })
      transaction.set(transactionsRef.doc(), newTransaction)
    })

    // 🔒 Registrar atividade do admin
    await recordAdminActivity(adminEmail, targetEmail, amount)

    // Registrar ação do admin no log de segurança
    await securityLogger.logEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY, // Usando como log de admin action
      request.auth.uid,
      {
        action: 'credits_added_by_admin',
        targetUserId: targetUserId,
        targetEmail: targetEmail,
        amountInCents: amount,
        amountInReais: amount / 100,
        adminEmail: adminEmail,
        reason: reason,
        dailyTotal: limits.totalToday + amount,
        dailyCount: limits.countToday + 1
      },
      SecuritySeverity.INFO,
      request.rawRequest
    )

    return {
      success: true,
      message: `Créditos adicionados com sucesso para ${targetEmail}`,
      amountAdded: amount,
      targetUserId: targetUserId,
      timestamp: timestamp.toDate().toISOString(),
      adminLimits: {
        dailyTotalAfter: (limits.totalToday + amount) / 100,
        dailyCountAfter: limits.countToday + 1,
        maxDailyAmount: SECURITY_CONFIG.MAX_DAILY_AMOUNT_PER_ADMIN / 100,
        maxDailyTransactions: SECURITY_CONFIG.MAX_TRANSACTIONS_PER_DAY
      }
    }

  } catch (error: any) {
    console.error('Erro ao adicionar créditos:', error)
    
    // Registrar erro no log de segurança
    await securityLogger.logEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      request.auth.uid,
      {
        action: 'credits_add_failed',
        targetEmail: targetEmail,
        amount: amount,
        adminEmail: adminEmail,
        error: error.message
      },
      SecuritySeverity.ERROR,
      request.rawRequest
    )
    
    // Se for erro conhecido, repassar
    if (error instanceof functions.https.HttpsError) {
      throw error
    }

    // Erro genérico
    throw new functions.https.HttpsError(
      'internal',
      `Erro ao adicionar créditos: ${error.message}`
    )
  }
})