import { describe, it, expect } from 'vitest'
import { ADMIN_EMAILS, isAdminUser } from './admin'

describe('isAdminUser', () => {
  it('returns true when custom claim admin === true (regardless of email)', () => {
    expect(isAdminUser({ admin: true }, 'anyone@example.com')).toBe(true)
    expect(isAdminUser({ admin: true }, null)).toBe(true)
    expect(isAdminUser({ admin: true }, undefined)).toBe(true)
  })

  it('returns true when email is in the legacy allowlist', () => {
    for (const email of ADMIN_EMAILS) {
      expect(isAdminUser({}, email)).toBe(true)
      expect(isAdminUser(null, email)).toBe(true)
      expect(isAdminUser(undefined, email)).toBe(true)
    }
  })

  it('returns false when claim is not true and email is not allowlisted', () => {
    expect(isAdminUser({}, 'random@example.com')).toBe(false)
    expect(isAdminUser({ admin: false }, 'random@example.com')).toBe(false)
    expect(isAdminUser({ admin: 'true' as unknown as boolean }, 'random@example.com')).toBe(false)
    expect(isAdminUser({}, null)).toBe(false)
    expect(isAdminUser({}, undefined)).toBe(false)
    expect(isAdminUser({}, '')).toBe(false)
  })

  it('ADMIN_EMAILS contains the two known admins', () => {
    expect(ADMIN_EMAILS).toContain('agency.elovisiondigital@gmail.com')
    expect(ADMIN_EMAILS).toContain('admin@adsmart.app')
    expect(ADMIN_EMAILS).toHaveLength(2)
  })
})
