---
sprint-id: "0.5"
name: "cleanup-legacy"
negotiated-on: "2026-05-19"
parties:
  implementer: "main session (Claude Opus 4.7), 4 microsprints com pausa entre cada"
  validator: ".claude/agents/validator.md (multi-process, 1 pass por microsprint)"
status: locked
---

# Sprint 0.5 — cleanup-legacy — CONTRACT

> Locked. Validator bate por microsprint. 4 microsprints + validação final = 5 waves. Pausa após cada microsprint para aprovação explícita do usuário.

## Items (Implementer commits to delivering)

### Microsprint 0.5.1 — Asaas cleanup

| # | Item | Acceptance test |
|---|---|---|
| 1 | `functions/src/index.ts` — comentário Asaas atualizado para Stripe FUTURE §8 (ou removido) | `! grep -q "Asaas" functions/src/index.ts` |
| 2 | `functions/src/getDashboardMetrics.ts` — comentário atualizado | `! grep -q "Asaas" functions/src/getDashboardMetrics.ts` |
| 3 | `src/components/ui/AddCreditsModal.tsx` — comentários atualizados | `! grep -q "Asaas" src/components/ui/AddCreditsModal.tsx` |
| 4 | `packages/shared/src/schemas/transaction.ts` — comentário atualizado | `! grep -q "Asaas" packages/shared/src/schemas/transaction.ts` |
| 5 | `AGENTS.md` — 2 hits atualizados | `! grep -q "Asaas" AGENTS.md` |
| 6 | `CLAUDE.md` — 1 hit atualizado | `! grep -q "Asaas" CLAUDE.md` |
| 7 | `docs/PAYMENTS.md` — 10 hits refactored (Asaas→Stripe FUTURE §8) | `! grep -q "Asaas" docs/PAYMENTS.md` |
| 8 | `docs/Decisions.md` — refs cruzadas em ADRs atualizadas (ADR-021 status Accepted preservado) | `! grep -q "Asaas is the replacement" docs/Decisions.md` (mas grep "Asaas" pode aparecer em contexto histórico tipo "Asaas que nunca chegou" — OK se ≤ 1-2 hits documentando "Stripe replaces Asaas") |
| 9-16 | `docs/DOMAIN.md`, `docs/Integrations.md`, `docs/REFACTOR-PLAN.md`, `docs/SECURITY.md`, `docs/DATA-MODEL.md`, `docs/API-CONTRACTS.md`, `docs/index.md`, `docs/FIREBASE-CONVENTIONS.md` | `for f in $LIST; do ! grep -q "Asaas" $f; done` |
| Final | Acceptance computacional Microsprint 0.5.1 | `grep -rln "asaas\|Asaas" src/ functions/ packages/ AGENTS.md CLAUDE.md docs/*.md 2>/dev/null \| grep -v "/specs/\|/research/\|/superpowers/\|/changelog/\|/redesign/\|CHANGES.md\|Decisions.md"` → zero |

### Microsprint 0.5.2 — SuitPay cleanup final (pausa antes)

| # | Item | Acceptance test |
|---|---|---|
| 17 | Verificar `packages/shared/src/schemas/transaction.ts` campos legacy SuitPay (`payerName`, `payerCpf`, `paymentId`) — remover se safe (não usados no código atual) OU manter como opcional documentado | inspeção + grep callers |
| 18 | Confirmar zero refs SuitPay em código TS/TSX (exceto comentários históricos justificáveis) | `grep -rln "suitpay\|SuitPay" src/ functions/ packages/` → zero |
| Final | Em docs: zero exceto ADR-021 (Accepted) + CHANGES.md (histórico) | grep curatoria |

### Microsprint 0.5.3 — Looker/Data Studio cleanup (pausa antes)

