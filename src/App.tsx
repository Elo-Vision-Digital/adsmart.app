import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from '@/components/AdminRoute'
import { PrivateRoute } from '@/components/PrivateRoute'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AccountsPage } from '@/pages/AccountsPage'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { PricesConfigPage } from '@/pages/admin/PricesConfigPage'
import { SecurityLogsPage } from '@/pages/admin/SecurityLogsPage'
import { WalletAdminPage } from '@/pages/admin/WalletAdminPage'
import { Dashboard } from '@/pages/Dashboard'
import { DeleteDataPage } from '@/pages/DeleteDataPage'
import { GenerateReportPage } from '@/pages/GenerateReportPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { MetaReviewDemo } from '@/pages/MetaReviewDemo'
import { OAuthCallbackPage } from '@/pages/OAuthCallbackPage'
import { PaymentSuccessPage } from '@/pages/PaymentSuccessPage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { ReportSuccessPage } from '@/pages/ReportSuccessPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TemplatesPage } from '@/pages/TemplatesPage'
import { TermsOfServicePage } from '@/pages/TermsOfServicePage'
import { TransactionsPage } from '@/pages/TransactionsPage'

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
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
                path="/accounts"
                element={
                  <PrivateRoute>
                    <AccountsPage />
                  </PrivateRoute>
                }
              />
              <Route path="/auth/google-ads/callback" element={<OAuthCallbackPage />} />
              <Route path="/auth/meta-ads/callback" element={<OAuthCallbackPage />} />
              <Route
                path="/templates"
                element={
                  <PrivateRoute>
                    <TemplatesPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/generate-report"
                element={
                  <PrivateRoute>
                    <GenerateReportPage />
                  </PrivateRoute>
                }
              />
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
              {/* Temporariamente mantido para demonstração Meta - remover após aprovação */}
              <Route
                path="/meta-review-demo"
                element={
                  <PrivateRoute>
                    <MetaReviewDemo />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<Navigate to="security" replace />} />
                <Route path="security" element={<SecurityLogsPage />} />
                <Route path="prices" element={<PricesConfigPage />} />
                <Route path="wallet" element={<WalletAdminPage />} />
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
