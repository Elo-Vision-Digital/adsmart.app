import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLanguage } from '@/contexts/LanguageContext'
import { type RegisterFormData, RegisterSchema } from '@/schemas/authSchemas'

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>
  loading?: boolean
  disabled?: boolean
}

export function RegisterForm({ onSubmit, loading, disabled }: RegisterFormProps) {
  const { t } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('common.form.name')}
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black focus:bg-white transition-all"
          disabled={loading || disabled}
        />
        {errors.name && (
          <p className="mt-1.5 text-sm text-red-500 font-medium">
            {t(errors.name.message as string)}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('common.form.email')}
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black focus:bg-white transition-all"
          disabled={loading || disabled}
        />
        {errors.email && (
          <p className="mt-1.5 text-sm text-red-500 font-medium">
            {t(errors.email.message as string)}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('common.form.password')}
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black focus:bg-white pr-11 transition-all"
            disabled={loading || disabled}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading || disabled}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-sm text-red-500 font-medium">
            {t(errors.password.message as string)}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('common.form.confirmPassword')}
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black focus:bg-white pr-11 transition-all"
            disabled={loading || disabled}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading || disabled}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1.5 text-sm text-red-500 font-medium">
            {t(errors.confirmPassword.message as string)}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || disabled}
        className="w-full h-11 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-4 shadow-sm"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            {t('common.loading')}
          </>
        ) : (
          t('common.button.signUp')
        )}
      </button>
    </form>
  )
}