| # | Item | Acceptance test |
|---|---|---|
| 19 | DELETAR `src/config/lookerStudioTemplates.ts` | `test ! -f src/config/lookerStudioTemplates.ts` |
| 20 | `src/pages/ReportSuccessPage.tsx` refactored (não usa mais Looker) | `! grep -q "looker\|Looker" src/pages/ReportSuccessPage.tsx` |
| 21 | `src/pages/HomePage.tsx` — qualquer ref removida | `! grep -q "looker\|Looker" src/pages/HomePage.tsx` |
| 22 | `packages/shared/src/schemas/report.ts` — remover `lookerStudioUrl` se ainda presente | `! grep -q "lookerStudioUrl" packages/shared/src/schemas/report.ts` |
| 23 | `packages/shared/src/schemas/report.test.ts` — atualizar tests | tests passam |
| 24 | `src/AGENTS.md`, `docs/Integrations.md`, `docs/QA-CHECKLIST.md`, `docs/REFACTOR-PLAN.md`, `docs/DOMAIN.md`, `docs/DATA-MODEL.md`, `docs/Decisions.md` (refs cruzadas) | grep zero hits ativos |
| Final | Acceptance computacional 0.5.3 | `grep -rln "looker\|datastudio\|data\.studio\|lookerStudio" src/ functions/ packages/ docs/*.md 2>/dev/null \| grep -v "/specs/\|/research/\|/superpowers/\|/changelog/\|/redesign/\|CHANGES.md"` → zero |

### Microsprint 0.5.4 — MetaReviewDemo dev-only flag (pausa antes)

| # | Item | Acceptance test |
|---|---|---|
| 25 | `src/App.tsx` — Route MetaReviewDemo envolvida em `{import.meta.env.MODE === 'development' && ...}` | grep adjacente confirma; build prod retorna 404 (inferencial) |

### Wave 5 — Validação final

| # | Item | Depende de | Acceptance test |
|---|---|---|---|
| 26 | Zero regressão: `cd packages/shared && bun run test` continua 195/195; `bun run typecheck` verde; `bun run lint` 0 errors | 1-25 | sensores PASS |
| 27 | `docs/specs/0.5-cleanup-legacy/EVALUATION.md` com `verdict: pass` | 26 | grep verdict |

## Out of scope (explicit)

- Implementar Stripe → FUTURE §8
- Refactor visual de telas → Fases 1/2/3
- Mudanças em comportamento de código (lógica)
- Mudanças em `firestore.rules`/indexes
- Reescrever ADRs históricos (apenas refs cruzadas)
- Mexer em registros históricos: `docs/specs/`, `docs/research/`, `docs/superpowers/archive/`, `docs/changelog/`, `docs/redesign/EXECUTION-CHECKLIST.md`, `FUTURE-IDEAS`, `FEATURES-INVENTORY`, `CURRENT-STATE-AUDIT`, `docs/CHANGES.md` (entries antigos)

## Sensors a rodar

### Computacionais (bloqueantes ao fim de cada microsprint)

- [ ] grep zero hits Asaas (microsprint 0.5.1)
- [ ] grep zero hits SuitPay no código (microsprint 0.5.2)
- [ ] grep zero hits Looker (microsprint 0.5.3)
- [ ] `test ! -f src/config/lookerStudioTemplates.ts` (microsprint 0.5.3)
- [ ] grep `import.meta.env.MODE` em src/App.tsx adjacente a MetaReviewDemo (microsprint 0.5.4)
- [ ] `cd packages/shared && bun run test` — 195/195 (Wave 5)
- [ ] `bun run typecheck` — exit 0 (Wave 5)
- [ ] `bun run lint` — 0 errors (Wave 5)
- [ ] Pre-commit hooks via `git commit` — passam

### Inferenciais

- [ ] `Agent(validator, "check Microsprint 0.5.N: substituições coerentes (Asaas→Stripe FUTURE §8 ou remoção), registros históricos intocados, comentários atualizados sem perder contexto necessário")` retorna PASS antes de seguir.

## Sign-off

- [ ] Implementer assinou — 4 microsprint commits (1 por microsprint) + 1 closing commit
- [ ] Validator assinou (1 pass por microsprint + 1 final) — EVALUATION.md `verdict: pass`
- [ ] Human aprovou cada microsprint antes da próxima (pausa explícita)
- [ ] Human revisou — PR aberto e mergeado em develop
