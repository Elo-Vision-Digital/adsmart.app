import * as z from 'zod'
import { zTimestamp } from '../firestore'

export const ProductPriceCategorySchema = z.enum(['google', 'meta'])
export type ProductPriceCategory = z.infer<typeof ProductPriceCategorySchema>

export const ProductPriceTypeSchema = z.enum(['lancamento', 'negocio_local'])
export type ProductPriceType = z.infer<typeof ProductPriceTypeSchema>

// Source of truth for `productPrices/{priceId}` documents. Price is BRL in
// reais (float, two decimals) for backwards-compat with the existing
// admin UI; the wallet/transactions side already uses centavos (int).
// See ADR-016 for the centralization rationale.
//
// Redesign (MN-1): decisão do usuário 2026-05-19 — 1 crédito = R$ 5,00 fixo;
// 1 plataforma selecionada = 1 crédito (independente de category/type).
// `creditsPerReport` é o campo novo que vai substituir `price` na lógica
// de cobrança. Por ora mantemos `price` para o admin UI atual e adicionamos
// `creditsPerReport` opcional para permitir transição faseada.
export const ProductPriceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  // Legacy — preço em BRL (reais, float). Mantido por compat com o admin UI
  // atual. Após Fase 3.5 (novo fluxo de relatório), `creditsPerReport` é a
  // fonte da verdade para cobrança e este campo perde uso.
  price: z.number().nonnegative(),
  category: ProductPriceCategorySchema,
  type: ProductPriceTypeSchema,
  isActive: z.boolean(),
  updatedAt: zTimestamp(),
  updatedBy: z.string().min(1),

  // === Campos novos do redesign (FOUND-1 / MN-1) ===
  // Custo do relatório por plataforma em créditos. Default 1 quando vier
  // (decisão fixa do usuário no roadmap inicial). Mantido configurável
  // para permitir variação futura (ex: tipos premium custarem mais).
  creditsPerReport: z.number().int().positive().optional(),
})
export type ProductPrice = z.infer<typeof ProductPriceSchema>

// Shape accepted from clients when admins post a price update. The server
// stamps `updatedAt` and `updatedBy` itself; clients must not control them.
// `creditsPerReport` é opcional aqui também — admin pode preencher quando
// quiser variar o custo de um tipo específico.
export const UpdateProductPriceInputSchema = ProductPriceSchema.pick({
  id: true,
  name: true,
  description: true,
  price: true,
  category: true,
  type: true,
  isActive: true,
  creditsPerReport: true,
})
export type UpdateProductPriceInput = z.infer<typeof UpdateProductPriceInputSchema>

export const UpdateProductPricesInputSchema = z.object({
  prices: z.array(UpdateProductPriceInputSchema).min(1).max(50),
})
export type UpdateProductPricesInput = z.infer<typeof UpdateProductPricesInputSchema>

// Canonical catalog seeded by `initializeDefaultPrices` and returned by
// `getPublicProductPrices` / `getProductPrices` when Firestore is empty.
export const DEFAULT_PRODUCT_PRICES: ReadonlyArray<UpdateProductPriceInput> = [
  {
    id: 'google_lancamento',
    name: 'Dashboard Google Ads - Lançamento',
    description: 'Dashboard para campanhas de lançamento no Google Ads',
    price: 10.0,
    category: 'google',
    type: 'lancamento',
    isActive: true,
  },
  {
    id: 'meta_lancamento',
    name: 'Dashboard Meta Ads - Lançamento',
    description: 'Dashboard para campanhas de lançamento no Meta Ads',
    price: 10.0,
    category: 'meta',
    type: 'lancamento',
    isActive: true,
  },
  {
    id: 'google_negocio_local',
    name: 'Dashboard Google Ads - Negócios Locais',
    description: 'Dashboard para negócios locais no Google Ads',
    price: 5.0,
    category: 'google',
    type: 'negocio_local',
    isActive: true,
  },
  {
    id: 'meta_negocio_local',
    name: 'Dashboard Meta Ads - Negócios Locais',
    description: 'Dashboard para negócios locais no Meta Ads',
    price: 5.0,
    category: 'meta',
    type: 'negocio_local',
    isActive: true,
  },
]
