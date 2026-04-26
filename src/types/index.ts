// Tipos principais do sistema

export interface User {
  id: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: Date
  updatedAt: Date
}

// Source of truth: src/schemas/userWallet.ts (Zod schema).
export type { UserWallet } from '@/schemas/userWallet'

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

// Source of truth: src/schemas/adAccount.ts (Zod schema).
export type { AdAccount } from '@/schemas/adAccount'

// Source of truth: src/schemas/campaign.ts (Zod schema).
export type { Campaign } from '@/schemas/campaign'

// Source of truth: src/schemas/report.ts (Zod schema). Reexported here so
// existing `import type { Report } from '@/types'` callers continue working.
export type { Report } from '@/schemas/report'

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
