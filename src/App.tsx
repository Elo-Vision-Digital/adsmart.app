import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { LoginPage } from '@/pages/LoginPage'
import { Dashboard } from '@/pages/Dashboard'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { AccountsPage } from '@/pages/AccountsPage'
import { TemplatesPage } from '@/pages/TemplatesPage'
import { GenerateReportPage } from '@/pages/GenerateReportPage'
import { ReportSuccessPage } from '@/pages/ReportSuccessPage'
import { AdminPanel } from '@/pages/AdminPanel'
import { PrivateRoute } from '@/components/PrivateRoute'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { DeleteDataPage } from '@/pages/DeleteDataPage'
import { OAuthCallbackPage } from '@/pages/OAuthCallbackPage'
import { MetaReviewDemo } from '@/pages/MetaReviewDemo'
import { PaymentSuccessPage } from '@/pages/PaymentSuccessPage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { TermsOfServicePage } from '@/pages/TermsOfServicePage'
import { HomePage } from '@/pages/HomePage'

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
              <Route 
                path="/auth/google-ads/callback" 
                element={
                  <OAuthCallbackPage />
                } 
              />
              <Route 
                path="/auth/meta-ads/callback" 
                element={
                  <OAuthCallbackPage />
                } 
              />
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
                  <PrivateRoute>
                    <AdminPanel />
                  </PrivateRoute>
                }
              />
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