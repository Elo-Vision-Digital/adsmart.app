import { useLanguage } from '@/contexts/LanguageContext'

interface OAuthProvidersProps {
  onGoogleSignIn: () => Promise<void>
  onFacebookSignIn: () => Promise<void>
  disabled?: boolean
}

export function OAuthProviders({
  onGoogleSignIn,
  onFacebookSignIn,
  disabled,
}: OAuthProvidersProps) {
  const { t } = useLanguage()

  return (
    <div className="w-full space-y-4">
      <div className="space-y-3">
        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={disabled}
          className="w-full h-11 flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {t('common.button.loginWithGoogle')}
        </button>

        <button
          type="button"
          onClick={onFacebookSignIn}
          disabled={disabled}
          className="w-full h-11 flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M24 12.073C24 5.405 18.627 0 12 0C5.373 0 0 5.405 0 12.073C0 18.098 4.414 23.088 10.125 24V15.562H7.078V12.073H10.125V9.412C10.125 6.386 11.916 4.717 14.657 4.717C15.97 4.717 17.344 4.952 17.344 4.952V7.947H15.831C14.34 7.947 13.875 8.883 13.875 9.84V12.073H17.203L16.671 15.562H13.875V24C19.586 23.088 24 18.098 24 12.073Z"
              fill="white"
            />
          </svg>
          {t('common.button.loginWithFacebook')}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">Ou</span>
        </div>
      </div>
    </div>
  )
}
