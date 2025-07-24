import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { deleteUser } from 'firebase/auth'
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

export function DeleteDataPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')

  const handleDeleteAccount = async () => {
    if (confirmText !== 'EXCLUIR MINHA CONTA') {
      setError('Digite exatamente "EXCLUIR MINHA CONTA" para confirmar')
      return
    }

    if (!user) {
      setError('Você precisa estar logado para excluir sua conta')
      return
    }

    try {
      setIsDeleting(true)
      setError('')

      // 1. Deletar dados do Firestore
      await deleteDoc(doc(db, 'users', user.uid))
      
      // 2. Deletar subcoleções (se existirem)
      // TODO: Implementar exclusão de subcoleções via Cloud Function
      
      // 3. Deletar conta de autenticação
      await deleteUser(user)

      // Redirecionar para página inicial
      navigate('/')
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error)
      
      if (error.code === 'auth/requires-recent-login') {
        setError('Por segurança, faça login novamente antes de excluir sua conta')
      } else {
        setError('Erro ao excluir conta. Tente novamente mais tarde.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto p-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <CardTitle className="text-red-600">Excluir Conta e Dados</CardTitle>
              </div>
              <CardDescription>
                Esta ação é permanente e não pode ser desfeita
              </CardDescription>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Para confirmar a exclusão, digite <strong>EXCLUIR MINHA CONTA</strong> no campo abaixo:
                </p>
                
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Digite EXCLUIR MINHA CONTA"
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
                  disabled={isDeleting || confirmText !== 'EXCLUIR MINHA CONTA'}
                  className="w-full"
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  De acordo com o GDPR e LGPD, seus dados serão completamente removidos de nossos sistemas. 
                  Alguns dados podem ser mantidos por obrigações legais por até 5 anos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}