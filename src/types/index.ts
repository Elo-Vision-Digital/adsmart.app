// Tipos principais do sistema

export interface User {
  id: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: Date
  updatedAt: Date
}

// Source of truth: src/schemas/adAccount.ts (Zod schema).
// Source of truth: src/schemas/campaign.ts (Zod schema).
// Source of truth: src/schemas/report.ts (Zod schema). Reexported here so
// existing `import type { Report } from '@/types'` callers continue working.
// Source of truth: src/schemas/transaction.ts (Zod schema).
// Source of truth: src/schemas/userWallet.ts (Zod schema).
export type { AdAccount, Campaign, Report, Transaction, UserWallet } from '@adsmart/shared'

// `ReportTemplate` interface removed in C6.5 — the `reportTemplates/{id}`
// Firestore collection had zero readers/writers in app code; templates are
// served from a hardcoded array in src/components/templates/templateData.ts.
// See docs/DATA-MODEL.md for the dead-code note and the post-Phase-D cleanup task.
