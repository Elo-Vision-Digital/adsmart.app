import type { ReactNode } from 'react'
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner'
import { BottomNavigation } from './BottomNavigation'
import { Footer } from './Footer'
import { Header } from './Header'
import { MobileHeader } from './MobileHeader'
import { Sidebar } from './Sidebar'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <div className="min-h-screen bg-background relative">
        {/* Desktop Header - Fica acima de tudo */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden">
          <MobileHeader />
        </div>

        {/* Main Content */}
        <main className="md:ml-20 pt-14 md:pt-20 pb-20 md:pb-0 min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-5rem)]">
          <EmailVerificationBanner />
          {children}
        </main>
      </div>

      {/* Footer fora do container principal para não ter bordas */}
      <Footer />

      {/* Mobile Bottom Navigation - Fora do container principal */}
      <BottomNavigation />
    </>
  )
}
