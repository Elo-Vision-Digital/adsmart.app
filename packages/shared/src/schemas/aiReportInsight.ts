import * as z from 'zod'
import { zTimestamp } from '../firestore'

// Output estruturado da LLM (Anthropic Claude / DeepSeek combo — INF-1 do
// , detalhes em docs/research/02-llm-strategy.md) usado pela
// callable `analyzeReportData(reportId, businessType)`. A LLM gera este
// payload por plataforma do relatório; FLOW-6 renderiza in-app.
//
// Structured output é OBRIGATÓRIO (princípio ) — toda chamada
// LLM valida response contra este schema antes de salvar no Firestore.
// Se parse falhar, a chamada falha e dispara retry com prompt corrigido.
//
// Armazenado em `users/{uid}/reports/{reportId}/insights/{platform}`.

export const InsightSentimentSchema = z.enum(['positive', 'negative', 'neutral'])
export type InsightSentiment = z.infer<typeof InsightSentimentSchema>

export const InsightImpactSchema = z.enum(['high', 'medium', 'low'])
export type InsightImpact = z.infer<typeof InsightImpactSchema>

// Métrica em destaque na seção KPIs do relatório.
export const AIReportTopMetricSchema = z.object({
  // Key da métrica (ex: 'revenue', 'roas', 'cpa'). Usado pelo
  // visibleMetrics no share-link e renderização da UI.
  key: z.string().min(1).max(48),
  // Label localizado (LLM gera no idioma do usuário).
  label: z.string().min(1).max(80),
  // Valor numérico (formato BRL com vírgula é feito no frontend).
  value: z.number(),
  // Delta percentual vs período anterior. null = sem comparação possível.
  deltaPercent: z.number().nullable().optional(),
  // Sentimento: positive = bom; negative = ruim; neutral = sem julgamento.
  sentiment: InsightSentimentSchema.default('neutral'),
})
export type AIReportTopMetric = z.infer<typeof AIReportTopMetricSchema>

// Recomendação acionável gerada pela LLM.
export const AIReportRecommendationSchema = z.object({
  // Título curto (< 80 chars) — aparece em card de destaque.
  title: z.string().min(1).max(80),
  // Justificativa data-driven (1-3 frases).
  rationale: z.string().min(1).max(500),
  // Impacto estimado.
  impact: InsightImpactSchema.default('medium'),
})
export type AIReportRecommendation = z.infer<typeof AIReportRecommendationSchema>

// Payload completo do insight de uma plataforma.
export const AIReportInsightSchema = z.object({
  // Identificador do registro (geralmente platform name).
  id: z.string().min(1),
  // Resumo executivo do período analisado (3-5 frases).
  summary: z.string().min(20).max(800),
  // Top métricas em destaque (1-8 itens).
  topMetrics: z.array(AIReportTopMetricSchema).min(1).max(8),
  // Recomendações acionáveis (0-5 itens).
  recommendations: z.array(AIReportRecommendationSchema).max(5),
  // Versão do prompt que gerou (versionado em functions/src/ai/prompts/).
  promptVersion: z.string().min(1).max(32),
  // Modelo que gerou (ex: 'claude-sonnet-4-6', 'deepseek-v4-flash').
  model: z.string().min(1).max(64),
  // Timestamp de geração — usado para invalidar cache e mostrar
  // "atualizado há X" no UI.
  generatedAt: zTimestamp(),
})
export type AIReportInsight = z.infer<typeof AIReportInsightSchema>
