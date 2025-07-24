import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import axios from 'axios'
import { checkRateLimit } from './rateLimiter'
import { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger'

// Inicializar admin se ainda não foi
if (!admin.apps.length) {
  admin.initializeApp()
}

// IMPORTANTE: Usar Firebase config em vez de hardcoded
const getRecaptchaSecret = () => {
  // Em produção, usa Firebase config
  const config = functions.config()
  if (config.recaptcha?.secret_key) {
    return config.recaptcha.secret_key
  }
  
  // Em desenvolvimento, usa .runtimeconfig.json
  if (process.env.FUNCTIONS_EMULATOR) {
    return process.env.RECAPTCHA_SECRET_KEY || ''
  }
  
  throw new Error('reCAPTCHA secret key não configurada')
}

export const verifyRecaptcha = functions.https.onCall(async (request) => {
  const token = request?.data?.token
  
  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'Token do ReCAPTCHA é obrigatório')
  }

  // Obter identificador do usuário para rate limiting
  const userId = request?.auth?.uid || 'anonymous'
  
  try {
    // Verificar rate limit
    await checkRateLimit(userId, 'recaptcha_verify', 10, 5) // 10 tentativas em 5 minutos
    
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: getRecaptchaSecret(), // Usar função para obter a secret
          response: token
        }
      }
    )

    const { success } = response.data

    if (!success) {
      throw new functions.https.HttpsError('failed-precondition', 'Falha na verificação do ReCAPTCHA')
    }

    // Log de sucesso usando o novo sistema
    await securityLogger.logEvent(
      SecurityEventType.RECAPTCHA_SUCCESS,
      userId,
      {
        userId,
        authenticated: !!request?.auth,
        timestamp: new Date()
      },
      SecuritySeverity.INFO
    )

    return {
      success: true,
      verified: true
    }
  } catch (error: any) {
    // Se for erro de rate limit, relançar
    if (error.code === 'resource-exhausted') {
      throw error
    }
    
    // Log de falha usando o novo sistema
    await securityLogger.logEvent(
      SecurityEventType.RECAPTCHA_FAILED,
      userId,
      {
        userId,
        error: error.message,
        timestamp: new Date()
      },
      SecuritySeverity.WARNING
    )
    
    console.error('Erro ao verificar ReCAPTCHA:', error)
    throw new functions.https.HttpsError('internal', 'Erro ao verificar ReCAPTCHA')
  }
})