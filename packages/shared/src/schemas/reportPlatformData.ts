import * as z from 'zod'
import { zTimestamp } from '../firestore'
import { AdPlatformSchema } from './adAccount'

// Dados específicos por plataforma dentro de um relatório (FLOW-6 do
// ). Armazenado em subcoleção
// `users/{uid}/reports/{reportId}/platforms/{platform}` para manter o
// doc principal de `report` pequeno (< 100KB) e queries de lista rápidas.
//
// O doc principal do `report` apenas referencia quais plataformas estão
// presentes via `platforms[]`. Quando o usuário troca de tab no Report
// Detail (FLOW-6), o frontend faz fetch on-demand do platform data.
//
// Refresh strategy (INF-2): `lastRefreshedAt` no doc principal serve como
// pista; cada platform doc tem seu próprio fingerprint para detectar
// mudanças.

// KPI principal de uma campanha (subset do que vem das APIs Google Ads /
// Meta Marketing).
export const CampaignBreakdownSchema = z.object({
  campaignId: z.string().min(1),
  campaignName: z.string().min(1),
  // Valor investido (em BRL — fonte original mantida em moeda local).
  invested: z.number().nonnegative(),
  revenue: z.number().nonnegative().optional(),
  roas: z.number().optional(),
  cpa: z.number().nonnegative().optional(),
  clicks: z.number().int().nonnegative().optional(),
  impressions: z.number().int().nonnegative().optional(),
  conversions: z.number().nonnegative().optional(),
  ctr: z.number().nonnegative().optional(),
})
export type CampaignBreakdown = z.infer<typeof CampaignBreakdownSchema>

// Ponto de uma série temporal (gráficos de área / linha).
export const TimeSeriesPointSchema = z.object({
  // ISO date (YYYY-MM-DD).
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number(),
})
export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>

// KPIs agregados que aparecem no grid principal do relatório.
export const PlatformKPIsSchema = z.object({
  invested: z.number().nonnegative(),
  revenue: z.number().nonnegative().optional(),
  roas: z.number().optional(),
  cpa: z.number().nonnegative().optional(),
  clicks: z.number().int().nonnegative().optional(),
  impressions: z.number().int().nonnegative().optional(),
  conversions: z.number().nonnegative().optional(),
  ctr: z.number().nonnegative().optional(),
})
export type PlatformKPIs = z.infer<typeof PlatformKPIsSchema>

// Documento completo de uma plataforma dentro do relatório.
export const ReportPlatformDataSchema = z.object({
  // Identificador = nome da plataforma (google_ads, meta_ads).
  id: AdPlatformSchema,
  platform: AdPlatformSchema,
  // Conta de anúncios usada para gerar (referência ao AdAccount.accountId).
  accountId: z.string().min(1),
  // Campanhas selecionadas pelo usuário no Passo 2.
  campaignIds: z.array(z.string().min(1)).min(1),
  // KPIs agregados (mostrados em destaque).
  kpis: PlatformKPIsSchema,
  // Série temporal principal (geralmente revenue ou investimento) usada
  // no big chart do Report Detail.
  revenueOverTime: z.array(TimeSeriesPointSchema).default([]),
  // Breakdown por campanha (tabela do Report Detail).
  campaigns: z.array(CampaignBreakdownSchema).default([]),
  // Última vez que os dados desta plataforma foram buscados nas APIs.
  fetchedAt: zTimestamp(),
  // Fingerprint dos dados (hash do payload bruto). Usado para detectar
  // se refresh trouxe mudanças e justificar nova LLM call.
  dataFingerprint: z.string().min(8).max(128).optional(),
})
export type ReportPlatformData = z.infer<typeof ReportPlatformDataSchema>
