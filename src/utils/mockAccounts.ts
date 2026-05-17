import { addDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { AdAccount } from '@/types'
import { addMockCampaigns } from './mockCampaigns'

type SeedAdAccount = Omit<AdAccount, 'id' | 'createdAt' | 'updatedAt'>

export const mockGoogleAccounts: SeedAdAccount[] = [
  {
    platform: 'google_ads',
    accountId: '123-456-7890',
    accountName: 'Empresa ABC - Principal',
    email: 'marketing@empresaabc.com.br',
    currency: 'BRL',
    isActive: true,
    lastSyncAt: new Date('2024-01-15'),
  },
  {
    platform: 'google_ads',
    accountId: '098-765-4321',
    accountName: 'Empresa ABC - Campanhas Sazonais',
    email: 'marketing@empresaabc.com.br',
    currency: 'BRL',
    isActive: true,
    lastSyncAt: new Date('2024-01-14'),
  },
]

export const mockMetaAccounts: SeedAdAccount[] = [
  {
    platform: 'meta_ads',
    accountId: 'act_987654321',
    accountName: 'Empresa XYZ - Facebook Ads',
    email: 'social@empresaxyz.com.br',
    currency: 'BRL',
    isActive: true,
    lastSyncAt: new Date('2024-01-15'),
  },
  {
    platform: 'meta_ads',
    accountId: 'act_123456789',
    accountName: 'Loja Virtual Premium',
    email: 'ads@lojavirtual.com.br',
    currency: 'BRL',
    isActive: true,
    lastSyncAt: new Date('2024-01-13'),
  },
]

export async function addMockAccounts(userId: string) {
  try {
    const accountsRef = collection(db, 'users', userId, 'adAccounts')
    const q = query(accountsRef, where('platform', 'in', ['google_ads', 'meta_ads']))
    const existingAccounts = await getDocs(q)

    if (!existingAccounts.empty) {
      console.log('Contas mock já existem')
      return
    }

    for (const account of [...mockGoogleAccounts, ...mockMetaAccounts]) {
      await addDoc(accountsRef, {
        ...account,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    console.log('Contas mock adicionadas com sucesso!')

    await addMockCampaigns(userId)
  } catch (error) {
    console.error('Erro ao adicionar contas mock:', error)
  }
}
