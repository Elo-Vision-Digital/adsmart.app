import { CheckCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/hooks/useWallet'

export function PaymentSuccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { formattedBalance } = useWallet()

  // Pegar o valor do pagamento dos parâmetros de navegação
  const paymentAmount = location.state?.amount || 0

  useEffect(() => {
    // Se não veio de um pagamento, redirecionar
    if (!location.state?.amount) {
      navigate('/dashboard')
    }
  }, [location.state, navigate])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            {/* Ícone de sucesso */}
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-4">
                <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* Mensagem principal */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Pagamento Confirmado!
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Seus créditos foram adicionados à sua carteira com sucesso.
            </p>

            {/* Detalhes do pagamento */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Valor creditado:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(paymentAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Saldo atual:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formattedBalance}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Voltar ao Dashboard
              </Button>
            </div>

            {/* Mensagem adicional */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
              Você pode visualizar todas as suas transações na página de{' '}
              <button
                onClick={() => navigate('/transactions')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                histórico de transações
              </button>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
