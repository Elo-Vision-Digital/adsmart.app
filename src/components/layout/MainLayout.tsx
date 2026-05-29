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
      <div
        className="adsmart-scope"
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          background: 'var(--bg)',
          overflow: 'hidden',
        }}
      >
        {/* Desktop Sidebar */}
        <Sidebar />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Desktop TopBar */}
          <Header />

          {/* Main scrollable area */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <EmailVerificationBanner />
            {children}
          </div>
        </main>
      </div>

      {/* Mobile only elements - hidden in desktop via CSS */}
      <div className="md:hidden">
        <MobileHeader />
        <BottomNavigation />
      </div>
      <div className="hidden">
        <Footer />
      </div>
    </>
  )
}
