import * as z from 'zod'
import { zTimestamp } from '../firestore'

// Share-link público de um relatório gerado (SHARE-1/2/3 ).
//
// Top-level collection `publicReportShares/{shareId}` — não fica em
// users/{uid}/... porque rules em hierarquia exigiriam auth para chegar
// lá, e queremos leitura pública sem auth.
//
// Segurança vem do `shareId` ser imprevisível (UUID v4 = 122 bits de
// entropia). firestore.rules permite `allow get: if true` em get
// individual e `allow list: if false` (anti-enumeração). Detalhes em
// docs/research/04-share-link-patterns.md.
//
// `visibleMetrics` / `visibleSections` controlam o que aparece na página
// pública /r/:shareId — usuário (dono) configura no Report Detail antes
// de gerar o link.
//
// Snapshot dos dados renderizáveis fica em subcoleção
// `publicReportShares/{shareId}/snapshot/data` — mantém o link estável
// mesmo se o owner re-gerar o relatório.

export const PublicReportShareSchema = z.object({
  // UUID v4 — `crypto.randomUUID()` server-side.
  id: z.string().min(16).max(64),
  // Referência ao report original em users/{ownerId}/reports/{reportId}.
  reportId: z.string().min(1),
  // Dono do relatório.
  ownerId: z.string().min(1),
  // Métricas individuais marcadas visíveis (keys do snapshot).
  visibleMetrics: z.array(z.string().min(1)).default([]),
  // Seções inteiras marcadas visíveis (overview, chart, kpis, breakdown, insights).
  visibleSections: z.array(z.string().min(1)).default([]),
  // Contador de visualizações da página pública (incrementado via callable
  // rate-limited `recordShareView`).
  viewCount: z.number().int().nonnegative().default(0),
  // Se preenchido, o share foi revogado pelo owner — rule nega get após isso.
  revokedAt: zTimestamp().optional(),
  // Opcional — expira automaticamente após esta data. null = sem expiração.
  expiresAt: zTimestamp().optional(),
  createdAt: zTimestamp(),
})
export type PublicReportShare = z.infer<typeof PublicReportShareSchema>

// Payload aceito por `createReportShare` callable. ownerId/createdAt/viewCount
// são preenchidos server-side; revokedAt começa undefined.
export const CreateReportShareInputSchema = z.object({
  reportId: z.string().min(1),
  visibleMetrics: z.array(z.string().min(1)),
  visibleSections: z.array(z.string().min(1)),
  expiresAt: zTimestamp().optional(),
})
export type CreateReportShareInput = z.infer<typeof CreateReportShareInputSchema>
