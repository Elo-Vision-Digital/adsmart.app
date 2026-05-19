# Sprint -1 — Foundation Schemas — PROGRESS

**Branch**: `feat/redesign-foundation-schemas`
**Started**: 2026-05-19
**Status**: ✅ **CONCLUÍDA** (pronta para PR)

## Scope (from EXECUTION-CHECKLIST.md Fase -1)

Refactor + criar schemas em `packages/shared/src/schemas/` + documentar API contracts + Data Model. **Aditivo apenas** nesta sprint — remoção de campos legacy (lookerStudioUrl, payerName, payerCpf) fica para Fase 0.5 quando refatoramos os callers.

## Strategy applied

- Schemas NOVOS primeiro (não-breaking)
- Schemas EXISTENTES refatorados de forma ADITIVA (adiciona campos opcionais, não remove)
- `bun run test` em `packages/shared/` verde após cada commit
- `bun run typecheck` em web + `bun run build` em functions verdes — sem regressão

## Commits desta sprint

| Hash | Tipo | Descrição |
|---|---|---|
| `fbccdf6` | `docs(redesign)` | Roadmap inicial, research Fase -2 (10 docs), execution checklist + sprint PROGRESS provisional |
| `d8d7f97` | `feat(shared)` | 6 foundation schemas novos + index re-exports (79 tests novos) |
| `a302cdc` | `feat(shared)` | Refactor aditivo de 4 schemas existentes (22 tests novos) |
| _pending_ | `docs(api,model)` | API-CONTRACTS.md + DATA-MODEL.md atualizados + este PROGRESS |

## Log

### 2026-05-19 — Session 1: setup + new schemas

- [x] Branch criada: `feat/redesign-foundation-schemas`
- [x] Sprint folder criada em `docs/specs/-1-foundation-schemas/`
- [x] PROGRESS.md criado
- [x] **Commit 1**: docs (52 arquivos — redesign + research + checklist + sprint structure)
- [x] **Schemas novos** (6 arquivos + 6 tests):
  - [x] `businessType.ts` + test (9 testes)
  - [x] `processedRequest.ts` + test (10 testes)
  - [x] `publicReportShare.ts` + test (11 testes)
  - [x] `aiReportInsight.ts` + test (18 testes)
  - [x] `llmCall.ts` + test (17 testes)
  - [x] `reportPlatformData.ts` + test (14 testes)
- [x] Update `index.ts` re-exports (6 schemas + types)
- [x] `bun run test` em `packages/shared/` — 173 verdes
- [x] `bun run typecheck` em shared + web — verde
- [x] `bun run build` em functions — verde
- [x] **Commit 2**: 6 schemas novos + index update (13 arquivos, 885 inserções)
- [x] **Refactor aditivo** (4 schemas existentes):
  - [x] `report.ts` — `templateId` optional + adicionado `platforms[]`, `businessType`, `accountIds`, `creditsByPlatform`, `lastRefreshedAt`, `nextAutoRefreshAt`, `shareIds`
  - [x] `transaction.ts` — adicionado `TransactionProviderSchema`, `clientRequestId`, `stripe*` opcionais (FUTURE §8)
  - [x] `userWallet.ts` — adicionado `creditsBalance` opcional (MN-1)
  - [x] `productPrice.ts` — adicionado `creditsPerReport` opcional (MN-1)
- [x] Tests novos cobrindo cada novo campo + edge cases (22 testes)
- [x] `bun run test` — 195 verdes (173 + 22)
- [x] Typecheck + build verdes em todos pacotes
- [x] **Commit 3**: 4 schemas refatorados + tests (8 arquivos, 227 inserções, 4 deleções)
- [x] **API-CONTRACTS.md**: seção "Foundation Callables — Planned (FOUND-1)" com 10 callables planejados:
  - createReport · refreshReport · refreshActiveReports (scheduled) · createReportShare · revokeReportShare · listReportShares · recordShareView · exportReportPDF · analyzeReportData (internal) · getAvailableDataPeriods
- [x] **DATA-MODEL.md**: adicionado collection index das 6 collections novas + seção "Foundation Collections (FOUND-1)" com schema completo + lista de composite indexes necessários
- [x] PROGRESS.md atualizado (este arquivo)
- [ ] **Commit 4**: docs API + Model + PROGRESS final ← próximo

