import * as z from 'zod'
import { zTimestamp } from '../firestore'

// Observabilidade de chamadas LLM (INF-1 , detalhes em
// docs/research/02-llm-strategy.md §5). Toda chamada para Anthropic ou
// DeepSeek registra um documento em `llmCalls/{callId}` (top-level
// collection, write-only via Admin SDK).
//
// Propósitos:
//   1. Custo agregado por usuário/feature/modelo (input para precificação
//      futura de pacotes de crédito — GATE-2 quando Stripe entrar)
//   2. Debug de respostas ruins (correlation com promptVersion)
//   3. Alerta de orçamento (Cloud Function agendada lê esta coleção)
//
// firestore.rules: nega TODA leitura/escrita do cliente. Acesso só via
// Admin SDK em Cloud Functions.

export const LLMProviderSchema = z.enum(['anthropic', 'deepseek'])
export type LLMProvider = z.infer<typeof LLMProviderSchema>

// Tarefas conhecidas que disparam LLM calls. Lista cresce conforme novas
// features chegam.
export const LLMTaskSchema = z.enum([
  'analyze_report',       // analyzeReportData — geração de insight por plataforma
  'classify',             // tarefas de classificação (ex: validar tipo de negócio)
  'summarize',            // sumarização de período / dados longos
  'parse_data',           // parsing/normalização de dados de API externa
  'generate_copy',        // geração de copy/texto user-facing
  'extract_metrics',      // extração estruturada de métricas
])
export type LLMTask = z.infer<typeof LLMTaskSchema>

export const LLMCallSchema = z.object({
  // ID Firestore (auto-gerado ou definido pela function).
  id: z.string().min(1),
  // Provider que respondeu.
  provider: LLMProviderSchema,
  // Modelo exato (ex: 'claude-sonnet-4-6', 'claude-haiku-4-5',
  // 'deepseek-v4-flash'). String livre para permitir versionamento sem
  // recriar enum.
  model: z.string().min(1).max(64),
  // Tarefa categorizada (enum acima).
  task: LLMTaskSchema,
  // Usuário que originou (se aplicável — scheduled jobs podem omitir).
  userId: z.string().optional(),
  // Recurso associado (ex: reportId, shareId) — opcional.
  resourceId: z.string().optional(),
  // Versão do prompt usado (ex: 'analyze_report-v1.2'). Permite A/B testing
  // e correlation com qualidade observada.
  promptVersion: z.string().min(1).max(48),
  // Tokens consumidos. Cache fields = tokens cobrados com desconto de
  // prompt caching (Anthropic 0.10× / DeepSeek prefix caching).
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  cachedInputTokens: z.number().int().nonnegative().default(0),
  // Custo total em USD desta chamada (calculado pela function antes do write).
  costUsd: z.number().nonnegative(),
  // Latência em milissegundos (entre dispatch e response).
  latencyMs: z.number().int().nonnegative(),
  // Se a chamada falhou ou foi parcial, registrar motivo.
  errorMessage: z.string().max(500).optional(),
  // Timestamp de quando a chamada foi feita.
  calledAt: zTimestamp(),
})
export type LLMCall = z.infer<typeof LLMCallSchema>
