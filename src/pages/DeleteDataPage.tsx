import { httpsCallable } from 'firebase/functions'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { functions } from '@/firebase/config'
import { authErrorToTKey } from '@/lib/auth/errorMessages'

export function DeleteDataPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { t } = useLanguage()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')

  const userEmail = user?.email ?? ''
  // Case-insensitive email comparison (users type emails in various cases).
  const canDelete = !!userEmail && confirmText.trim().toLowerCase() === userEmail.toLowerCase()

  const handleDeleteAccount = async () => {
    if (!canDelete) return
    if (!user) {
      setError('Você precisa estar logado para excluir sua conta')
      return
    }

    try {
      setIsDeleting(true)
      setError('')

      // Backend (deleteUserData callable) cascades through Firestore +
      // userDocuments index + Firebase Auth user. Once it returns, the
      // caller's auth token is invalidated.
      const deleteUserDataFn = httpsCallable<
        Record<string, never>,
        { success: boolean; deletedAt: number; counts: Record<string, number> }
      >(functions, 'deleteUserData')
      await deleteUserDataFn({})

      // Clean up client auth state and redirect.
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      setError(t(authErrorToTKey(err)))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto p-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <CardTitle className="text-red-600">Excluir Conta e Dados</CardTitle>
              </div>
              <CardDescription>Esta ação é permanente e não pode ser desfeita</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  ⚠️ Atenção: Ao excluir sua conta, você perderá:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-200">
                  <li>Todos os seus relatórios gerados</li>
                  <li>Histórico de transações</li>
                  <li>Saldo em carteira (se houver)</li>
                  <li>Conexões com Google Ads e Meta Ads</li>
                  <li>Acesso à plataforma</li>
                </ul>
              </div>

              <div className="space-y-4">
                <label
                  htmlFor="confirm-email"
                  className="text-sm text-red-700 dark:text-red-300 font-medium block"
                >
                  Para confirmar, digite seu email{' '}
                  <code className="bg-red-50 dark:bg-red-900/30 px-1 rounded">{userEmail}</code>:
                </label>

                <input
                  id="confirm-email"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={userEmail}
                  autoComplete="off"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={isDeleting}
                />

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={!canDelete || isDeleting}
                  className="w-full"
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir minha conta permanentemente'}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  De acordo com o GDPR e LGPD, seus dados serão completamente removidos de nossos
                  sistemas. Alguns dados podem ser mantidos por obrigações legais por até 5 anos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
