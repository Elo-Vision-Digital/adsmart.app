import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ArrowLeft, CreditCard, Loader2, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/hooks/useWallet'
import { useProductPrices } from '@/hooks/useProductPrices'
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { MainLayout } from '@/components/layout/MainLayout'
import type { Campaign, AdAccount } from '@/types'

// Templates disponíveis (mesmo array da TemplatesPage)
const availableTemplates = [
  {
    id: 'google_lancamento',
    platform: 'google_ads',
    name: 'Dashboard Google Ads - Lançamento',
    description: 'Análise completa para campanhas de lançamento no Google Ads',
    category: 'google' as const,
    type: 'lancamento' as const
  },
  {
    id: 'meta_lancamento',
    platform: 'meta_ads',
    name: 'Dashboard Meta Ads - Lançamento',
    description: 'Visão 360° das suas campanhas de lançamento no Meta Ads',
    category: 'meta' as const,
    type: 'lancamento' as const
  },
  {
    id: 'google_negocio_local',
    platform: 'google_ads',
    name: 'Dashboard Google Ads - Negócios Locais',
    description: 'Relatórios especializados para empresas locais no Google',
    category: 'google' as const,
    type: 'negocio_local' as const
  },
  {
    id: 'meta_negocio_local',
    platform: 'meta_ads',
    name: 'Dashboard Meta Ads - Negócios Locais',
    description: 'Maximize seus resultados locais com insights do Meta Ads',
    category: 'meta' as const,
    type: 'negocio_local' as const
  }
]

