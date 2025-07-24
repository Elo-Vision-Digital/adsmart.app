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
  BACKUP_RESTORED = 'backup_restored'
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
      // Verificar se estamos no emulador e Firestore não está disponível
      const timestamp = admin.firestore?.Timestamp?.now?.() || {
        _seconds: Math.floor(Date.now() / 1000),
        _nanoseconds: 0
      }

      const event: SecurityEvent = {
        eventType,
        severity,
        identifier,
        userId: details.userId,
        details,
        metadata: {
          timestamp: timestamp as admin.firestore.Timestamp,
          ip: requestContext?.ip || details.ip,
          userAgent: requestContext?.headers['user-agent'] || details.userAgent,
          location: details.location,
          requestId: details.requestId
        }
      }

      // Tentar salvar o evento - se Firestore não estiver disponível, apenas log
      try {
        await this.getDb().collection('securityLogs').add(event)
      } catch (firestoreError) {
        console.log('Firestore não disponível, evento não salvo:', event)
      }

      // Verificar padrões suspeitos
      await this.checkSuspiciousPatterns(event)

      // Enviar alerta se necessário
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

  // Método para obter estatísticas de segurança
  async getSecurityStats(days: number = 7): Promise<any> {
    const cutoffTime = new Date()
    cutoffTime.setDate(cutoffTime.getDate() - days)

    const snapshot = await this.getDb()
      .collection('securityLogs')
      .where('metadata.timestamp', '>=', admin.firestore.Timestamp.fromDate(cutoffTime))
      .get()

    const stats = {
      total: snapshot.size,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      criticalEvents: [] as any[]
    }

    snapshot.forEach(doc => {
      const data = doc.data() as SecurityEvent
      
      // Por tipo
      stats.byType[data.eventType] = (stats.byType[data.eventType] || 0) + 1
      
      // Por severidade
      stats.bySeverity[data.severity] = (stats.bySeverity[data.severity] || 0) + 1
      
      // Eventos críticos
      if (data.severity === SecuritySeverity.CRITICAL) {
        stats.criticalEvents.push({
          id: doc.id,
          ...data
        })
      }
    })

    return stats
  }
}

// Exportar instância única
export const securityLogger = new SecurityLogger()