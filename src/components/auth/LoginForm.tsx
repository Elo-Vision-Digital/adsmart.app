import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
// Let's use standard imports from react-hook-form
import { useForm as useHookForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { type LoginFormData, LoginSchema } from '@/schemas/authSchemas'

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>
  loading?: boolean
  disabled?: boolean
}

export function LoginForm({ onSubmit, loading, disabled }: LoginFormProps) {
  const { t } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useHookForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            {...register('rememberMe')}
            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer"
            disabled={loading || disabled}
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer">
            {t('common.form.rememberMe')}
          </label>
        </div>
        <Link
          to="/forgot-password"
          className="text-sm font-medium text-black hover:text-gray-600 transition-colors"
        >
          {t('common.button.forgotPassword')}
        </Link>
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
          t('common.button.login')
        )}
      </button>
    </form>
  )
}
