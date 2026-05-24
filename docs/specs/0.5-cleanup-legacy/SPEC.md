---
sprint-id: "0.5"
name: "cleanup-legacy"
status: contract
depends-on: ["-1", "0a", "0b", "0c", "0d"]
est-days: 2
references:
  - docs/redesign/EXECUTION-CHECKLIST.md
  - docs/research/08-stripe-future.md
---

# Sprint 0.5 — cleanup-legacy — SPEC

> Cleanup textual: remover menções de Asaas, SuitPay e Google Data Studio do codebase + docs ativas. Sem implementar nada novo. Microsprints com pausa entre cada para aprovação do usuário.

## Outcomes

- [ ] **Zero referência a "asaas/Asaas"** em código TS/TSX (src/, functions/, packages/) e docs ativas (excluindo registros históricos como specs, research, archive, CHANGES, changelog, redesign/).
- [ ] **Zero referência a "suitpay/SuitPay"** no código TS/TSX. Em docs: zero exceto em ADR-021 (decisão histórica preservada) + docs/CHANGES.md (entries históricos).
- [ ] **Zero referência a "looker/datastudio/data.studio/lookerStudio"** em código TS/TSX e docs ativas; `src/config/lookerStudioTemplates.ts` deletado.
- [ ] **MetaReviewDemo dev-only**: rota envolvida em `import.meta.env.MODE === 'development'` em `src/App.tsx`.
- [ ] **Stripe (FUTURE §8)** substitui referências a Asaas onde aplicável (research/08-stripe-future.md é a fonte).
- [ ] **Registros históricos intocados**: sprint artifacts (`docs/specs/`), research (`docs/research/`), archive (`docs/superpowers/archive/`), changelog histórico (`docs/changelog/`), redesign roadmap (`docs/redesign/EXECUTION-CHECKLIST.md`, FUTURE-IDEAS, FEATURES-INVENTORY, CURRENT-STATE-AUDIT), CHANGES.md (entries antigos preservados).
- [ ] **Zero regressão**: `cd packages/shared && bun run test` → 195/195, `bun run typecheck` exit 0, `bun run lint` 0 errors.
- [ ] **Dogfood**: sprint executada via harness (sprint folder + 4 waves/microsprints com pausa, validator agent em cada).

## Scope

### In

- 4 microsprints sequenciais com pausa entre cada:
  - **0.5.1**: Asaas cleanup (~16 arquivos)
  - **0.5.2**: SuitPay cleanup final (~2 arquivos restantes — ADR-021 mantém status)
  - **0.5.3**: Looker/Data Studio cleanup (~14 arquivos + delete `lookerStudioTemplates.ts`)
  - **0.5.4**: MetaReviewDemo dev-only flag (~2 arquivos)

### Out

- **Implementar Stripe** → FUTURE §8 (não nesta sprint)
- **Refactor de ADRs históricos** (ADR-001 a ADR-027) — apenas update de refs cruzadas onde estritamente necessário; nunca reescrever decisão original
- **Refactor visual de telas** → Fases 1, 2, 3
- **Mudanças em comportamento de código** — esta sprint é puramente cleanup textual
- **Mudanças em `firestore.rules` ou `firestore.indexes.json`**

## Constraints

| Tipo | Restrição |
|---|---|
| Histórico | Sprint artifacts (`docs/specs/`), research, archive, changelog, redesign roadmap → INTOCÁVEIS. Substituições só em código ativo + docs ativas. |
| ADRs Accepted/Deferred | Não reescrever decisão original. Permitido: update cirúrgico de referência cruzada (ex: "Asaas is the replacement" → "Stripe is the planned replacement, FUTURE §8") |
| Estratégia | Asaas → Stripe (FUTURE §8) quando substituível; remoção total quando contextualmente redundante |
| MetaReviewDemo | Dev-only flag via `import.meta.env.MODE === 'development'` no `src/App.tsx`; build prod retorna 404 na rota |
| Zero regressão | sensores existentes continuam verdes |
| Comments em código | Atualizar para "Stripe (FUTURE §8)" ou remover quando "Asaas que nunca chegou" é contexto histórico já capturado em ADR-021 |

## Prior decisions

- **Stripe é o substituto declarado de Asaas** (docs/research/08-stripe-future.md, ADR a publicar quando Stripe for implementado em FUTURE §8). Confirmado via revisão dos research notes 2026-05-19.
- **ADR-021 (Accepted)**: mantém status. Apenas a frase "Asaas is the replacement" vira "Stripe is the planned replacement (FUTURE §8)".
- **MetaReviewDemo**: dev-only via env flag, não delete. Razão: pode ser útil para QA visual em dev; build prod ignora.
- **lookerStudioTemplates.ts**: deletar (substituído por render in-app conforme ADR-022).
- **4 microsprints com pausa entre cada**: confirmado pelo usuário 2026-05-19. Pausa = "report + esperar aprovação explícita" antes de seguir próxima microsprint.

