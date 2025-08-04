import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, AlertCircle, RefreshCw } from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'
import { useProductPrices } from '@/hooks/useProductPrices'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'

interface TemplateCardProps {
  id: string
  platform: 'google_ads' | 'meta_ads'
  category: 'google' | 'meta'
  type: 'lancamento' | 'negocio_local'
  imageUrl: string
  onSelect: (templateId: string) => void
}

export function TemplateCard({
  id,
  platform,
  category,
  type,
  imageUrl,
  onSelect
}: TemplateCardProps) {
  const { balance, formatCurrency } = useWallet()
  const { loading: loadingPrices, getPriceByCategory } = useProductPrices()
  const { theme } = useTheme()
  const { t } = useLanguage()
  
  // Obter informações de preço
  const priceInfo = getPriceByCategory(category, type)
  const templatePrice = priceInfo ? priceInfo.price * 100 : 500 // Converter para centavos
  const hasBalance = balance >= templatePrice

  // Traduzir nome do template
  const getTranslatedTemplateName = () => {
    if (!priceInfo?.name) return null
    
    const platformName = category === 'google' ? 'Google Ads' : 'Meta Ads'
    const typeName = type === 'lancamento' 
      ? t('templateCard.templateTypes.launch')
      : t('templateCard.templateTypes.localBusiness')
    
    return `Dashboard ${platformName} - ${typeName}`
  }

  // Traduzir descrição do template
  const getTranslatedTemplateDescription = () => {
    if (!priceInfo?.description) return null
    
    // Mapear IDs para chaves de tradução
    const descriptionKeyMap: Record<string, string> = {
      'google_lancamento': 'googleLaunch',
      'meta_lancamento': 'metaLaunch',
      'google_negocio_local': 'googleLocal',
      'meta_negocio_local': 'metaLocal'
    }
    
    const descriptionKey = descriptionKeyMap[id]
    return descriptionKey ? t(`templateCard.templateDescriptions.${descriptionKey}`) : null
  }

  // Traduzir features baseado no ID do template
  const getTranslatedFeatures = () => {
    // Mapear IDs para chaves de tradução
    const featureKeyMap: Record<string, string> = {
      'google_lancamento': 'googleLaunch',
      'meta_lancamento': 'metaLaunch',
      'google_negocio_local': 'googleLocal',
      'meta_negocio_local': 'metaLocal'
    }
    
    const featureKey = featureKeyMap[id] || id
    const featureBase = `templateFeatures.${featureKey}`
    
    return [
      t(`${featureBase}.feature1`),
      t(`${featureBase}.feature2`),
      t(`${featureBase}.feature3`),
      t(`${featureBase}.feature4`)
    ]
  }

  // Componente do ícone do Google Ads
  const GoogleAdsIcon = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
      <path d="m57.193 15.502c-7.021-4.054-15.985-1.653-20.039 5.37l-25.162 43.583c-6.494 11.247 3.912 24.878 16.501 21.504 3.785-1.014 6.948-3.442 8.907-6.835l25.162-43.583c4.045-7.005 1.636-15.994-5.369-20.039z" fill="#fabc04"/>
      <path d="m88.038 64.455-25.163-43.583c-1.959-3.393-5.123-5.821-8.907-6.835-12.593-3.375-22.991 10.262-16.501 21.504l25.163 43.583c4.053 7.019 13.015 9.425 20.039 5.37 7.004-4.045 9.413-13.034 5.369-20.039z" fill="#3c8bd9"/>
      <path d="m38.865 67.993c-2.098-7.831-10.134-12.472-17.966-10.373-12.593 3.374-14.78 20.383-3.538 26.874 11.216 6.475 24.897-3.84 21.504-16.501z" fill="#34a852"/>
    </svg>
  )

  // Componente do ícone do Meta Ads
  const MetaAdsIcon = () => (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
      <defs>
        <linearGradient id={`meta-gradient-${id}`} x1="5.3" x2="506.8" y1="255.9" y2="255.9" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0064e0"/>
          <stop offset=".1" stopColor="#0075f0"/>
          <stop offset=".8" stopColor="#007df6"/>
          <stop offset="1" stopColor="#0082fc"/>
        </linearGradient>
      </defs>
      <path d="m149.4 89.4c-81.6 0-144.1 106.2-144.1 218.5 0 70.3 34 114.7 91 114.7 41 0 70.5-19.3 123-111 0 0 21.9-38.6 36.9-65.2l31.2-52.8c26.5-40.9 48.4-61.3 74.4-61.3 54 0 97.2 79.5 97.2 177.2 0 37.2-12.2 58.8-37.5 58.8-24.2 0-35.8-16-81.8-90l-42.3 36.9c47.9 80.2 74.6 107.4 123 107.4 55.5 0 86.4-45.1 86.4-116.9 0-117.7-63.9-216.5-141.6-216.5-41.1 0-73.3 31-102.4 70.3l-32.3 47.4c-31.9 49-51.3 79.7-51.3 79.7-42.5 66.7-57.2 81.6-80.9 81.6-24.4 0-38.8-21.4-38.8-59.5 0-81.6 40.7-165 89.2-165z" fill={`url(#meta-gradient-${id})`}/>
    </svg>
  )

  const translatedFeatures = getTranslatedFeatures()

  return (
    <Card className={`overflow-hidden transition-all duration-200 cursor-pointer w-full ${
      theme === 'dark' 
        ? 'bg-black border-white/20 hover:border-white/40' 
        : 'bg-white border-black/10 hover:border-black/30'
    } hover:shadow-xl`}>
      <div className="relative h-40 md:h-48 bg-gradient-to-b from-transparent to-black/50">
        <img 
          src={imageUrl} 
          alt={priceInfo?.name || 'Template'}
          className="w-full h-full object-cover"
        />
        
        {/* Tag de preço sobre a imagem */}
        <div className={`absolute top-2 right-2 md:top-4 md:right-4 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-2 ${
          theme === 'dark' 
            ? 'bg-white text-black' 
            : 'bg-black text-white'
        }`}>
          {platform === 'google_ads' ? <GoogleAdsIcon /> : <MetaAdsIcon />}
          <span className="font-bold text-xs md:text-sm">{formatCurrency(templatePrice)}</span>
        </div>
      </div>
      
      <CardHeader className="pb-4 px-4 md:px-6">
        <CardTitle className={`text-base md:text-lg ${
          theme === 'dark' ? 'text-white' : 'text-black'
        }`}>
          {getTranslatedTemplateName() || t('templateCard.defaultTitle', { platform: category === 'google' ? 'Google Ads' : 'Meta Ads' })}
        </CardTitle>
        <CardDescription className={`text-xs md:text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {getTranslatedTemplateDescription() || t('templateCard.defaultDescription')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-4 md:px-6">
        <div className="space-y-3">
          <p className={`text-xs md:text-sm font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {t('templateCard.featuresIncluded')}
          </p>
          <ul className="space-y-2">
            {translatedFeatures.map((feature, index) => (
              <li key={index} className={`text-xs md:text-sm flex items-start gap-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  theme === 'dark' 
                    ? 'bg-white/10' 
                    : 'bg-black/5'
                }`}>
                  <Check className="w-3 h-3" strokeWidth={2} />
                </div>
                <span className="line-clamp-2">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <Button 
          className={`w-full mt-6 ${
            hasBalance
              ? theme === 'dark'
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-black text-white hover:bg-gray-800'
              : theme === 'dark'
                ? 'bg-white/10 text-white/50'
                : 'bg-black/10 text-black/50'
          } text-sm md:text-base`}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(id)
          }}
          disabled={!hasBalance || loadingPrices}
        >
          {loadingPrices ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              {t('templateCard.loading')}
            </>
          ) : !hasBalance ? (
            <>
              <AlertCircle className="w-4 h-4 mr-2" />
              {t('templateCard.insufficientBalance')}
            </>
          ) : (
            <>
              {t('templateCard.useTemplate')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}