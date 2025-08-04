import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { WalletDisplay } from '@/components/WalletDisplay'
import { Button } from '@/components/ui/button'
import { AddCreditsModal } from '@/components/ui/AddCreditsModal'
import { LanguageSelector } from '@/components/common/LanguageSelector'
import { ChevronDown } from 'lucide-react'

export function Header() {
  const { user, signOut } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [showAddCredits, setShowAddCredits] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-20 bg-white dark:bg-black border-b border-border z-[60] hidden md:block">
        <div className="flex items-center justify-between h-full px-6 py-2.5">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src={theme === 'light' ? 'https://i.imgur.com/T6AehDg.png' : 'https://i.imgur.com/CPDcfYm.png'}
              alt="adsmart"
              className="h-8"
            />
          </div>

          {/* Saldo e Ações */}
          <div className="flex items-center gap-4">
            <WalletDisplay />
            
            <Button
              onClick={() => setShowAddCredits(true)}
              className={`
                ${theme === 'light' 
                  ? 'bg-black hover:bg-gray-800 text-white' 
                  : 'bg-[#FAFAFA] hover:bg-gray-100 text-black'
                }
              `}
            >
              Depositar
            </Button>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Avatar com Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src="https://i.imgur.com/xvAMmEv.png"
                      alt="adsmart"
                      className="w-6 h-6 object-contain"
                    />
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 bg-white dark:bg-surface rounded-lg shadow-lg border border-border py-2 min-w-[200px] z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="font-medium text-sm">{user?.displayName || 'Usuário'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        navigate('/settings')
                        setShowDropdown(false)
                      }}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left"
                    >
                      <span className="text-sm">Configurações</span>
                    </button>
                    
                    <div className="border-t border-border mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left text-red-600 dark:text-red-400"
                      >
                        <span className="text-sm">Sair</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <AddCreditsModal
        open={showAddCredits}
        onOpenChange={setShowAddCredits}
      />
    </>
  )
}