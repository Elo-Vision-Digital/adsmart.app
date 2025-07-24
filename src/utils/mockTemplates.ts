import type { ReportTemplate } from '@/types'

export const mockTemplates: Omit<ReportTemplate, 'id' | 'createdAt'>[] = [
  {
    name: 'Relatório Completo Google Ads',
    platform: 'google_ads',
    lookerStudioTemplateId: 'template_google_001',
    description: 'Dashboard completo com análise detalhada de campanhas Google Ads',
    previewImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    features: [
      'Visão geral de performance',
      'Análise por campanha',
      'Métricas de conversão',
      'Análise de palavras-chave',
      'Gráficos de tendência',
      'ROI e ROAS detalhado'
    ],
    isActive: true
  },
  {
    name: 'Relatório Performance Meta Ads',
    platform: 'meta_ads',
    lookerStudioTemplateId: 'template_meta_001',
    description: 'Dashboard otimizado para análise de campanhas Facebook e Instagram',
    previewImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    features: [
      'Métricas de engajamento',
      'Análise por formato de anúncio',
      'Performance por plataforma (FB/IG)',
      'Análise demográfica',
      'Funil de conversão',
      'Comparativo de campanhas'
    ],
    isActive: true
  }
]