import { doc, getDoc } from 'firebase/firestore'
import { AlertCircle, CheckCircle, Clock, ExternalLink, FileText, Home } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/firebase/config'
import type { Report } from '@/types'

type ReportDoc = Partial<Report> & { createdAt?: { seconds: number } | Date }

export function ReportSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reportId = searchParams.get('id')
  const [reportData, setReportData] = useState<ReportDoc | null>(null)
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
          setReportData(reportDoc.data() as ReportDoc)
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
            <p className="text-gray-600 dark:text-gray-400">
              Carregando informações do relatório...
            </p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const lookerStudioUrl = reportData?.lookerStudioUrl
  const status = reportData?.status ?? 'pending'
  const isCompleted = status === 'completed' && Boolean(lookerStudioUrl)
  const isFailed = status === 'failed'

  const statusLabel: Record<typeof status, { text: string; color: string; dot: string }> = {
    pending: {
      text: 'Aguardando processamento',
      color: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
    },
    processing: {
      text: 'Processando',
      color: 'text-blue-700 dark:text-blue-400',
      dot: 'bg-blue-500',
    },
    completed: {
      text: 'Concluído',
      color: 'text-green-700 dark:text-green-400',
      dot: 'bg-green-500',
    },
    failed: {
      text: 'Falhou',
      color: 'text-red-700 dark:text-red-400',
      dot: 'bg-red-500',
    },
  }
  const currentStatus = statusLabel[status]

  const createdAtMs =
    reportData?.createdAt && 'seconds' in reportData.createdAt
      ? reportData.createdAt.seconds * 1000
      : reportData?.createdAt instanceof Date
        ? reportData.createdAt.getTime()
        : null

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                isCompleted
                  ? 'bg-green-100 dark:bg-green-900'
                  : isFailed
                    ? 'bg-red-100 dark:bg-red-900'
                    : 'bg-blue-100 dark:bg-blue-900'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              ) : isFailed ? (
                <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              ) : (
                <Clock className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-pulse" />
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isCompleted
                ? 'Relatório Gerado com Sucesso!'
                : isFailed
                  ? 'Falha ao gerar relatório'
                  : 'Estamos preparando seu relatório'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isCompleted
                ? 'Seu relatório está pronto para visualização'
                : isFailed
                  ? 'Algo deu errado durante o processamento'
                  : 'Você receberá uma notificação assim que estiver pronto'}
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
                  <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`}></span>
                  <span className={`font-medium ${currentStatus.color}`}>{currentStatus.text}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Gerado em:</span>
                <span className="font-medium">
                  {createdAtMs
                    ? new Date(createdAtMs).toLocaleString('pt-BR')
                    : new Date().toLocaleString('pt-BR')}
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
                {isCompleted
                  ? 'Clique no botão abaixo para visualizar seu relatório no Looker Studio'
                  : isFailed
                    ? 'O link ficará disponível depois que o problema for resolvido'
                    : 'O link aparecerá aqui assim que o processamento for concluído'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCompleted && lookerStudioUrl ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                      📊 Seu dashboard interativo está disponível com todas as métricas e análises
                      das campanhas selecionadas.
                    </p>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => window.open(lookerStudioUrl, '_blank')}
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
                        {lookerStudioUrl}
                      </code>
                    </div>
                  </div>
                </div>
              ) : isFailed ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
                  {reportData?.error ||
                    'Não conseguimos gerar este relatório. Tente novamente ou entre em contato com o suporte.'}
                </div>
              ) : (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                  Estamos coletando os dados das campanhas selecionadas. Esse processo costuma levar
                  alguns minutos — você pode atualizar a página ou voltar mais tarde.
                </div>
              )}
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
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            <Button onClick={() => navigate('/templates')}>Gerar Novo Relatório</Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
