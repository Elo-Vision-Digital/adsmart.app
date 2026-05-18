import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

// Inicializar admin se ainda não foi
if (!admin.apps.length) {
  admin.initializeApp()
}

// Tipos de eventos de segurança
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  // @deprecated 2026-05-17 — reCAPTCHA was removed (see docs/Decisions.md
  // ADR-013). The admin SecurityLogsPage that consumed these enum values
  // was also removed (2026-05-17, see ADR-014). Values kept so historical
  // securityLogs/{id} entries can still be queried directly in Cloud
  // Logging or via Admin SDK for audit, without forcing a fallback path
  // for unknown event types. No producer remains in the codebase.
  RECAPTCHA_SUCCESS = 'recaptcha_success',
  RECAPTCHA_FAILED = 'recaptcha_failed',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  ACCOUNT_LOCKED = 'account_locked',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  BACKUP_STARTED = 'backup_started',
  BACKUP_COMPLETED = 'backup_completed',
  BACKUP_FAILED = 'backup_failed',
  BACKUP_CLEANUP = 'backup_cleanup',
  BACKUP_RESTORED = 'backup_restored',
  USER_DELETION = 'user_deletion'
}

// Níveis de severidade
export enum SecuritySeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Interface para eventos de segurança
export interface SecurityEvent {
  eventType: SecurityEventType
  severity: SecuritySeverity
  userId?: string
  identifier: string
  details: Record<string, any>
  metadata: {
    timestamp: admin.firestore.Timestamp
    ip?: string
    userAgent?: string
    location?: string
    requestId?: string
  }
}

// Classe principal do logger
export class SecurityLogger {
  private db: admin.firestore.Firestore | null = null
  private readonly SUSPICIOUS_PATTERNS = {
    rapidFailedLogins: { threshold: 5, windowMinutes: 5 },
    multipleIPs: { threshold: 3, windowMinutes: 30 },
    unusualHours: { start: 2, end: 5 }, // 2AM - 5AM
  }

  constructor() {
    // Inicialização lazy do db
  }

  // Getter para o db com inicialização lazy
  private getDb(): admin.firestore.Firestore {
    if (!this.db) {
      this.db = admin.firestore()
    }
    return this.db
  }

  // Método principal para registrar eventos
  async logEvent(
    eventType: SecurityEventType,
    identifier: string,
    details: Record<string, any>,
    severity: SecuritySeverity = SecuritySeverity.INFO,
    requestContext?: functions.https.Request
  ): Promise<void> {
    try {
      const timestamp = admin.firestore?.Timestamp?.now?.() || {
        _seconds: Math.floor(Date.now() / 1000),
        _nanoseconds: 0,
      }

      // Strip undefined values locally so Firestore doesn't reject the write
      // (instead of flipping the process-wide ignoreUndefinedProperties flag,
      // which would relax strict validation for every Cloud Function).
      const rawMetadata: Record<string, unknown> = {
        timestamp: timestamp as admin.firestore.Timestamp,
        ip: requestContext?.ip || details.ip,
        userAgent: requestContext?.headers['user-agent'] || details.userAgent,
        location: details.location,
        requestId: details.requestId,
      }
      const metadata = Object.fromEntries(
        Object.entries(rawMetadata).filter(([, v]) => v !== undefined)
      ) as SecurityEvent['metadata']

      const event: SecurityEvent = {
        eventType,
        severity,
        identifier,
        details,
        metadata,
        // Only attach userId when we actually have one — avoids writing
        // `undefined` fields to Firestore (which is rejected by default).
        ...(details.userId !== undefined ? { userId: details.userId } : {}),
      }

      try {
        await this.getDb().collection('securityLogs').add(event)
      } catch (firestoreError) {
        console.log('Firestore não disponível, evento não salvo:', event)
      }

      // GUARD: suspicious-pattern detection must not re-enter on events
      // that *are already* the result of the detector (otherwise
      // unusual-hour logs trigger more unusual-hour logs forever).
      if (eventType !== SecurityEventType.SUSPICIOUS_ACTIVITY) {
        await this.checkSuspiciousPatterns(event)
      }

      if (severity === SecuritySeverity.CRITICAL) {
        await this.sendSecurityAlert(event)
      }
    } catch (error) {
      console.error('Erro ao registrar evento de segurança:', error)
    }
  }

  // Verificar padrões suspeitos
  private async checkSuspiciousPatterns(event: SecurityEvent): Promise<void> {
    const { identifier, eventType } = event

    // Verificar múltiplas falhas de login
    if (eventType === SecurityEventType.LOGIN_FAILED) {
      const recentFailures = await this.getRecentEvents(
        identifier,
        SecurityEventType.LOGIN_FAILED,
        this.SUSPICIOUS_PATTERNS.rapidFailedLogins.windowMinutes
      )

      if (recentFailures.length >= this.SUSPICIOUS_PATTERNS.rapidFailedLogins.threshold) {
        await this.logEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          identifier,
          {
            reason: 'Multiple failed login attempts',
            count: recentFailures.length,
            events: recentFailures.map(e => e.id)
          },
          SecuritySeverity.WARNING
        )
      }
    }

    // Verificar horário suspeito
    const hour = new Date().getHours()
    if (
      hour >= this.SUSPICIOUS_PATTERNS.unusualHours.start &&
      hour <= this.SUSPICIOUS_PATTERNS.unusualHours.end
    ) {
      await this.logEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        identifier,
        {
          reason: 'Login attempt at unusual hour',
          hour,
          eventId: event.eventType
        },
        SecuritySeverity.WARNING
      )
    }
  }

  // Buscar eventos recentes
  private async getRecentEvents(
    identifier: string,
    eventType: SecurityEventType,
    windowMinutes: number
  ): Promise<admin.firestore.QueryDocumentSnapshot[]> {
    const cutoffTime = new Date()
    cutoffTime.setMinutes(cutoffTime.getMinutes() - windowMinutes)

    const snapshot = await this.getDb()
      .collection('securityLogs')
      .where('identifier', '==', identifier)
      .where('eventType', '==', eventType)
      .where('metadata.timestamp', '>=', admin.firestore.Timestamp.fromDate(cutoffTime))
      .get()

    return snapshot.docs
  }

  // Enviar alerta de segurança
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // Por enquanto, apenas registra no console
    // TODO: Implementar envio de email/SMS
    console.error('🚨 ALERTA DE SEGURANÇA CRÍTICO:', {
      type: event.eventType,
      identifier: event.identifier,
      details: event.details,
      timestamp: event.metadata.timestamp.toDate()
    })

    // Registrar alerta no Firestore
    await this.getDb().collection('securityAlerts').add({
      event,
      alertedAt: admin.firestore.Timestamp.now(),
      status: 'pending'
    })
  }

}

// Exportar instância única
export const securityLogger = new SecurityLogger()