// Password policy shared between client (LoginPage signup, SettingsPage
// change-password) and Identity Platform configuration. Pre-ADR-016 the
// client signup enforced this exact rule but SettingsPage accepted 6 chars
// (drift). Identity Platform's own Password Policy (Firebase Console →
// Authentication → Settings → Password policy) must mirror this — see
// docs/DEPLOYMENT.md Phase H.

import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 4096 // Firebase Auth hard limit

export const PasswordPolicy = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
} as const

export const PasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .max(PASSWORD_MAX_LENGTH)
  .refine((v) => /[A-Z]/.test(v), { message: 'requireUppercase' })
  .refine((v) => /[a-z]/.test(v), { message: 'requireLowercase' })
  .refine((v) => /\d/.test(v), { message: 'requireNumber' })
  .refine((v) => /[!@#$%^&*(),.?":{}|<>]/.test(v), { message: 'requireSpecial' })

export interface PasswordValidationResult {
  valid: boolean
  // Translation keys consumers can map via i18n. Order is deterministic
  // (length, upper, lower, number, special) so callers can surface the
  // first failing rule if desired.
  errors: string[]
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  if (password.length < PASSWORD_MIN_LENGTH) errors.push('passwordPolicy.tooShort')
  if (!/[A-Z]/.test(password)) errors.push('passwordPolicy.requireUppercase')
  if (!/[a-z]/.test(password)) errors.push('passwordPolicy.requireLowercase')
  if (!/\d/.test(password)) errors.push('passwordPolicy.requireNumber')
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('passwordPolicy.requireSpecial')
  return { valid: errors.length === 0, errors }
}
