import { addDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Campaign } from '@/types'

export const mockGoogleCampaigns: Omit<Campaign, 'id'>[] = [
  // Campanhas da conta principal
  {
    accountId: '123-456-7890',
    platform: 'google_ads',
    campaignId: 'campaign_001',
    campaignName: 'Brand - Pesquisa',
    status: 'active',
    budget: 5000,
    spend: 3421.5,
    impressions: 145320,
    clicks: 8934,
    lastSyncAt: new Date(),
  },
  {
    accountId: '123-456-7890',
    platform: 'google_ads',
    campaignId: 'campaign_002',
    campaignName: 'Shopping - Produtos Premium',
    status: 'active',
    budget: 8000,
    spend: 6234.8,
    impressions: 234567,
    clicks: 12453,
    lastSyncAt: new Date(),
  },
  {
    accountId: '123-456-7890',
    platform: 'google_ads',
    campaignId: 'campaign_003',
    campaignName: 'Display - Remarketing',
    status: 'paused',
    budget: 3000,
    spend: 2890.0,
    impressions: 567890,
    clicks: 4567,
    lastSyncAt: new Date(),
  },
  // Campanhas da conta sazonal
  {
    accountId: '098-765-4321',
    platform: 'google_ads',
    campaignId: 'campaign_004',
    campaignName: 'Black Friday 2023',
    status: 'ended',
    budget: 15000,
    spend: 14876.9,
    impressions: 890123,
    clicks: 45678,
    lastSyncAt: new Date(),
  },
  {
    accountId: '098-765-4321',
    platform: 'google_ads',
    campaignId: 'campaign_005',
    campaignName: 'Natal 2023 - Performance Max',
    status: 'active',
    budget: 10000,
    spend: 4532.1,
    impressions: 456789,
    clicks: 23456,
    lastSyncAt: new Date(),
  },
]

export const mockMetaCampaigns: Omit<Campaign, 'id'>[] = [
  // Campanhas Facebook
  {
    accountId: 'act_987654321',
    platform: 'meta_ads',
    campaignId: 'fb_campaign_001',
    campaignName: 'Tráfego - Conversões Site',
    status: 'active',
    budget: 6000,
    spend: 4567.3,
    impressions: 678901,
    clicks: 34567,
    lastSyncAt: new Date(),
  },
  {
    accountId: 'act_987654321',
    platform: 'meta_ads',
    campaignId: 'fb_campaign_002',
    campaignName: 'Engajamento - Instagram',
    status: 'active',
    budget: 3500,
    spend: 2345.6,
    impressions: 456789,
    clicks: 23456,
    lastSyncAt: new Date(),
  },
  {
    accountId: 'act_987654321',
    platform: 'meta_ads',
    campaignId: 'fb_campaign_003',
    campaignName: 'Video Views - Stories',
    status: 'paused',
    budget: 2000,
    spend: 1890.4,
    impressions: 345678,
    clicks: 12345,
    lastSyncAt: new Date(),
  },
  // Campanhas Loja Virtual
  {
    accountId: 'act_123456789',
    platform: 'meta_ads',
    campaignId: 'fb_campaign_004',
    campaignName: 'Catálogo - Dynamic Ads',
    status: 'active',
    budget: 12000,
    spend: 8901.2,
    impressions: 1234567,
    clicks: 56789,
    lastSyncAt: new Date(),
  },
  {
    accountId: 'act_123456789',
    platform: 'meta_ads',
    campaignId: 'fb_campaign_005',
    campaignName: 'Lookalike - Compradores',
    status: 'active',
    budget: 7500,
    spend: 5432.1,
    impressions: 890123,
    clicks: 45678,
    lastSyncAt: new Date(),
  },
]

export async function addMockCampaigns(userId: string) {
  try {
    // Buscar as contas do usuário
    const accountsRef = collection(db, 'users', userId, 'adAccounts')
    const accountsSnapshot = await getDocs(accountsRef)

    if (accountsSnapshot.empty) {
      console.log('Nenhuma conta encontrada')
      return
    }

    // Para cada conta, adicionar campanhas correspondentes
    for (const accountDoc of accountsSnapshot.docs) {
      const account = accountDoc.data()
      const campaignsRef = collection(db, 'users', userId, 'campaigns')

      // Verificar se já existem campanhas para esta conta
      const existingCampaigns = await getDocs(
        query(campaignsRef, where('accountId', '==', account.accountId))
      )

      if (!existingCampaigns.empty) continue

      // Adicionar campanhas baseadas na plataforma e accountId
      let campaignsToAdd: Omit<Campaign, 'id'>[] = []

      if (account.platform === 'google_ads') {
        campaignsToAdd = mockGoogleCampaigns.filter((c) => c.accountId === account.accountId)
      } else if (account.platform === 'meta_ads') {
        campaignsToAdd = mockMetaCampaigns.filter((c) => c.accountId === account.accountId)
      }

      for (const campaign of campaignsToAdd) {
        await addDoc(campaignsRef, campaign)
      }
    }

    console.log('Campanhas mock adicionadas com sucesso!')
  } catch (error) {
    console.error('Erro ao adicionar campanhas mock:', error)
  }
}
