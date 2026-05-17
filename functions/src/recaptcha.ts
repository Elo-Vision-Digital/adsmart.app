import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import axios from 'axios'
import { recaptchaSecretKey } from './config'
import { checkRateLimit } from './rateLimiter'
import {
  securityLogger,
  SecurityEventType,
  SecuritySeverity,
} from './securityLogger'

if (!admin.apps.length) {
  admin.initializeApp()
}

export const verifyRecaptcha = onCall(
  { secrets: [recaptchaSecretKey] },
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
            secret: recaptchaSecretKey.value(),
            response: token
          }
        }
      )

      const { success } = response.data ?? {}

      if (!success) {
        // [INSTRUMENTATION 2026-05-02] Capture Google's diagnostic codes before
        // collapsing into a generic HttpsError. Mirrors the dashboard's
        // `[label:fail:context]` pattern (commit fb2595e). Without this the
        // client-facing 500 INTERNAL is opaque and the Cloud Logging entry only
        // carries `code: 'failed-precondition', details: undefined`.
        const errorCodes: unknown = response.data?.['error-codes']
        console.error('[recaptcha:fail:siteverify]', {
          success,
          errorCodes: errorCodes ?? '(none)',
          hostname: response.data?.hostname ?? '(none)',
          challengeTs: response.data?.challenge_ts ?? '(none)',
          score: response.data?.score ?? '(none)',
        })
        throw new HttpsError(
          'failed-precondition',
          'Falha na verificação do ReCAPTCHA',
          { errorCodes: errorCodes ?? ['unknown'] },
        )
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
      if (error?.code === 'resource-exhausted') {
        throw error
      }

      // Distinguish siteverify rejection (already labelled above) from unknown
      // failure modes (axios timeout, Firestore rateLimits write, etc).
      const isSiteverifyFailure =
        error instanceof HttpsError && error.code === 'failed-precondition'
      if (!isSiteverifyFailure) {
        console.error('[recaptcha:fail:unknown]', {
          code: error?.code,
          message: error?.message,
          details: error?.details ?? '(empty)',
          isAxiosError: error?.isAxiosError === true,
          httpStatus: error?.response?.status,
          httpData: error?.response?.data,
          stackHead:
            typeof error?.stack === 'string'
              ? error.stack.split('\n').slice(0, 5).join(' | ')
              : '(no stack)',
        })
      }

      // Audit trail: every non-rate-limit failure remains a RECAPTCHA_FAILED event.
      await securityLogger.logEvent(
        SecurityEventType.RECAPTCHA_FAILED,
        userId,
        {
          userId,
          error: error?.message,
          timestamp: new Date()
        },
        SecuritySeverity.WARNING
      )

      // Preserve the labelled HttpsError so the siteverify class is distinct in
      // Cloud Logging from unknown internal errors.
      if (isSiteverifyFailure) {
        throw error
      }
      throw new HttpsError('internal', 'Erro ao verificar ReCAPTCHA')
    }
  }
)
