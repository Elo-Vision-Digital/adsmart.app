/**
 * Configuração dos Templates do Looker Studio
 *
 * Cada template tem um ID único do Looker Studio que será usado
 * para clonar e criar o relatório personalizado do usuário
 */

export interface LookerStudioTemplate {
  id: string
  lookerStudioId: string // ID do template no Looker Studio
  dataSourceType: 'google_ads' | 'meta_ads'
  name: string
  description: string
}

export const LOOKER_STUDIO_TEMPLATES: Record<string, LookerStudioTemplate> = {
  google_lancamento: {
    id: 'google_lancamento',
    lookerStudioId: 'YOUR_GOOGLE_ADS_LAUNCH_TEMPLATE_ID', // Substituir pelo ID real
    dataSourceType: 'google_ads',
    name: 'Dashboard Google Ads - Lançamento',
    description: 'Template otimizado para campanhas de lançamento no Google Ads',
  },

  meta_lancamento: {
    id: 'meta_lancamento',
    lookerStudioId: 'YOUR_META_ADS_LAUNCH_TEMPLATE_ID', // Substituir pelo ID real
    dataSourceType: 'meta_ads',
    name: 'Dashboard Meta Ads - Lançamento',
    description: 'Template otimizado para campanhas de lançamento no Meta Ads',
  },

  google_negocio_local: {
    id: 'google_negocio_local',
    lookerStudioId: 'YOUR_GOOGLE_ADS_LOCAL_TEMPLATE_ID', // Substituir pelo ID real
    dataSourceType: 'google_ads',
    name: 'Dashboard Google Ads - Negócios Locais',
    description: 'Template especializado para negócios locais no Google Ads',
  },

  meta_negocio_local: {
    id: 'meta_negocio_local',
    lookerStudioId: 'YOUR_META_ADS_LOCAL_TEMPLATE_ID', // Substituir pelo ID real
    dataSourceType: 'meta_ads',
    name: 'Dashboard Meta Ads - Negócios Locais',
    description: 'Template especializado para negócios locais no Meta Ads',
  },
}

/**
 * Função helper para obter o template por ID
 */
export function getLookerStudioTemplate(templateId: string): LookerStudioTemplate | undefined {
  return LOOKER_STUDIO_TEMPLATES[templateId]
}

/**
 * URLs base do Looker Studio
 */
export const LOOKER_STUDIO_URLS = {
  base: 'https://lookerstudio.google.com',
  embed: 'https://lookerstudio.google.com/embed/reporting',
  api: 'https://lookerstudio.googleapis.com/v1',
}

/**
 * Configurações de compartilhamento padrão
 */
export const LOOKER_STUDIO_SHARING = {
  defaultAccess: 'viewer', // visualizador
  linkSharing: true,
  commentAccess: false,
  downloadAccess: true,
}
