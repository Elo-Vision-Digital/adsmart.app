import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/hooks/useWallet'
import { useTheme } from '@/contexts/ThemeContext'
import { SettingsIcon, LogoutIcon, SunIcon, MoonIcon } from '@/components/icons'
import { Plus } from 'lucide-react'
import { AddCreditsModal } from '@/components/ui/AddCreditsModal'

export function MobileHeader() {
  const [showMenu, setShowMenu] = useState(false)
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false)
  const { user, signOut } = useAuth()
  const { formattedBalance } = useWallet()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full bg-white dark:bg-black border-b border-border md:hidden z-40">
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
            <div className="flex items-center gap-1.5 bg-surface dark:bg-gray-900 rounded-lg px-3 py-1.5">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground leading-none">Saldo</p>
                <p className="font-semibold text-sm">{formattedBalance}</p>
              </div>
              
              {/* Botão Depositar */}
              <button
                onClick={() => setShowAddCreditsModal(true)}
                className="w-7 h-7 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center transition-colors"
                title="Adicionar créditos"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Avatar */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center flex-shrink-0"
            >
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
          <div className="fixed top-14 right-4 bg-white dark:bg-surface rounded-lg shadow-lg border border-border py-2 min-w-[200px] z-50 md:hidden">
            <div className="px-4 py-2 border-b border-border">
              <p className="font-medium text-sm">{user?.displayName || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            
            <button
              onClick={() => {
                navigate('/settings')
                setShowMenu(false)
              }}
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface dark:hover:bg-gray-800 transition-colors w-full"
            >
              <SettingsIcon size={18} />
              <span className="text-sm">Configurações</span>
            </button>
            
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface dark:hover:bg-gray-800 transition-colors w-full"
            >
              {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
              <span className="text-sm">
                {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
              </span>
            </button>
            
            <div className="border-t border-border mt-2 pt-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 hover:bg-surface dark:hover:bg-gray-800 transition-colors w-full text-red-600 dark:text-red-400"
              >
                <LogoutIcon size={18} />
                <span className="text-sm">Sair</span>
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