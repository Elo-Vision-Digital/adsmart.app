import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  IntegrationsIcon,
  ReportsIcon,
  TemplatesIcon,
  FinanceIcon
} from '@/components/icons'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
}

export function BottomNavigation() {
  const location = useLocation()
  
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon />, path: '/dashboard' },
    { id: 'integrations', label: 'Integrações', icon: <IntegrationsIcon />, path: '/accounts' },
    { id: 'reports', label: 'Relatórios', icon: <ReportsIcon />, path: '/reports' },
    { id: 'templates', label: 'Templates', icon: <TemplatesIcon />, path: '/templates' },
    { id: 'finance', label: 'Financeiro', icon: <FinanceIcon />, path: '/transactions' },
  ]
  
  const isActive = (path: string) => location.pathname === path
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-border md:hidden z-50">
      <div className="grid grid-cols-5 h-16 px-4">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
              isActive(item.path)
                ? 'text-primary'
                : 'text-muted-foreground dark:text-gray-400'
            }`}
          >
            <span className="w-6 h-6">
              {item.icon}
            </span>
            <span className="text-[10px] font-medium leading-none">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}