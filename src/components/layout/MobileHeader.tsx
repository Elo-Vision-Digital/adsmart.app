import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/hooks/useWallet'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { SettingsIcon, LogoutIcon, SunIcon, MoonIcon } from '@/components/icons'
import { Plus, Globe, ChevronRight } from 'lucide-react'
import { AddCreditsModal } from '@/components/ui/AddCreditsModal'

export function MobileHeader() {
  const [showMenu, setShowMenu] = useState(false)
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false)
  const { user, signOut } = useAuth()
  const { formattedBalance } = useWallet()
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 w-full border-b md:hidden z-40 ${
        theme === 'dark' 
          ? 'bg-black border-white/10' 
          : 'bg-white border-black/10'
      }`}>
        <div className="flex items-center justify-between h-14 px-4 max-w-full">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              src={theme === 'light' ? 'https://i.imgur.com/T6AehDg.png' : 'https://i.imgur.com/CPDcfYm.png'}
              alt="adsmart"
              className="h-8"
            />
          </div>

          {/* Saldo, Botão Depositar e Avatar */}
          <div className="flex items-center gap-2">
            {/* Container do Saldo e Botão */}
            <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${
              theme === 'dark' 
                ? 'bg-white/10' 
                : 'bg-black/5'
            }`}>
              <div className="text-right">
                <p className={`text-[10px] leading-none ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>{t('common.general.balance')}</p>
                <p className={`font-semibold text-sm ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}>{formattedBalance}</p>
              </div>
              
              {/* Botão Depositar */}
              <button
                onClick={() => setShowAddCreditsModal(true)}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                  theme === 'dark'
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
                title="Adicionar créditos"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Avatar */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`relative w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${
                theme === 'dark' ? 'bg-white/10' : 'bg-black/5'
              }`}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className={`text-lg font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  {user?.displayName?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setShowMenu(false)}
          />
          <div className={`fixed top-14 right-4 rounded-lg shadow-lg border py-2 min-w-[200px] z-50 md:hidden ${
            theme === 'dark' 
              ? 'bg-black border-white/20' 
              : 'bg-white border-black/10'
          }`}>
            <div className={`px-4 py-2 border-b ${
              theme === 'dark' ? 'border-white/20' : 'border-black/10'
            }`}>
              <p className={`font-medium text-sm ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}>{user?.displayName || t('common.general.user')}</p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>{user?.email}</p>
            </div>
            
            <button
              onClick={() => {
                navigate('/settings')
                setShowMenu(false)
              }}
              className={`flex items-center gap-3 px-4 py-2 transition-colors w-full ${
                theme === 'dark' 
                  ? 'hover:bg-white/10 text-white' 
                  : 'hover:bg-black/5 text-black'
              }`}
            >
              <SettingsIcon size={18} />
              <span className="text-sm">{t('common.general.settings')}</span>
            </button>
            
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-3 px-4 py-2 transition-colors w-full ${
                theme === 'dark' 
                  ? 'hover:bg-white/10 text-white' 
                  : 'hover:bg-black/5 text-black'
              }`}
            >
              {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
              <span className="text-sm">
                {theme === 'light' ? t('common.theme.dark') : t('common.theme.light')}
              </span>
            </button>
            
            {/* Language Selector */}
            <MobileLanguageSelector onClose={() => setShowMenu(false)} />
            
            <div className={`border-t mt-2 pt-2 ${
              theme === 'dark' ? 'border-white/20' : 'border-black/10'
            }`}>
              <button
                onClick={handleLogout}
                className={`flex items-center gap-3 px-4 py-2 transition-colors w-full text-red-600 dark:text-red-400 ${
                  theme === 'dark' 
                    ? 'hover:bg-white/10' 
                    : 'hover:bg-black/5'
                }`}
              >
                <LogoutIcon size={18} />
                <span className="text-sm">{t('common.general.logout')}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal de Adicionar Créditos */}
      <AddCreditsModal 
        open={showAddCreditsModal} 
        onOpenChange={setShowAddCreditsModal} 
      />
    </>
  )
}

// Language Selector adaptado para o mobile
function MobileLanguageSelector({ onClose }: { onClose: () => void }) {
  const { language, setLanguage, t } = useLanguage()
  const { theme } = useTheme()
  const [showOptions, setShowOptions] = useState(false)

  const languageOptions = [
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' }
  ]

  const currentLang = languageOptions.find(l => l.code === language) || languageOptions[0]

  if (showOptions) {
    return (
      <>
        {languageOptions.map(lang => (
          <button
            key={lang.code}
            onClick={() => {
              setLanguage(lang.code as 'pt' | 'en' | 'es')
              setShowOptions(false)
              onClose()
            }}
            className={`flex items-center gap-3 px-4 py-2 transition-colors w-full ${
              language === lang.code
                ? theme === 'dark' ? 'bg-white/10' : 'bg-black/10'
                : theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="text-sm">{lang.label}</span>
          </button>
        ))}
        <button
          onClick={() => setShowOptions(false)}
          className={`flex items-center gap-3 px-4 py-2 transition-colors w-full ${
            theme === 'dark' 
              ? 'hover:bg-white/10 text-gray-400' 
              : 'hover:bg-black/5 text-gray-600'
          }`}
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="text-sm">{t('common.button.back') || 'Voltar'}</span>
        </button>
      </>
    )
  }

  return (
    <button
      onClick={() => setShowOptions(true)}
      className={`flex items-center gap-3 px-4 py-2 transition-colors w-full ${
        theme === 'dark' 
          ? 'hover:bg-white/10 text-white' 
          : 'hover:bg-black/5 text-black'
      }`}
    >
      <Globe size={18} />
      <span className="text-sm">{currentLang.flag} {currentLang.label}</span>
      <ChevronRight className="w-3 h-3 ml-auto" />
    </button>
  )
}