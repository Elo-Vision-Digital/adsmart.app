import { useState } from 'react'
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
      icon: <Shield className="w-6 h-6" />, 
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
      className={`fixed left-0 top-20 h-[calc(100%-5rem)] bg-black dark:bg-surface transition-all duration-300 z-40 ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full py-6">
        {/* Logo and User */}
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0">
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
            {isExpanded && (
              <div className="overflow-hidden">
                <h3 className="text-white font-semibold text-sm truncate">
                  {user?.displayName || 'Usuário'}
                </h3>
                <p className="text-gray-400 text-xs truncate">
                  {user?.email}
                </p>
                {/* Badge de admin */}
                {isAdmin && (
                  <span className="inline-block bg-yellow-600 text-yellow-100 text-xs px-2 py-1 rounded-full mt-1">
                    Admin
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3">
          <ul className="space-y-2">
            {visibleMenuItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? item.adminOnly 
                        ? 'bg-yellow-600 text-white'
                        : 'bg-primary text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="w-6 h-6 flex-shrink-0">
                    {item.icon}
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
        <div className="px-3 space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full"
          >
            <span className="w-6 h-6 flex-shrink-0">
              <LogoutIcon />
            </span>
            {isExpanded && (
              <span className="text-sm font-medium">Sair</span>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full"
          >
            <span className="w-6 h-6 flex-shrink-0">
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </span>
            {isExpanded && (
              <span className="text-sm font-medium">
                {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}