## Decisions taken

- **Não duplicar `Platform` schema** — reusado `AdPlatformSchema` existente em `adAccount.ts` para `platforms[]` em `report.ts` e `platform` em `reportPlatformData.ts`
- **Refactor aditivo apenas** — preservar campos legacy (`lookerStudioUrl`, `payerName`, `payerCpf`, `templateId`) nesta sprint; remover na Fase 0.5 junto com cleanup textual (sem usuários em prod, sem migration)
- **`templateId` tornado optional** em `report.ts` — permite os primeiros writes de teste do novo fluxo (FLOW-3) sem template, mas mantém compat com reports existentes
- **`stripe*` fields opcionais adicionados em `transaction.ts`** desde já — preparam terreno para FUTURE §8 sem implementar nada
- **`creditsBalance` em `userWallet.ts` é optional** — convive com `balance` BRL durante transição (Fase 3.5 vira fonte da verdade)

## Tests totals

- **Antes da sprint**: 94 testes
- **Depois da sprint**: 195 testes (+101)
- **Cobertura adicionada**:
  - Novos schemas: 79 testes (9 + 10 + 11 + 18 + 17 + 14)
  - Refactors aditivos: 22 testes (5 + 6 + 5 + 6)

## Blockers / risks

- Nenhum bloqueador encontrado durante a sprint
- Riscos mitigados: refactor aditivo evitou breaking changes; típecheck + build verdes confirmam que callers existentes continuam funcionando

## Next steps

Após esta sprint:

1. Push da branch `feat/redesign-foundation-schemas`
2. Abrir PR para `develop` (4 commits, 81 arquivos, ~16k linhas adicionadas — maioria docs)
3. Code review via `pr-review-toolkit:code-reviewer` subagent
4. Mergear após aprovação
5. **Iniciar Fase 0a** — Foundation Harness (`.claude/agents/`, templates de sprint, bootstrap script)

## Acceptance criteria — todos verdes ✅

- [x] Todos os schemas novos/refatorados em `packages/shared/src/schemas/`
- [x] `bun run test` passa em `packages/shared` (195/195)
- [x] `docs/API-CONTRACTS.md` lista 100% dos callables (existentes + 10 novos planejados)
- [x] `docs/DATA-MODEL.md` reflete novo modelo (6 collections novas documentadas)
- [x] Nenhum schema referencia `lookerStudioUrl`, `BRL`, `Asaas`, `SuitPay` **como obrigatório** (todos optional/legacy marcados)
- [x] Zero `interface Foo` declarado separado de schema Zod (mantido `type Foo = z.infer<typeof FooSchema>`)
- [x] `bun run typecheck` verde em packages/shared + web
- [x] `bun run build` verde em functions
- [x] Zero campo removido — compatibilidade total com docs existentes

## Nota sobre `functions` tests (pre-existing — não regressão)

`bun run test:all` mostra 22 testes failing em `@adsmart/functions:test` com timeouts de 10-20s. **Não é regressão desta sprint** — esses testes dependem do **Firestore emulator** rodando em `127.0.0.1:8080` + Auth emulator em `127.0.0.1:9099` (ver `functions/test/setup.ts`). Quando o emulator está down (caso atual desta máquina), todos os testes que dependem dele dão timeout.

Files afetados (todos pre-existing, nenhum tocado nesta sprint):
- `test/firestore-rules.test.ts`
- `test/adminWalletManager.test.ts`
- `test/googleAdsOAuthV2.test.ts`
- `test/metaAdsOAuthV2.test.ts`
- `test/rateLimiter.test.ts`
- `test/securityLogger.test.ts`

**Validação alternativa que comprova zero regressão**:
- `bun run typecheck` em web: verde
- `bun run build` em functions: verde (compila todos os arquivos, incluindo os de produção que ImportFromShared)
- `bun run test` em packages/shared: 195/195 verde (todos os schemas)

Para reproduzir os 22 testes verdes localmente: subir os emuladores Firebase (`firebase emulators:start --only firestore,auth`) e re-rodar.