## Task breakdown

4 microsprints + validação final. Pausa após cada microsprint.

### Microsprint 0.5.1 — Asaas cleanup (~16 arquivos, ~40min)

Código TS/TSX (4 arquivos — só comentários):
1. `functions/src/index.ts:50` — atualizar comentário
2. `functions/src/getDashboardMetrics.ts:197` — atualizar comentário
3. `src/components/ui/AddCreditsModal.tsx:20-21` — atualizar comentários
4. `packages/shared/src/schemas/transaction.ts:12` — atualizar comentário

Docs ativas (12 arquivos):
5-16. `AGENTS.md`, `CLAUDE.md`, `docs/PAYMENTS.md` (10 hits), `docs/Decisions.md` (refs cruzadas, não reescrever ADRs), `docs/DOMAIN.md`, `docs/Integrations.md`, `docs/REFACTOR-PLAN.md`, `docs/SECURITY.md`, `docs/DATA-MODEL.md`, `docs/API-CONTRACTS.md`, `docs/index.md`, `docs/FIREBASE-CONVENTIONS.md`

Acceptance test: `grep -rln "asaas\|Asaas" src/ functions/ packages/ AGENTS.md CLAUDE.md docs/*.md` (excluindo specs/, research/, superpowers/, changelog/, redesign/, CHANGES.md) → zero.

### Microsprint 0.5.2 — SuitPay cleanup final (~2 arquivos, ~15min)

- `packages/shared/src/schemas/transaction.ts` — campos `payerName`, `payerCpf` (já marcados optional na Fase -1; remover se safe)
- `docs/Decisions.md` — ADR-021 (Accepted) mantém status; só refs cruzadas se aplicável

Acceptance test: `grep -rln "suitpay\|SuitPay" src/ functions/ packages/` → zero; em docs ativas → zero exceto ADR-021 + CHANGES.

### Microsprint 0.5.3 — Looker/Data Studio cleanup (~14 arquivos + 1 delete, ~30min)

- DELETAR: `src/config/lookerStudioTemplates.ts`
- Refactor: `src/pages/ReportSuccessPage.tsx`, `src/pages/HomePage.tsx`
- Atualizar: `packages/shared/src/schemas/report.ts` (remover `lookerStudioUrl` se ainda presente), `*.test.ts` co-located
- Docs ativas: src/AGENTS.md, Integrations, QA-CHECKLIST, REFACTOR-PLAN, DOMAIN, DATA-MODEL, Decisions, CHANGES (entry), changelog (NÃO — histórico)

Acceptance test: `grep -rln "looker\|datastudio\|data\.studio\|lookerStudio" src/ functions/ packages/ docs/*.md AGENTS.md CLAUDE.md` (excluindo specs/, research/, superpowers/, changelog/, redesign/) → zero.

### Microsprint 0.5.4 — MetaReviewDemo dev-only flag (~2 arquivos, ~15min)

- `src/App.tsx` — envolver Route em `{import.meta.env.MODE === 'development' && ...}`
- Verificar build prod (rota retorna 404) — smoke manual ou comment-based

Acceptance test: `grep -A2 "MetaReviewDemo" src/App.tsx | grep -q "import.meta.env.MODE"` → exit 0.

### Wave 5 — Validação final

- Zero regressão: test 195/195 + typecheck + lint
- EVALUATION verdict pass

## Verification criteria

| Outcome | Sensor | Comando |
|---|---|---|
| Asaas zero refs (código+docs ativas) | Computacional | grep com exclusões |
| SuitPay zero refs (código) | Computacional | grep |
| Looker zero refs (código+docs ativas) | Computacional | grep |
| `lookerStudioTemplates.ts` deletado | Computacional | `test ! -f src/config/lookerStudioTemplates.ts` |
| MetaReviewDemo dev-only | Computacional | grep import.meta.env.MODE adjacente |
| Coerência substituições Asaas→Stripe | Inferencial | validator agent |
| Sprint artifacts/research/archive intocados | Computacional | git diff path exclusion |
| Zero regressão | Computacional | test + typecheck + lint |

## References

- `docs/redesign/EXECUTION-CHECKLIST.md` § FASE 0.5 (linha 364-426)
- `docs/research/08-stripe-future.md` (Stripe é o substituto declarado)
- `docs/Decisions.md` § ADR-021 (Accepted, SuitPay removal)
- `docs/Decisions.md` § ADR-022 (Planned, render in-app substitui Data Studio)
