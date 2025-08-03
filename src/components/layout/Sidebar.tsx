import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import {
  HomeIcon,
  IntegrationsIcon,
  ReportsIcon,
  TemplatesIcon,
  FinanceIcon,
  SettingsIcon,
  LogoutIcon,
  SunIcon,
  MoonIcon
} from '@/components/icons'
import { Shield } from 'lucide-react'

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
  adminOnly?: boolean
}

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon />, path: '/dashboard' },
    { id: 'integrations', label: 'Integrações', icon: <IntegrationsIcon />, path: '/accounts' },
    { id: 'reports', label: 'Relatórios', icon: <ReportsIcon />, path: '/reports' },
    { id: 'templates', label: 'Templates', icon: <TemplatesIcon />, path: '/templates' },
    { id: 'finance', label: 'Financeiro', icon: <FinanceIcon />, path: '/transactions' },
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon />, path: '/settings' },
    { 
      id: 'admin', 
      label: 'Administração', 
      icon: <Shield />, 
      path: '/admin', 
      adminOnly: true 
    },
  ]

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  // Filtrar itens baseado em permissões de admin
  const visibleMenuItems = menuItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  )

  return (
    <aside
      className={`fixed left-0 top-20 h-[calc(100%-5rem)] transition-all duration-300 z-40 ${
        isExpanded ? 'w-64' : 'w-20'
      } ${
        theme === 'dark' 
          ? 'bg-black border-r border-white/10' 
          : 'bg-white border-r border-black/10'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full py-6">
        {/* Logo and User */}
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${
              theme === 'dark' ? 'bg-white/10' : 'bg-black/5'
            }`}>
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
            </div>
            {isExpanded && (
              <div className="overflow-hidden">
                <h3 className={`font-semibold text-sm truncate ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  {user?.displayName || 'Usuário'}
                </h3>
                <p className={`text-xs truncate ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {user?.email}
                </p>
                {/* Badge de admin */}
                {isAdmin && (
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                    theme === 'dark' 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : 'bg-yellow-500/10 text-yellow-600'
                  }`}>
                    Admin
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {visibleMenuItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isExpanded ? '' : 'justify-center'
                  } ${
                    isActive(item.path)
                      ? theme === 'dark'
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-black hover:bg-black/5'
                  }`}
                >
                  <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                    {React.cloneElement(item.icon as React.ReactElement, { 
                      className: 'w-5 h-5',
                      strokeWidth: isActive(item.path) ? 2 : 1.5
                    })}
                  </span>
                  {isExpanded && (
                    <span className="text-sm font-medium truncate">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="px-3 space-y-1">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full ${
              isExpanded ? '' : 'justify-center'
            } ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-white/5'
                : 'text-gray-600 hover:text-black hover:bg-black/5'
            }`}
          >
            <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
              <LogoutIcon className="w-5 h-5" />
            </span>
            {isExpanded && (
              <span className="text-sm font-medium">Sair</span>
            )}
          </button>

          {/* Theme Toggle */}
          {isExpanded ? (
            <div className={`relative rounded-lg p-1 ${
              theme === 'dark' ? 'bg-white/10' : 'bg-black/5'
            }`}>
              <div
                className={`absolute inset-y-1 transition-all duration-200 rounded-md ${
                  theme === 'dark' 
                    ? 'bg-white left-1/2 right-1' 
                    : 'bg-black left-1 right-1/2'
                }`}
              />
              <div className="relative flex items-center justify-between">
                <button
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors z-10 flex-1 ${
                    theme === 'light' 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <SunIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">Claro</span>
                </button>
                
                <button
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors z-10 flex-1 ${
                    theme === 'dark' 
                      ? 'text-black' 
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  <MoonIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">Escuro</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={toggleTheme}
              className={`flex items-center justify-center px-3 py-2.5 rounded-lg transition-all duration-200 w-full ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-white/5'
                  : 'text-gray-600 hover:text-black hover:bg-black/5'
              }`}
            >
              {theme === 'dark' ? (
                <MoonIcon className="w-5 h-5" />
              ) : (
                <SunIcon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}