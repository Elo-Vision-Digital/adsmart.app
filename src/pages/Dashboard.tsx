import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/MainLayout'
import { useNavigate } from 'react-router-dom'
import { Search, RefreshCw, Link2, Trash2, FileText, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { TemplateGrid } from '@/components/templates/TemplateGrid'
import { useAuth } from '@/contexts/AuthContext'
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { AdAccount } from '@/types'

// Mock data para demonstração
const mockReports = [
  {
    id: '1',
    name: 'Dashboard Google Ads - Lançamento',
    platform: 'google_ads',
    createdAt: new Date('2025-01-10'),
    accountName: 'Minha Conta'
  },
  {
    id: '2',
    name: 'Dashboard Meta Ads - Janeiro',
    platform: 'meta_ads',
    createdAt: new Date('2025-01-08'),
    accountName: 'Conta de Anúncio'
  },
  {
    id: '3',
    name: 'Análise de Performance Q1',
    platform: 'google_ads',
    createdAt: new Date('2025-01-05'),
    accountName: 'Conta Principal'
  }
]



// Componente para ícone do Google Ads
const GoogleAdsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="m57.193 15.502c-7.021-4.054-15.985-1.653-20.039 5.37l-25.162 43.583c-6.494 11.247 3.912 24.878 16.501 21.504 3.785-1.014 6.948-3.442 8.907-6.835l25.162-43.583c4.045-7.005 1.636-15.994-5.369-20.039z" fill="#fabc04"/>
    <path d="m88.038 64.455-25.163-43.583c-1.959-3.393-5.123-5.821-8.907-6.835-12.593-3.375-22.991 10.262-16.501 21.504l25.163 43.583c4.053 7.019 13.015 9.425 20.039 5.37 7.004-4.045 9.413-13.034 5.369-20.039z" fill="#3c8bd9"/>
    <path d="m38.865 67.993c-2.098-7.831-10.134-12.472-17.966-10.373-12.593 3.374-14.78 20.383-3.538 26.874 11.216 6.475 24.897-3.84 21.504-16.501z" fill="#34a852"/>
  </svg>
)

