// Tipo para os dados do template
export interface TemplateData {
  id: string
  platform: 'google_ads' | 'meta_ads'
  category: 'google' | 'meta'
  type: 'lancamento' | 'negocio_local'
  imageUrl: string
  features: string[]
}

// Dados centralizados de todos os templates
export const availableTemplates: TemplateData[] = [
  {
    id: 'google_lancamento',
    platform: 'google_ads',
    category: 'google',
    type: 'lancamento',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    features: [
      'Análise de conversões e ROI',
      'Métricas de engajamento detalhadas',
      'Comparativo de períodos',
      'Insights automáticos de performance'
    ]
  },
  {
    id: 'meta_lancamento',
    platform: 'meta_ads',
    category: 'meta',
    type: 'lancamento',
    imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
    features: [
      'Análise de público-alvo',
      'Performance por formato de anúncio',
      'Funil de conversão detalhado',
      'Otimizações sugeridas'
    ]
  },
  {
    id: 'google_negocio_local',
    platform: 'google_ads',
    category: 'google',
    type: 'negocio_local',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
    features: [
      'Análise geográfica de conversões',
      'Performance por localização',
      'Horários de pico de conversão',
      'ROI por região'
    ]
  },
  {
    id: 'meta_negocio_local',
    platform: 'meta_ads',
    category: 'meta',
    type: 'negocio_local',
    imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
    features: [
      'Alcance por região',
      'Engajamento local',
      'Análise demográfica detalhada',
      'Custo por lead local'
    ]
  }
]

// Função helper para buscar template por ID
export const getTemplateById = (templateId: string): TemplateData | undefined => {
  return availableTemplates.find(template => template.id === templateId)
}

// Função helper para filtrar templates por categoria
export const getTemplatesByCategory = (category: 'google' | 'meta'): TemplateData[] => {
  return availableTemplates.filter(template => template.category === category)
}

// Função helper para filtrar templates por tipo
export const getTemplatesByType = (type: 'lancamento' | 'negocio_local'): TemplateData[] => {
  return availableTemplates.filter(template => template.type === type)
}