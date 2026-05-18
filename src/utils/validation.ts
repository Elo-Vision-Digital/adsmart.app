// Legacy module: validatePassword moved to @adsmart/shared/auth/password
// (single source of truth, ADR-016). Re-exported here for stability of any
// external import path; new code should import directly from @adsmart/shared.
// getPasswordStrength stays local — used by SettingsPage password meter.

export { PASSWORD_MIN_LENGTH as passwordSchemaMinLength, validatePassword } from '@adsmart/shared'

export function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++

  const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte', 'Muito forte']
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981']

  return {
    score: Math.min(score - 1, 5),
    label: labels[Math.min(score - 1, 5)] || labels[0],
    color: colors[Math.min(score - 1, 5)] || colors[0],
  }
}
