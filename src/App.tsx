import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from '@/components/AdminRoute'
import { PrivateRoute } from '@/components/PrivateRoute'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { PricesConfigPage } from '@/pages/admin/PricesConfigPage'
import { WalletAdminPage } from '@/pages/admin/WalletAdminPage'
import { Dashboard } from '@/pages/Dashboard'
import { DeleteDataPage } from '@/pages/DeleteDataPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { HomePage } from '@/pages/HomePage'
import { IntegrationsPage } from '@/pages/IntegrationsPage'
import { LoginPage } from '@/pages/LoginPage'
import { MetaReviewDemo } from '@/pages/MetaReviewDemo'
import { OAuthCallbackPage } from '@/pages/OAuthCallbackPage'
import { PaymentSuccessPage } from '@/pages/PaymentSuccessPage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { ReportSuccessPage } from '@/pages/ReportSuccessPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TermsOfServicePage } from '@/pages/TermsOfServicePage'
import { TransactionsPage } from '@/pages/TransactionsPage'

const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
)

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <PrivateRoute>
                    <TransactionsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/payment-success"
                element={
                  <PrivateRoute>
                    <PaymentSuccessPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/integrations"
                element={
                  <PrivateRoute>
                    <IntegrationsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <PrivateRoute>
                    <ProjectsPage />
                  </PrivateRoute>
                }
              />
              <Route path="/auth/google-ads/callback" element={<OAuthCallbackPage />} />
              <Route path="/auth/meta-ads/callback" element={<OAuthCallbackPage />} />
              <Route
                path="/report-success"
                element={
                  <PrivateRoute>
                    <ReportSuccessPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <PrivateRoute>
                    <ReportsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <SettingsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/privacy/delete-data"
                element={
                  <PrivateRoute>
                    <DeleteDataPage />
                  </PrivateRoute>
                }
              />
              {/* Demo da revisão Meta — dev-only. Em produção a rota não é registrada (ship em Fase 0.5 cleanup). */}
              {import.meta.env.MODE === 'development' && (
                <Route
                  path="/meta-review-demo"
                  element={
                    <PrivateRoute>
                      <MetaReviewDemo />
                    </PrivateRoute>
                  }
                />
              )}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route
                  path="dashboard"
                  element={
                    <Suspense fallback={null}>
                      <AdminDashboardPage />
                    </Suspense>
                  }
                />
                <Route path="prices" element={<PricesConfigPage />} />
                <Route path="wallet" element={<WalletAdminPage />} />
                {/* Catch unknown /admin/* (e.g. legacy /admin/security bookmarks). */}
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>
              {/* Public Pages */}
              <Route path="/" element={<HomePage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

export default App
