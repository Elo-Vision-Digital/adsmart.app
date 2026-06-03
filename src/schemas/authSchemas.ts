import { PasswordSchema } from '@adsmart/shared'
import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('common.validation.invalidEmail'),
  password: z.string().min(1, 'common.validation.requiredField'),
  rememberMe: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof LoginSchema>

export const RegisterSchema = z
  .object({
    name: z.string().min(1, 'common.validation.requiredField'),
    email: z.string().email('common.validation.invalidEmail'),
    password: PasswordSchema,
    confirmPassword: z.string().min(1, 'common.validation.requiredField'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'common.validation.passwordMismatch',
    path: ['confirmPassword'],
  })

export type RegisterFormData = z.infer<typeof RegisterSchema>
