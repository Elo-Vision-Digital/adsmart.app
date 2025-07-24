export const passwordSchema = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
}

export function validatePassword(password: string): string[] {
  const errors: string[] = []
  
  if (password.length < passwordSchema.minLength) {
    errors.push(`Senha deve ter no mínimo ${passwordSchema.minLength} caracteres`)
  }
  
  if (passwordSchema.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula')
  }
  
  if (passwordSchema.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula')
  }
  
  if (passwordSchema.requireNumbers && !/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número')
  }
  
  if (passwordSchema.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial')
  }
  
  return errors
}

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
    color: colors[Math.min(score - 1, 5)] || colors[0]
  }
}