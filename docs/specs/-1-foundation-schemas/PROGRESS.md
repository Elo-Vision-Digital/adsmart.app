# Sprint -1 — Foundation Schemas — PROGRESS

**Branch**: `feat/redesign-foundation-schemas`
**Started**: 2026-05-19
**Status**: in_progress

## Scope (from EXECUTION-CHECKLIST.md Fase -1)

Refactor + criar schemas em `packages/shared/src/schemas/` + documentar API contracts + Data Model. **Aditivo apenas** nesta sprint — remoção de campos legacy (lookerStudioUrl, payerName, payerCpf) fica para Fase 0.5 quando refatoramos os callers.

## Strategy

- Schemas NOVOS primeiro (não-breaking)
- Schemas EXISTENTES refatorados de forma ADITIVA (adiciona campos opcionais, não remove)
- `bun run test` deve passar em `packages/shared/` após cada commit
- `bun run typecheck` em `web` + `functions` não pode regredir

## Log

### 2026-05-19 — Session 1: setup + new schemas

- [x] Branch criada: `feat/redesign-foundation-schemas`
- [x] Sprint folder criada em `docs/specs/-1-foundation-schemas/`
- [x] PROGRESS.md criado (este arquivo)
- [ ] Commit 1: docs (redesign + research + execution-checklist + sprint PROGRESS provisional)
- [ ] Schemas novos (6 arquivos novos):
  - [ ] `businessType.ts` + test
  - [ ] `processedRequest.ts` + test
  - [ ] `publicReportShare.ts` + test
  - [ ] `aiReportInsight.ts` + test
  - [ ] `llmCall.ts` + test
  - [ ] `reportPlatformData.ts` + test
- [ ] Update `index.ts` re-exports
- [ ] Refactor aditivo (4 schemas existentes):
  - [ ] `report.ts` — adicionar `platforms[]`, `businessType`, `accountIds`, `nextRefreshAt`, `lastRefreshedAt`, `shareIds[]`
  - [ ] `transaction.ts` — adicionar campos opcionais Stripe (sem implementar lógica)
  - [ ] `userWallet.ts` — manter compat, sem mudanças destrutivas
  - [ ] `productPrice.ts` — adicionar `creditsPerReport`, `pricePerCredit`
- [ ] Documentar `docs/API-CONTRACTS.md` (refactor completo)
- [ ] Documentar `docs/DATA-MODEL.md` (refactor completo)
- [ ] `bun run test` em `packages/shared/`
- [ ] `bun run typecheck` em `web` + `functions`

## Decisions taken

- **Não duplicar `Platform` schema** — reusar `AdPlatformSchema` existente em `adAccount.ts`
- **Refactor aditivo apenas** — preservar campos legacy (lookerStudioUrl, payerName, payerCpf, templateId) nesta fase; remover na Fase 0.5 junto com cleanup textual
- **`stripePaymentIntentId` adicionado como campo opcional** em `transaction.ts` desde já para preparar terreno (sem código de pagamento ainda)

## Blockers / risks

- Remover campos hoje quebra `src/pages/ReportSuccessPage.tsx` e outros — por isso aditivo
- `bun run typecheck` precisa passar — schemas novos não devem quebrar callers existentes

## Next steps

Após esta sprint terminar:
1. Abrir PR para `develop`
2. Revisar via code-reviewer subagent
3. Mergear
4. Iniciar **Fase 0a** (foundation harness — agents + templates + scripts)
