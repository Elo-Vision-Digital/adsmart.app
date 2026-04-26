import { DollarSign, Shield, Wallet } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

const tabs = [
  { to: 'security', icon: Shield, key: 'security' as const },
  { to: 'prices', icon: DollarSign, key: 'prices' as const },
  { to: 'wallet', icon: Wallet, key: 'wallet' as const },
]

export function AdminLayout() {
  const { user } = useAuth()
  const { t } = useLanguage()

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('admin.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('admin.welcomeBack', { name: user?.displayName || user?.email || '' })}
            </p>
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map(({ to, icon: Icon, key }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `py-2 px-1 border-b-2 font-medium text-sm ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 inline mr-2" />
                  {t(`admin.nav.${key}`)}
                </NavLink>
              ))}
            </nav>
          </div>

          <Outlet />
        </div>
      </div>
    </MainLayout>
  )
}
