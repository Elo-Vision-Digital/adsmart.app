import { useWallet } from '@/hooks/useWallet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/MainLayout'
import { ArrowLeft, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function TransactionsPage() {
  const { transactions, loading, formatCurrency, balance } = useWallet()
  const navigate = useNavigate()

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background dark:bg-[#0A0A0A] flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-400">Carregando transações...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background dark:bg-[#0A0A0A]">
        <div className="w-full overflow-x-hidden">
          <div className="px-4 py-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/dashboard')}
                  className="mb-4"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Dashboard
                </Button>
                
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Histórico de Transações
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Acompanhe todas as movimentações da sua carteira
                </p>
              </div>

              {/* Card de Saldo */}
              <Card className="mb-6 bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700">
                <CardHeader className="px-4 md:px-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Wallet className="w-5 h-5" />
                    Saldo Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(balance)}
                  </p>
                </CardContent>
              </Card>

              {/* Card de Transações */}
              <Card className="bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700">
                <CardHeader className="px-4 md:px-6">
                  <CardTitle className="text-lg md:text-xl">Transações Recentes</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Últimas 10 transações realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  {transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Nenhuma transação realizada ainda.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-white dark:bg-gray-700 rounded-lg border border-[#EDEDED] dark:border-gray-600 gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {transaction.type === 'credit' ? (
                              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full flex-shrink-0">
                                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                              </div>
                            ) : (
                              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full flex-shrink-0">
                                <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
                              </div>
                            )}
                            
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-white text-sm md:text-base truncate">
                                {transaction.description}
                              </p>
                                                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                {(() => {
                                  try {
                                    const createdAt: any = transaction.createdAt;
                                    
                                    if (!createdAt) {
                                      return 'Data indisponível';
                                    }
                                    
                                    // Se já é uma Date
                                    if (createdAt instanceof Date) {
                                      return createdAt.toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      });
                                    }
                                    
                                    // Se tem método toDate (Timestamp do Firebase)
                                    if (typeof createdAt.toDate === 'function') {
                                      return createdAt.toDate().toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      });
                                    }
                                    
                                    // Se tem propriedade seconds
                                    if (createdAt.seconds) {
                                      return new Date(createdAt.seconds * 1000).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      });
                                    }
                                    
                                    return 'Data indisponível';
                                  } catch (error) {
                                    return 'Data indisponível';
                                  }
                                })()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right flex-shrink-0 ml-auto md:ml-0">
                            <p className={`font-semibold text-sm md:text-base ${
                              transaction.type === 'credit' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {transaction.type === 'credit' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </p>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                              {transaction.status === 'completed' ? 'Concluída' : 
                               transaction.status === 'pending' ? 'Pendente' : 'Falhou'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cards de Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Total de Créditos</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(
                            transactions
                              .filter(t => t.type === 'credit' && t.status === 'completed')
                              .reduce((sum, t) => sum + t.amount, 0)
                          )}
                        </p>
                      </div>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Total de Débitos</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(
                            transactions
                              .filter(t => t.type === 'debit' && t.status === 'completed')
                              .reduce((sum, t) => sum + t.amount, 0)
                          )}
                        </p>
                      </div>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Transações</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                          {transactions.length}
                        </p>
                      </div>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wallet className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}