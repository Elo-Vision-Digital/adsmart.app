import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@/hooks/useWallet'
import { useProductPrices } from '@/hooks/useProductPrices'
import { useLanguage } from '@/contexts/LanguageContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { TemplateGrid, availableTemplates } from '@/components/templates/TemplateGrid'

export function TemplatesPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { balance, formatCurrency } = useWallet()
  const { loading: loadingPrices, error: pricesError, getPriceByCategory } = useProductPrices()

  const handleSelectTemplate = (templateId: string) => {
    navigate(`/generate-report?template=${templateId}`)
  }

  // Função para obter o preço de um template específico
  const getTemplatePrice = (category: 'google' | 'meta', type: 'lancamento' | 'negocio_local') => {
    const productPrice = getPriceByCategory(category, type)
    return productPrice ? productPrice.price * 100 : 500 // Converter para centavos
  }

  // Verificar se há saldo para qualquer template
  const hasBalanceForAnyTemplate = () => {
    return availableTemplates.some(template => {
      const price = getTemplatePrice(template.category, template.type)
      return balance >= price
    })
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('templatesPage.backToDashboard')}
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{t('templatesPage.title')}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {t('templatesPage.subtitle')}
                </p>
              </div>
              
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('templatesPage.currentBalance')}</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(balance)}</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Aviso de erro ao carregar preços */}
          {pricesError && (
            <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
              <CardHeader>
                <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {t('templatesPage.warning')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-orange-700 dark:text-orange-300">
                  {pricesError}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Aviso de saldo insuficiente */}
          {!hasBalanceForAnyTemplate() && !loadingPrices && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <CardHeader>
                <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {t('templatesPage.insufficientBalance.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700 dark:text-yellow-300">
                  {t('templatesPage.insufficientBalance.message', { balance: formatCurrency(balance) })}
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate('/dashboard')}
                >
                  {t('templatesPage.insufficientBalance.button')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Grid de Templates usando o componente centralizado */}
          <TemplateGrid onSelectTemplate={handleSelectTemplate} />

          {/* Como funciona */}
          <Card className="mt-6 dark:bg-[#1f2936]">
            <CardHeader>
              <CardTitle>{t('templatesPage.howItWorks.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex gap-2">
                  <span className="font-semibold">1.</span>
                  {t('templatesPage.howItWorks.step1')}
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">2.</span>
                  {t('templatesPage.howItWorks.step2')}
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">3.</span>
                  {t('templatesPage.howItWorks.step3')}
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">4.</span>
                  {t('templatesPage.howItWorks.step4')}
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">5.</span>
                  {t('templatesPage.howItWorks.step5')}
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}