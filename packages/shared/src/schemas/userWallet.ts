import * as z from 'zod'
import { zTimestamp } from '../firestore'

// users/{uid}/wallet/current — saldo do usuário.
//
// Estado atual (legacy): `balance` em centavos BRL + `currency: 'BRL'`.
// Estado alvo  (MN-1): saldo em créditos (1 crédito = R$ 5,00
// fixo, 1 plataforma por relatório = 1 crédito). A transição é faseada
// para não quebrar o app existente:
//
//   - Esta fase (Fase -1): adiciona `creditsBalance?` opcional. Wallet
//     atuais continuam apenas com `balance` (BRL centavos).
//   - Fase 3.5 (novo fluxo): `createReport` callable lê/escreve em
//     `creditsBalance` em vez de `balance`. Migration on-the-fly via
//     converter no client/server.
//   - Após Fase 4 (validação): considerar tornar `creditsBalance` obrigatório
//     e descontinuar `balance` BRL.
//
// firestore.rules: cliente NUNCA escreve aqui — só Admin SDK
// (Phase 3 baseline, hook check-no-client-wallet-write.sh).

export const UserWalletSchema = z.object({
  id: z.string(),
  // Legacy: saldo em centavos BRL. Será descontinuado na Fase 3.5+.
  balance: z.number().int().nonnegative(),
  // Legacy: 'BRL' literal. Quando creditsBalance virar canônico, este
  // campo perde uso. Por ora mantemos por compatibilidade total.
  currency: z.literal('BRL'),
  updatedAt: zTimestamp(),

  // === Campos novos  (FOUND-1) ===
  // Saldo em créditos — fonte da verdade no novo fluxo (MN-1).
  // Opcional aqui para suportar wallets pré-migração; após Fase 3.5
  // todo callable de wallet deve preencher.
  creditsBalance: z.number().int().nonnegative().optional(),
})
export type UserWallet = z.infer<typeof UserWalletSchema>
