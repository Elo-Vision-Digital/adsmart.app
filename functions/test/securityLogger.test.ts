import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { getAdmin, clearCollection } from './helpers/firestore'
import {
  securityLogger,
  SecurityEventType,
  SecuritySeverity,
} from '../src/securityLogger'

beforeAll(() => {
  getAdmin()
})

describe('securityLogger — re-entrancy', () => {
  beforeEach(async () => {
    await clearCollection('securityLogs')
    await clearCollection('securityAlerts')
  })

  it('does not recurse when logging a SUSPICIOUS_ACTIVITY event', async () => {
    // If checkSuspiciousPatterns is called for a SUSPICIOUS_ACTIVITY event,
    // the unusual-hour branch (if system clock matches 02:00–05:00) triggers
    // another logEvent call, which recurses. Guard MUST skip the check.
    await expect(
      securityLogger.logEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        'test-user',
        { reason: 'test' },
        SecuritySeverity.WARNING
      )
    ).resolves.toBeUndefined()

    // Only ONE document written, not a chain
    const snap = await getAdmin().firestore().collection('securityLogs').get()
    expect(snap.size).toBe(1)
    expect(snap.docs[0].data().eventType).toBe('suspicious_activity')
  })

  it('does not crash on a normal event regardless of wall-clock hour', async () => {
    await expect(
      securityLogger.logEvent(
        SecurityEventType.RECAPTCHA_SUCCESS,
        'test-user',
        { ok: true },
        SecuritySeverity.INFO
      )
    ).resolves.toBeUndefined()
  })

  it('writes a securityAlerts doc when SUSPICIOUS_ACTIVITY is CRITICAL', async () => {
    await securityLogger.logEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      'test-user',
      { reason: 'test-critical' },
      SecuritySeverity.CRITICAL
    )

    const logs = await getAdmin().firestore().collection('securityLogs').get()
    expect(logs.size).toBe(1)

    const alerts = await getAdmin().firestore().collection('securityAlerts').get()
    expect(alerts.size).toBe(1)
  })
})
