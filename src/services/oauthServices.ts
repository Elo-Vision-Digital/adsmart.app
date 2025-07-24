import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase/config'

// Tipos para as respostas
interface OAuthUrlResponse {
  authUrl: string
  state: string
}

interface OAuthCallbackResponse {
  success: boolean
  accountsConnected: number
  accounts: Array<{
    id: string
    name: string
  }>
}

interface CampaignsResponse {
  success: boolean
  campaigns: Array<{
    id: string
    name: string
    status: string
    budget: number
    spend: number
  }>
}

class OAuthService {
  // Google Ads OAuth
  async getGoogleAdsAuthUrl(): Promise<string> {
    try {
      console.log('Chamando Cloud Function getGoogleAdsAuthUrl...')
      const getAuthUrl = httpsCallable<void, OAuthUrlResponse>(functions, 'getGoogleAdsAuthUrl')
      const result = await getAuthUrl()
      console.log('URL OAuth recebida:', result.data.authUrl)
      return result.data.authUrl
    } catch (error: any) {
      console.error('Erro ao obter URL OAuth Google Ads:', error)
      
      // Mensagem mais detalhada do erro
      if (error.code === 'functions/not-found') {
        throw new Error('Função getGoogleAdsAuthUrl não encontrada. Verifique se foi deployada corretamente.')
      } else if (error.code === 'unauthenticated') {
        throw new Error('Usuário não autenticado. Faça login novamente.')
      } else if (error.message?.includes('CORS')) {
        throw new Error('Erro de CORS. Verifique a configuração do Firebase Functions.')
      }
      
      throw new Error(error.message || 'Erro ao conectar com Google Ads')
    }
  }

  async handleGoogleAdsCallback(code: string, state: string): Promise<OAuthCallbackResponse> {
    try {
      console.log('Processando callback Google Ads...')
      const handleCallback = httpsCallable<{ code: string; state: string }, OAuthCallbackResponse>(
        functions, 
        'handleGoogleAdsCallback'
      )
      const result = await handleCallback({ code, state })
      console.log('Callback processado:', result.data)
      return result.data
    } catch (error: any) {
      console.error('Erro ao processar callback Google Ads:', error)
      throw new Error(error.message || 'Erro ao processar autorização')
    }
  }

  async getGoogleAdsCampaigns(accountId: string): Promise<CampaignsResponse> {
    try {
      const getCampaigns = httpsCallable<{ accountId: string }, CampaignsResponse>(
        functions,
        'getGoogleAdsCampaigns'
      )
      const result = await getCampaigns({ accountId })
      return result.data
    } catch (error: any) {
      console.error('Erro ao buscar campanhas Google Ads:', error)
      throw new Error(error.message || 'Erro ao buscar campanhas')
    }
  }

  // Meta Ads OAuth
  async getMetaAdsAuthUrl(): Promise<string> {
    try {
      console.log('Chamando Cloud Function getMetaAdsAuthUrl...')
      const getAuthUrl = httpsCallable<void, OAuthUrlResponse>(functions, 'getMetaAdsAuthUrl')
      const result = await getAuthUrl()
      console.log('URL OAuth Meta recebida:', result.data.authUrl)
      return result.data.authUrl
    } catch (error: any) {
      console.error('Erro ao obter URL OAuth Meta Ads:', error)
      
      // Mensagem mais detalhada do erro
      if (error.code === 'functions/not-found') {
        throw new Error('Função getMetaAdsAuthUrl não encontrada. Verifique se foi deployada corretamente.')
      } else if (error.code === 'unauthenticated') {
        throw new Error('Usuário não autenticado. Faça login novamente.')
      } else if (error.message?.includes('CORS')) {
        throw new Error('Erro de CORS. Verifique a configuração do Firebase Functions.')
      }
      
      throw new Error(error.message || 'Erro ao conectar com Meta Ads')
    }
  }

  async handleMetaAdsCallback(code: string, state: string): Promise<OAuthCallbackResponse> {
    try {
      console.log('Processando callback Meta Ads...')
      const handleCallback = httpsCallable<{ code: string; state: string }, OAuthCallbackResponse>(
        functions,
        'handleMetaAdsCallback'
      )
      const result = await handleCallback({ code, state })
      console.log('Callback processado:', result.data)
      return result.data
    } catch (error: any) {
      console.error('Erro ao processar callback Meta Ads:', error)
      throw new Error(error.message || 'Erro ao processar autorização')
    }
  }

  async getMetaAdsCampaigns(accountId: string): Promise<CampaignsResponse> {
    try {
      const getCampaigns = httpsCallable<{ accountId: string }, CampaignsResponse>(
        functions,
        'getMetaAdsCampaigns'
      )
      const result = await getCampaigns({ accountId })
      return result.data
    } catch (error: any) {
      console.error('Erro ao buscar campanhas Meta Ads:', error)
      throw new Error(error.message || 'Erro ao buscar campanhas')
    }
  }
}

export const oauthService = new OAuthService()