export function GenerateReportPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { balance, formatCurrency, debitAmount } = useWallet()
  const { getPriceByCategory } = useProductPrices()
  
  const templateId = searchParams.get('template')
  const template = availableTemplates.find(t => t.id === templateId)
  
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportName, setReportName] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  
  // Obter preço dinamicamente
  const getReportCost = () => {
    if (!template) return 500 // fallback
    const productPrice = getPriceByCategory(template.category, template.type)
    return productPrice ? productPrice.price * 100 : 500 // converter para centavos
  }
  
  const reportCost = getReportCost()
  const hasBalance = balance >= reportCost

  // Buscar contas da plataforma selecionada
  useEffect(() => {
    if (!user || !template) return

    const fetchAccounts = async () => {
      const accountsRef = collection(db, 'users', user.uid, 'adAccounts')
      const q = query(
        accountsRef, 
        where('platform', '==', template.platform),
        where('isActive', '==', true)
      )
      const snapshot = await getDocs(q)
      const accountsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AdAccount))
      
      setAccounts(accountsData)
      if (accountsData.length === 1) {
        setSelectedAccount(accountsData[0].accountId)
      }
    }

    fetchAccounts()
  }, [user, template])

  // Buscar campanhas quando selecionar conta
  useEffect(() => {
    if (!user || !selectedAccount) return

    const fetchCampaigns = async () => {
      const campaignsRef = collection(db, 'users', user.uid, 'campaigns')
      const q = query(campaignsRef, where('accountId', '==', selectedAccount))
      const snapshot = await getDocs(q)
      const campaignsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Campaign))
      
      setCampaigns(campaignsData)
    }

    fetchCampaigns()
  }, [user, selectedAccount])

  // Definir datas padrão (últimos 30 dias)
  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }, [])

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedCampaigns(campaigns.map(c => c.campaignId))
    } else {
      setSelectedCampaigns([])
    }
  }

  const handleCampaignToggle = (campaignId: string, checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(prev => [...prev, campaignId])
    } else {
      setSelectedCampaigns(prev => prev.filter(id => id !== campaignId))
      setSelectAll(false)
    }
  }

  const handleGenerateReport = async () => {
    console.log('Iniciando geração do relatório...')
    
    if (!user || !template) {
      console.error('Usuário ou template não encontrado')
      return
    }
    
    try {
      setLoading(true)
      console.log('Debitando valor...')
      
      // Primeiro criar o registro do relatório
      const reportData = {
        userId: user.uid,
        type: template.platform,
        templateId: template.id,
        name: reportName || `${template.name} - ${new Date().toLocaleDateString('pt-BR')}`,
        status: 'processing',
        campaignIds: selectedCampaigns,
        allCampaigns: selectAll,
        dateRange: {
          startDate,
          endDate
        },
        cost: reportCost,
        paidAt: Timestamp.now(),
        createdAt: Timestamp.now()
      }
      
      console.log('Salvando relatório no Firestore...', reportData)
      const docRef = await addDoc(collection(db, 'reports'), reportData)
      console.log('Relatório salvo com ID:', docRef.id)
      
      // Depois debitar o valor passando o ID do relatório
      await debitAmount(reportCost, `Relatório: ${reportName || template.name}`, docRef.id)
      console.log('Valor debitado com sucesso')
      
      // Simular processamento
      console.log('Simulando processamento...')
      setTimeout(() => {
        console.log('Redirecionando para página de sucesso')
        navigate(`/report-success?id=${docRef.id}`)
      }, 2000)
      
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error)
      alert(`Erro ao gerar relatório: ${error.message}`)
      setLoading(false)
    }
  }

  if (!template) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">Template não encontrado</p>
            <Button onClick={() => navigate('/templates')}>
              Voltar aos Templates
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/templates')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar aos Templates
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerar Relatório</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Configure os detalhes do seu relatório {template.name}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Selecionar Dados</span>
              </div>
              <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Confirmar Pagamento</span>
              </div>
            </div>
          </div>

          {step === 1 && (
            <>
              {/* Seleção de Conta */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Conta de Anúncios</CardTitle>
                  <CardDescription>
                    Selecione a conta que deseja analisar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {accounts.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Nenhuma conta {template.platform === 'google_ads' ? 'Google Ads' : 'Meta Ads'} conectada
                      </p>
                      <Button onClick={() => navigate('/accounts')}>
                        Conectar Conta
                      </Button>
                    </div>
                  ) : (
                    <select
                      className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                    >
                      <option value="">Selecione uma conta</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.accountId}>
                          {account.accountName}
                        </option>
                      ))}
                    </select>
                  )}
                </CardContent>
              </Card>

              {/* Seleção de Campanhas */}
              {selectedAccount && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Campanhas</CardTitle>
                    <CardDescription>
                      Selecione as campanhas para incluir no relatório
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 pb-3 border-b">
                        <Checkbox
                          id="select-all"
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                        <label htmlFor="select-all" className="font-medium cursor-pointer">
                          Selecionar todas as campanhas ({campaigns.length})
                        </label>
                      </div>
                      
                      {campaigns.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          Nenhuma campanha encontrada para esta conta
                        </p>
                      ) : (
                        campaigns.map(campaign => (
                          <div 
                            key={campaign.id} 
                            className={`flex items-center space-x-2 py-2 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 ${
                              selectedCampaigns.includes(campaign.campaignId) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <Checkbox
                              id={campaign.campaignId}
                              checked={selectedCampaigns.includes(campaign.campaignId)}
                              onCheckedChange={(checked) => handleCampaignToggle(campaign.campaignId, checked)}
                            />
                            <label 
                              htmlFor={campaign.campaignId} 
                              className="flex-1 cursor-pointer flex items-center justify-between"
                            >
                              <span>{campaign.campaignName}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                campaign.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 
                                campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' : 
                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                              }`}>
                                {campaign.status === 'active' ? 'Ativa' : 
                                 campaign.status === 'paused' ? 'Pausada' : 'Finalizada'}
                              </span>
                            </label>
                          </div>
                        ))
                      )}
                      
                      {selectedCampaigns.length > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {selectedCampaigns.length} campanha(s) selecionada(s)
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Para demonstração, vamos permitir continuar mesmo sem conta */}
              {accounts.length === 0 && (
                <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                  <CardContent className="pt-6">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      Para fins de demonstração, você pode continuar sem conectar uma conta.
                      Na versão final, será necessário conectar sua conta de anúncios.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Período */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Período de Análise</CardTitle>
                  <CardDescription>
                    Defina o período dos dados do relatório
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Inicial</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Final</label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Nome do Relatório */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Nome do Relatório (Opcional)</CardTitle>
                  <CardDescription>
                    Dê um nome personalizado para identificar este relatório
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder={`Ex: ${template.name} - ${new Date().toLocaleDateString('pt-BR')}`}
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </CardContent>
              </Card>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setStep(2)}
                disabled={accounts.length > 0 && (!selectedAccount || selectedCampaigns.length === 0)}
              >
                Continuar para Pagamento
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Resumo */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Resumo do Relatório</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Template:</span>
                    <span className="font-medium">{template.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Campanhas:</span>
                    <span className="font-medium">
                      {selectAll ? 'Todas' : selectedCampaigns.length > 0 ? `${selectedCampaigns.length} selecionada(s)` : 'Demonstração'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Período:</span>
                    <span className="font-medium">
                      {new Date(startDate).toLocaleDateString('pt-BR')} - {new Date(endDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-lg">{formatCurrency(reportCost)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Pagamento */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Pagamento</CardTitle>
                  <CardDescription>
                    Escolha como deseja pagar pelo relatório
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className={`p-4 border rounded-lg ${hasBalance ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 opacity-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5" />
                          <div>
                            <p className="font-medium">Usar saldo da carteira</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Saldo disponível: {formatCurrency(balance)}
                            </p>
                          </div>
                        </div>
                        {hasBalance && <CheckCircle className="w-5 h-5 text-blue-600" />}
                      </div>
                    </div>
                    
                    {!hasBalance && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Saldo insuficiente. Adicione créditos para continuar.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => navigate('/dashboard')}
                        >
                          Adicionar Créditos
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Voltar
                </Button>
                <Button 
                  className="flex-1" 
                  size="lg"
                  onClick={() => {
                    console.log('Botão clicado! Saldo:', balance, 'Custo:', reportCost)
                    handleGenerateReport()
                  }}
                  disabled={!hasBalance || loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Gerando Relatório...' : 'Gerar Relatório'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  )
}