// Componente para ícone do Meta Ads
const MetaAdsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="meta-gradient" x1="5.3" x2="506.8" y1="255.9" y2="255.9" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#0064e0"/>
        <stop offset=".1" stopColor="#0075f0"/>
        <stop offset=".8" stopColor="#007df6"/>
        <stop offset="1" stopColor="#0082fc"/>
      </linearGradient>
    </defs>
    <path d="m149.4 89.4c-81.6 0-144.1 106.2-144.1 218.5 0 70.3 34 114.7 91 114.7 41 0 70.5-19.3 123-111 0 0 21.9-38.6 36.9-65.2l31.2-52.8c26.5-40.9 48.4-61.3 74.4-61.3 54 0 97.2 79.5 97.2 177.2 0 37.2-12.2 58.8-37.5 58.8-24.2 0-35.8-16-81.8-90l-42.3 36.9c47.9 80.2 74.6 107.4 123 107.4 55.5 0 86.4-45.1 86.4-116.9 0-117.7-63.9-216.5-141.6-216.5-41.1 0-73.3 31-102.4 70.3l-32.3 47.4c-31.9 49-51.3 79.7-51.3 79.7-42.5 66.7-57.2 81.6-80.9 81.6-24.4 0-38.8-21.4-38.8-59.5 0-81.6 40.7-165 89.2-165z" fill="url(#meta-gradient)"/>
  </svg>
)

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchReport, setSearchReport] = useState('')
  const [reports] = useState(mockReports)
  const [connections, setConnections] = useState<AdAccount[]>([])
  const [connectionsLoading, setConnectionsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const connectionsPerPage = 3

  // Buscar contas conectadas do Firestore
  useEffect(() => {
    if (!user) return

    const accountsRef = collection(db, 'users', user.uid, 'adAccounts')
    const q = query(accountsRef, where('isActive', '==', true))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accountsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AdAccount))
      
      setConnections(accountsData)
      setConnectionsLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Filtrar relatórios pela pesquisa
  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchReport.toLowerCase())
  )

  // Paginação das conexões
  const indexOfLastConnection = currentPage * connectionsPerPage
  const indexOfFirstConnection = indexOfLastConnection - connectionsPerPage
  const currentConnections = connections.slice(indexOfFirstConnection, indexOfLastConnection)
  const totalPages = Math.ceil(connections.length / connectionsPerPage)

  const handleRefreshConnection = (id: string) => {
    console.log('Refresh connection:', id)
    // TODO: Implementar lógica de refresh quando a API estiver pronta
  }

  const handleDeleteConnection = async (accountId: string) => {
    if (!user) return
    
    if (confirm('Tem certeza que deseja remover esta conta?')) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'adAccounts', accountId))
      } catch (error) {
        console.error('Erro ao remover conta:', error)
      }
    }
  }

  const handleSelectTemplate = (templateId: string) => {
    navigate(`/generate-report?template=${templateId}`)
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background dark:bg-[#0A0A0A]">
        {/* Container principal com overflow-x-hidden para prevenir scroll horizontal */}
        <div className="w-full overflow-x-hidden">
          <div className="px-4 py-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
              {/* Layout em Grid para Desktop, Stack para Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Meus Relatórios */}
                <Card className="bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700 w-full">
                  <CardHeader className="px-4 md:px-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 flex-shrink-0" />
                        <CardTitle className="text-lg md:text-xl">Meus relatórios</CardTitle>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Pesquisar..."
                          value={searchReport}
                          onChange={(e) => setSearchReport(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-[#EDEDED] dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary"
                        />
                      </div>
                      <Button 
                        onClick={() => navigate('/templates')}
                        className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Criar novo relatório
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 md:px-6">
                    {filteredReports.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum relatório encontrado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredReports.slice(0, 3).map((report) => (
                          <div 
                            key={report.id}
                            className="flex items-center justify-between p-3 md:p-4 bg-white dark:bg-gray-700 rounded-lg border border-[#EDEDED] dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/report-success?id=${report.id}`)}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                {report.platform === 'google_ads' ? (
                                  <GoogleAdsIcon />
                                ) : (
                                  <MetaAdsIcon />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                  {report.name}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="truncate">{report.createdAt.toLocaleDateString('pt-BR')}</span>
                                  <span>•</span>
                                  <span className="truncate">{report.accountName}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Integrações */}
                <Card className="bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700 w-full">
                  <CardHeader className="px-4 md:px-6">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link2 className="w-5 h-5 flex-shrink-0" />
                        <CardTitle className="text-lg md:text-xl truncate">Integrações</CardTitle>
                      </div>
                      <Button 
                        onClick={() => navigate('/accounts')}
                        className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 flex-shrink-0"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Adicionar contas</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 md:px-6">
                    {connectionsLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Carregando conexões...</p>
                      </div>
                    ) : connections.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Link2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma conta conectada</p>
                        <p className="text-sm mt-2">Clique em "Adicionar contas" para começar</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentConnections.map((account) => (
                          <div 
                            key={account.id}
                            className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-white dark:bg-gray-700 rounded-lg border border-[#EDEDED] dark:border-gray-600 gap-3"
                          >
                            <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                {account.platform === 'google_ads' ? (
                                  <GoogleAdsIcon />
                                ) : (
                                  <MetaAdsIcon />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {account.accountName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {account.email || account.accountId}
                                </p>
                                {account.lastSyncAt && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Sincronizado: {(() => {
                                      try {
                                        const date = (account.lastSyncAt as any).toDate ? (account.lastSyncAt as any).toDate() : new Date(account.lastSyncAt as any);
                                        return date.toLocaleDateString('pt-BR');
                                      } catch {
                                        return 'Recentemente';
                                      }
                                    })()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-12 md:ml-0 flex-shrink-0">
                              <button 
                                onClick={() => handleRefreshConnection(account.id)}
                                className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                title="Atualizar conexão"
                                disabled
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => navigate('/accounts')}
                                className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                title="Gerenciar contas"
                              >
                                <Link2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteConnection(account.id)}
                                className="p-1.5 md:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                                title="Excluir conexão"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Paginação */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-1 mt-4">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-2 py-1 md:px-3 md:py-1 text-sm rounded-lg ${
                                currentPage === page
                                  ? 'bg-primary text-white'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Templates - Usando o novo componente TemplateGrid */}
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Ver templates de Relatório
                </h2>
                <TemplateGrid onSelectTemplate={handleSelectTemplate} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}