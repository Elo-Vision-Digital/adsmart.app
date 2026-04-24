import { httpsCallable } from 'firebase/functions'
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { functions } from '@/firebase/config'

interface SecurityStats {
  total: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  criticalEvents: any[]
}

interface ProductPrice {
  id: string
  name: string
  description: string
  price: number
  category: 'google' | 'meta'
  type: 'lancamento' | 'negocio_local'
  isActive: boolean
  updatedAt: any
  updatedBy: string
}

type TabType = 'security' | 'prices' | 'wallet'

export function AdminPanel() {
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('security')
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null)
  const [productPrices, setProductPrices] = useState<ProductPrice[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Estados para gestão de saldo
  const [targetEmail, setTargetEmail] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditReason, setCreditReason] = useState('')
  const [addingCredits, setAddingCredits] = useState(false)

  // Verificar se é admin
  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h1>
            <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (activeTab === 'security') {
      loadSecurityStats()
    } else if (activeTab === 'prices') {
      loadProductPrices()
    }
  }, [activeTab])

  // Carregar estatísticas de segurança
  const loadSecurityStats = async () => {
    try {
      setLoading(true)
      console.log('🔍 === DEBUG SECURITY STATS ===')
      console.log('👤 Usuário atual:', user?.email)
      console.log('🔐 É admin local:', isAdmin)
      console.log('🆔 UID:', user?.uid)
      console.log('✅ User object exists:', !!user)

      const getSecurityStats = httpsCallable(functions, 'getSecurityStats')
      const result = await getSecurityStats({ days: 7 })

      console.log('📊 Resultado da function:', result.data)

      // ✅ CORRIGIDO: Extrair os stats do resultado
      const responseData = result.data as any
      if (responseData.success && responseData.stats) {
        setSecurityStats(responseData.stats as SecurityStats)
        setMessage('Estatísticas carregadas com sucesso!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Erro: Dados não encontrados na resposta')
      }
    } catch (error: any) {
      console.error('❌ === ERRO COMPLETO ===')
      console.error('📄 Error object:', error)
      console.error('📄 Error code:', error.code)
      console.error('📄 Error message:', error.message)
      console.error('📄 Error details:', error.details)
      setMessage(`Erro ao carregar estatísticas: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Carregar preços dos produtos
  const loadProductPrices = async () => {
    try {
      setLoading(true)
      console.log('🔍 Tentando carregar preços...')
      console.log('👤 Usuário atual:', user?.email)
      console.log('🔐 É admin:', isAdmin)

      const getProductPrices = httpsCallable(functions, 'getProductPrices')
      const result = await getProductPrices()
      if (result.data && (result.data as any).success) {
        setProductPrices((result.data as any).prices)
        setMessage('Preços carregados com sucesso!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar preços:', error)
      console.error('📄 Detalhes do erro:', error.message)
      setMessage(`Erro ao carregar preços: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Atualizar preço específico
  const updatePrice = (id: string, newPrice: number) => {
    setProductPrices((prices) =>
      prices.map((price) => (price.id === id ? { ...price, price: newPrice } : price))
    )
  }

  // Salvar preços
  const saveProductPrices = async () => {
    try {
      setSaving(true)
      const updateProductPrices = httpsCallable(functions, 'updateProductPrices')
      const result = await updateProductPrices({ prices: productPrices })

      if ((result.data as any).success) {
        setMessage('Preços atualizados com sucesso!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error: any) {
      console.error('Erro ao salvar preços:', error)
      setMessage(`Erro ao salvar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Adicionar créditos para usuário
  const handleAddCredits = async () => {
    if (!targetEmail || !creditAmount || !creditReason) {
      setMessage('Por favor, preencha todos os campos')
      return
    }

    const amount = parseFloat(creditAmount)
    if (isNaN(amount) || amount <= 0) {
      setMessage('Por favor, insira um valor válido')
      return
    }

    if (creditReason.length < 10) {
      setMessage('O motivo deve ter pelo menos 10 caracteres')
      return
    }

    try {
      setAddingCredits(true)
      const addUserCredits = httpsCallable(functions, 'addUserCredits')
      const result = await addUserCredits({
        targetEmail,
        amount: Math.round(amount * 100), // Converter para centavos
        reason: creditReason,
      })

      if ((result.data as any).success) {
        const data = result.data as any
        setMessage(
          `Créditos adicionados com sucesso para ${targetEmail}! Limites diários: R$ ${data.adminLimits.dailyTotalAfter} / R$ ${data.adminLimits.maxDailyAmount}`
        )
        setTargetEmail('')
        setCreditAmount('')
        setCreditReason('')
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (error: any) {
      console.error('Erro ao adicionar créditos:', error)
      setMessage(`Erro: ${error.message}`)
    } finally {
      setAddingCredits(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Painel Administrativo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Bem-vindo, {user?.displayName || user?.email}
            </p>
          </div>

          {/* Debug Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Debug Info:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700 dark:text-blue-300">
                  <strong>Email:</strong> {user?.email}
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  <strong>É Admin Local:</strong> {isAdmin ? 'Sim' : 'Não'}
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  <strong>UID:</strong> {user?.uid}
                </p>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300">
                  <strong>Provider:</strong> {user?.providerData?.[0]?.providerId}
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  <strong>Verificado:</strong> {user?.emailVerified ? 'Sim' : 'Não'}
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  <strong>Display Name:</strong> {user?.displayName || 'N/A'}
                </p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Se "É Admin Local" = Sim mas ainda há erro 403, o problema está na verificação das
                Functions.
              </p>
            </div>
          </div>

          {/* Mensagens */}
          {message && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                message.includes('Erro')
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}
            >
              {message}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('security')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Logs de Segurança
              </button>
              <button
                onClick={() => setActiveTab('prices')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'prices'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-4 h-4 inline mr-2" />
                Configuração de Preços
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'wallet'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Wallet className="w-4 h-4 inline mr-2" />
                Gestão de Saldo
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Logs de Segurança (7 dias)
                </h2>
                <Button onClick={loadSecurityStats} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p>Carregando estatísticas...</p>
                </div>
              ) : securityStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="flex items-center gap-3">
                      <Activity className="w-8 h-8 text-blue-500" />
                      <div>
                        <h3 className="font-semibold">Total de Eventos</h3>
                        <p className="text-2xl font-bold">{securityStats.total || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                      <div>
                        <h3 className="font-semibold">Eventos Críticos</h3>
                        <p className="text-2xl font-bold">
                          {securityStats.criticalEvents?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-3">Por Severidade</h3>
                    <div className="space-y-2">
                      {securityStats.bySeverity &&
                        Object.entries(securityStats.bySeverity).map(([severity, count]) => (
                          <div key={severity} className="flex justify-between">
                            <span className="capitalize">{severity}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Eventos por tipo */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow md:col-span-2 lg:col-span-3">
                    <h3 className="font-semibold mb-3">Eventos por Tipo</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {securityStats.byType &&
                        Object.entries(securityStats.byType).map(([type, count]) => (
                          <div key={type} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {type.replace(/_/g, ' ').toLowerCase()}
                            </p>
                            <p className="font-bold">{count}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Clique em "Atualizar" para carregar as estatísticas
                </div>
              )}
            </div>
          )}

          {activeTab === 'prices' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  Configuração de Preços
                </h2>
                <div className="flex gap-2">
                  <Button onClick={loadProductPrices} disabled={loading} variant="outline">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Recarregar
                  </Button>
                  <Button onClick={saveProductPrices} disabled={saving}>
                    <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                    Salvar Alterações
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p>Carregando preços...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {productPrices.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
                    >
                      <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{product.description}</p>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">Preço:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.price}
                            onChange={(e) =>
                              updatePrice(product.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-gray-500">
                        <p>Categoria: {product.category}</p>
                        <p>Tipo: {product.type.replace('_', ' ')}</p>
                        {product.updatedAt && (
                          <p>
                            Atualizado:{' '}
                            {new Date(product.updatedAt.seconds * 1000).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Wallet className="w-6 h-6" />
                  Gestão de Saldo
                </h2>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow max-w-2xl">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Adicionar Créditos a Usuário
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email do Usuário
                    </label>
                    <input
                      type="email"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      placeholder="usuario@exemplo.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valor em Reais (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Digite o valor em reais. Ex: 10.50 para R$ 10,50 (Máximo: R$ 1.000,00)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Motivo <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                      placeholder="Descreva o motivo para adicionar créditos (mínimo 10 caracteres)"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {creditReason.length}/10 caracteres mínimos
                    </p>
                  </div>

                  <Button
                    onClick={handleAddCredits}
                    disabled={
                      addingCredits ||
                      !targetEmail ||
                      !creditAmount ||
                      !creditReason ||
                      creditReason.length < 10
                    }
                    className="w-full"
                  >
                    {addingCredits ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Créditos
                      </>
                    )}
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    ⚠️ Atenção - Medidas de Segurança
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Esta ação adiciona saldo real ao usuário</li>
                    <li>• O saldo adicionado afeta o ambiente de produção</li>
                    <li>• Limite por transação: R$ 1.000,00</li>
                    <li>• Limite diário por admin: R$ 5.000,00</li>
                    <li>• Máximo 50 transações por dia</li>
                    <li>• Motivo obrigatório (mínimo 10 caracteres)</li>
                    <li>• Todas as ações são registradas com IP e timestamp</li>
                    <li>• Use com responsabilidade</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
