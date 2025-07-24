import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, ExternalLink, Home, FileText } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { MainLayout } from '@/components/layout/MainLayout'

export function ReportSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reportId = searchParams.get('id')
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!reportId) {
      navigate('/dashboard')
      return
    }

    const fetchReport = async () => {
      try {
        const reportDoc = await getDoc(doc(db, 'reports', reportId))
        if (reportDoc.exists()) {
          setReportData(reportDoc.data())
        }
      } catch (error) {
        console.error('Erro ao buscar relatório:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [reportId, navigate])

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 dark:text-gray-400">Carregando informações do relatório...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Simular URL do Looker Studio (em produção viria do backend)
  const mockLookerUrl = `https://lookerstudio.google.com/reporting/sample-dashboard-${reportId}`

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Relatório Gerado com Sucesso!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Seu relatório está pronto para visualização
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Detalhes do Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Nome:</span>
                <span className="font-medium">{reportData?.name || 'Relatório'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="font-medium text-green-700 dark:text-green-400">Concluído</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Gerado em:</span>
                <span className="font-medium">
                  {reportData?.createdAt ? new Date(reportData.createdAt.seconds * 1000).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ID do Relatório:</span>
                <span className="font-mono text-sm">{reportId}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Acessar Relatório</CardTitle>
              <CardDescription>
                Clique no botão abaixo para visualizar seu relatório no Looker Studio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    📊 Seu dashboard interativo está disponível com todas as métricas e análises das campanhas selecionadas.
                  </p>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => window.open(mockLookerUrl, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Abrir Relatório no Looker Studio
                  </Button>
                </div>

                <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Link permanente:</p>
                    <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs break-all">
                      {mockLookerUrl}
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Compartilhe o link do relatório com sua equipe ou clientes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Os dados são atualizados automaticamente no Looker Studio
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Você pode editar e personalizar o visual do relatório
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Exporte em PDF ou programe envios automáticos
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
            >
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/templates')}
            >
              Gerar Novo Relatório
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}