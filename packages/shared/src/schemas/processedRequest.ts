import * as z from 'zod'
import { zTimestamp } from '../firestore'

// Idempotency keys para callables mutativos (createReport, refreshReport,
// createReportShare, etc.). Cada callable que escreve dados aceita um
// `clientRequestId` opcional do cliente (UUID v4); a function checa
// `processedRequests/{clientRequestId}` em transação ANTES de executar
// — se já existe, retorna o resultado armazenado sem repetir efeito.
//
// Padrão de Harness Engineering (research/01 §1): combina idempotência
// com retries seguros.
//
// Top-level collection — não fica em users/{uid}/... porque webhooks
// externos (FUTURE Stripe §8) também usam essa coleção com event.id
// como key.
//
// Cliente NÃO escreve direto — só backend via Admin SDK (firestore.rules
// nega writes). Cliente só lê para verificar se request foi processado.

export const ProcessedRequestSourceSchema = z.enum([
  'callable',         // chamada de callable do cliente autenticado
  'stripe_webhook',   // FUTURE §8 — webhook Stripe
  'scheduled',        // refresh agendado via Cloud Scheduler
])
export type ProcessedRequestSource = z.infer<typeof ProcessedRequestSourceSchema>

export const ProcessedRequestSchema = z.object({
  // UUID v4 do cliente ou event.id de webhook externo.
  id: z.string().min(1).max(128),
  // Identifica qual callable/source processou.
  source: ProcessedRequestSourceSchema,
  // Nome da função (ex: 'createReport', 'refreshReport', 'stripeWebhook').
  handler: z.string().min(1).max(64),
  // UID do usuário que originou (vazio para webhooks/scheduled).
  userId: z.string().optional(),
  // Resultado armazenado para retorno em chamadas duplicadas.
  // Mantemos como unknown JSON-serializable; consumers fazem parse Zod
  // próprio do shape esperado.
  result: z.unknown().optional(),
  processedAt: zTimestamp(),
})
export type ProcessedRequest = z.infer<typeof ProcessedRequestSchema>
