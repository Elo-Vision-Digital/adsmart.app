// Tipos principais do sistema

export interface User {
  id: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserWallet {
  userId: string
  balance: number // Saldo em centavos (500 = R$ 5,00)
  currency: 'BRL'
  updatedAt: Date
}

export interface Transaction {
  id: string
  userId: string
  type: 'credit' | 'debit'
  amount: number // Em centavos
  description: string
  reference?: string // ID do relatório se for débito
  status: 'pending' | 'completed' | 'failed'
  createdAt: Date
}

export interface AdAccount {
  id: string
  userId: string
  platform: 'google_ads' | 'meta_ads'
  accountId: string
  accountName: string
  email?: string // Email associado à conta
  isActive: boolean
  lastSyncAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Campaign {
  id: string
  accountId: string // ID da AdAccount
  platform: 'google_ads' | 'meta_ads'
  campaignId: string
  campaignName: string
  status: 'active' | 'paused' | 'ended'
  budget?: number
  spend?: number
  impressions?: number
  clicks?: number
  lastSyncAt: Date
}

export interface Report {
  id: string
  userId: string
  type: 'google_ads' | 'facebook_ads'
  templateId: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  campaignIds?: string[] // IDs das campanhas selecionadas
  allCampaigns: boolean // Se true, pega todas as campanhas
  dateRange: {
    startDate: string
    endDate: string
  }
  lookerStudioUrl?: string // URL do relatório gerado
  cost: number // Custo em centavos (500 = R$ 5,00)
  paidAt?: Date
  createdAt: Date
  completedAt?: Date
  error?: string
}

export interface ReportTemplate {
  id: string
  name: string
  platform: 'google_ads' | 'meta_ads'
  lookerStudioTemplateId: string
  description: string
  previewImageUrl?: string
  features: string[] // Lista de features do template
  isActive: boolean
  createdAt: Date
}
