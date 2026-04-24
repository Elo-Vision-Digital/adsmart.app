import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import axios from 'axios'
import { checkRateLimit } from './rateLimiter'
import {
  securityLogger,
  SecurityEventType,
  SecuritySeverity,
} from './securityLogger'

if (!admin.apps.length) {
  admin.initializeApp()
}

const recaptchaSecret = defineSecret('RECAPTCHA_SECRET_KEY')

export const verifyRecaptcha = onCall(
  { secrets: [recaptchaSecret] },
  async (request) => {
    const token = request?.data?.token

    if (!token) {
      throw new HttpsError('invalid-argument', 'Token do ReCAPTCHA é obrigatório')
    }

    const userId = request?.auth?.uid || 'anonymous'

    try {
      // Verificar rate limit
      await checkRateLimit(userId, 'recaptcha_verify', 10, 5) // 10 tentativas em 5 minutos

      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: recaptchaSecret.value(),
            response: token
          }
        }
      )

      const { success } = response.data

      if (!success) {
        throw new HttpsError('failed-precondition', 'Falha na verificação do ReCAPTCHA')
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
      throw new HttpsError('internal', 'Erro ao verificar ReCAPTCHA')
    }
  }
)
