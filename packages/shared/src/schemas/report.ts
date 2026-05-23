import * as z from 'zod'
import { zTimestamp } from '../firestore'
import { AdPlatformSchema } from './adAccount'
import { BusinessTypeSchema } from './businessType'

export const ReportTypeSchema = z.enum(['google_ads', 'meta_ads'])
export type ReportType = z.infer<typeof ReportTypeSchema>

export const ReportStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed'])
export type ReportStatus = z.infer<typeof ReportStatusSchema>

export const DateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
})
export type DateRange = z.infer<typeof DateRangeSchema>

export const ReportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: ReportTypeSchema,
  // templateId é o conceito antigo — será removido na Fase 0.5 do roadmap
  // quando refatorarmos os callers. Tornado optional para permitir os
  // primeiros writes de teste do novo fluxo (FLOW-3) sem template.
  templateId: z.string().optional(),
  name: z.string(),
  status: ReportStatusSchema,
  campaignIds: z.array(z.string()).optional(),
  allCampaigns: z.boolean().default(false),
  dateRange: DateRangeSchema.default({ startDate: '', endDate: '' }),
  cost: z.number().int().nonnegative().default(0),
  paidAt: zTimestamp().optional(),
  createdAt: zTimestamp(),
  completedAt: zTimestamp().optional(),
  error: z.string().optional(),

  // === Campos novos do redesign (FOUND-1 do roadmap) ===
  // FLOW-1: múltiplas plataformas em um único relatório.
  platforms: z.array(AdPlatformSchema).optional(),
  // FLOW-3: tipo de negócio direciona a análise da LLM.
  businessType: BusinessTypeSchema.optional(),
  // FLOW-2: conta de anúncios escolhida por plataforma. Chave = platform.
  accountIds: z.record(AdPlatformSchema, z.string()).optional(),
  // FLOW-1: custo computado por plataforma (1 crédito por plataforma).
  // Mantemos `cost` (acima) como total agregado.
  creditsByPlatform: z.record(AdPlatformSchema, z.number().int().positive()).optional(),
  // INF-2: refresh strategy (manual + auto).
  lastRefreshedAt: zTimestamp().optional(),
  nextAutoRefreshAt: zTimestamp().optional(),
  // SHARE-2: shares ativos deste relatório (referencia publicReportShares).
  shareIds: z.array(z.string().min(1)).optional(),
})
export type Report = z.infer<typeof ReportSchema>
