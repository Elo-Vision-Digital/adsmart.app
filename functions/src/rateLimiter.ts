import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger'

// Inicializar admin se ainda não foi
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

interface RateLimitData {
  attempts: number
  firstAttempt: admin.firestore.Timestamp
  lastAttempt: admin.firestore.Timestamp
  blocked: boolean
}

export async function checkRateLimit(
  userId: string, 
  action: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<boolean> {
  const docRef = db.collection('rateLimits').doc(`${userId}_${action}`)
  const doc = await docRef.get()
  
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)
  
  if (!doc.exists) {
    await docRef.set({
      attempts: 1,
      firstAttempt: admin.firestore.Timestamp.fromDate(now),
      lastAttempt: admin.firestore.Timestamp.fromDate(now),
      blocked: false
    })
    return true
  }
  
  const data = doc.data() as RateLimitData
  
  if (data.blocked && data.lastAttempt.toDate() > windowStart) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Muitas tentativas. Tente novamente em alguns minutos.'
    )
  }
  
  if (data.firstAttempt.toDate() < windowStart) {
    // Reset window
    await docRef.set({
      attempts: 1,
      firstAttempt: admin.firestore.Timestamp.fromDate(now),
      lastAttempt: admin.firestore.Timestamp.fromDate(now),
      blocked: false
    })
    return true
  }
  
  if (data.attempts >= maxAttempts) {
    await docRef.update({
      blocked: true,
      lastAttempt: admin.firestore.Timestamp.fromDate(now)
    })
    
    // Registrar evento de segurança quando rate limit é excedido
    await securityLogger.logEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      userId,
      {
        userId,
        action,
        attempts: data.attempts,
        maxAttempts,
        windowMinutes,
        blockedAt: now
      },
      SecuritySeverity.WARNING
    )
    
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Muitas tentativas. Tente novamente em alguns minutos.'
    )
  }
  
  await docRef.update({
    attempts: data.attempts + 1,
    lastAttempt: admin.firestore.Timestamp.fromDate(now)
  })
  
  return true
}