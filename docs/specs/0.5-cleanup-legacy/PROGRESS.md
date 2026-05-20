---
sprint-id: "0.5"
name: "cleanup-legacy"
started: "2026-05-19"
status: in-progress
current-step: implement
---

# Sprint 0.5 — cleanup-legacy — PROGRESS

> Memory artifact. 4 microsprints com pausa entre cada — usuário aprova explicitamente.

## Status

| Field | Value |
|---|---|
| Branch | `feat/redesign-0.5-cleanup-legacy` |
| Base | `develop` (Fases -1, 0a, 0b, 0c, 0d mergeadas) |
| Last commit | _pending — Microsprint 0.5.1 a commitar_ |
| Tests | `cd packages/shared && bun run test` → 195/195 ✅ |
| Typecheck | exit 0 ✅ |
| Blockers | nenhum |

## Sessions log

### 2026-05-19 — Session 1: setup + Microsprint 0.5.1 (Asaas cleanup)

- [x] PRs Fase 0c (#6) + 0d (#7 + #8 restore) mergeados em develop
- [x] Branch nova: `feat/redesign-0.5-cleanup-legacy` a partir de develop atualizado
- [x] Sprint folder scaffolded via `bash scripts/harness/new-sprint.sh 0.5 cleanup-legacy`
- [x] SPEC.md preenchido (4 microsprints + Wave 5 validação)
- [x] CONTRACT.md preenchido `status: locked` (27 items)
- [x] **Microsprint 0.5.1 (Asaas cleanup) entregue**:
  - Código TS/TSX (4 arquivos): comentários atualizados Asaas→Stripe (FUTURE §8)
  - Test bonus (transaction.test.ts): valor 'asaas' substituído por 'paypal' no rejection test
  - Docs ativas (12 arquivos): PAYMENTS.md (rewrite seção Stripe planned), AGENTS, CLAUDE (strikethrough), DOMAIN, Integrations, REFACTOR-PLAN, SECURITY, DATA-MODEL, API-CONTRACTS, index, FIREBASE-CONVENTIONS, Decisions (ADR-003 Update note + refs cruzadas em ADR-019/021/023 atualizadas)
  - Hits restantes em Decisions.md (6): todos em contexto histórico legítimo (ADR-003 Superseded + ADR-021 incident history)
- [x] Sensores Microsprint 0.5.1: typecheck verde + test 195/195
- [x] Validator agent: PASS com observações granulares (substituições coerentes, ADR-003 preservado, scope discipline mantida, narrativa Stripe global consistente)
- [ ] Próximo: PAUSA — aprovação do usuário para Microsprint 0.5.2 (SuitPay cleanup final)

## Decisions taken

- **Stripe substitui Asaas como direção FUTURE §8**: confirmado em research/08-stripe-future.md + ADR-003 Update note 2026-05-19. ADR-003 Status virou "Superseded by ADR-021 + FUTURE §8".
- **Preservar contexto histórico em Decisions.md**: 6 refs Asaas ficaram (5 em ADR-003 com Update note explícita Stripe, 1 em ADR-021 incident history). CONTRACT acceptance test `! grep -q "Asaas is the replacement"` PASS.
- **ADR-003 não foi reescrito** (apenas Status + Update note adicionados). Decision/Rationale originais intactos.
- **transaction.test.ts**: substituí valor 'asaas' por 'paypal' no rejection test — mantém semântica (provider desconhecido rejeitado).
- **Pausa após cada microsprint**: workflow confirmado com usuário 2026-05-19. Aprovação explícita antes de Microsprint 0.5.2.

## Blockers / risks

- Nenhum blocker.
- **Risk mitigado**: ADR históricos preservados intactos; Update note + cross-refs atualizadas sem reescrever decisão original.

## Tests/build status

```text
cd packages/shared && bun run test    →  195/195 verde ✅
bun run typecheck                      →  exit 0 ✅
grep zero Asaas em src/+functions/src/+packages/shared/src/+docs ativas → confirmed ✅
```

## Next steps

1. **PAUSA — aprovação do usuário** para Microsprint 0.5.2
2. Após aprovação: Microsprint 0.5.2 (SuitPay cleanup final — ~2 arquivos restantes)
3. Após aprovação: Microsprint 0.5.3 (Looker/Data Studio cleanup — ~14 arquivos + delete `lookerStudioTemplates.ts`)
4. Após aprovação: Microsprint 0.5.4 (MetaReviewDemo dev-only flag)
5. Wave 5 final: EVALUATION verdict pass + PR para develop
