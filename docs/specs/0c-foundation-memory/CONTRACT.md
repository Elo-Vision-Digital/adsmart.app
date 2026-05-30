---
sprint-id: "0c"
name: "foundation-memory"
negotiated-on: "2026-05-19"
parties:
  implementer: "main session (Claude Opus 4.7) + 2 wave validator passes + 1 final"
  validator: ".claude/agents/validator.md (multi-process, fresh context per wave)"
status: locked
---

# Sprint 0c — foundation-memory — CONTRACT

> Locked. Validator bate item-a-item após cada wave + ao fim da sprint.

> Path base das memórias: `.claude/projects/-Users-eduardorodrigues-Downloads-Meus-Projetos-adsmart-app/memory/` (aliased como `MEMDIR` abaixo).

## Items (Implementer commits to delivering)

### Wave 1 — Cleanup (4 items)

| # | Item | Acceptance test |
|---|---|---|
| 1 | Deletar `MEMDIR/suitpay_deprecated.md` | `test ! -f MEMDIR/suitpay_deprecated.md` |
| 2 | Atualizar `MEMDIR/firebase_secrets.md` adicionando referência a `ANTHROPIC_API_KEY` e `DEEPSEEK_API_KEY` como secrets planejados (não criar secret real ainda) | `grep -q "ANTHROPIC_API_KEY" MEMDIR/firebase_secrets.md && grep -q "DEEPSEEK_API_KEY" MEMDIR/firebase_secrets.md` |
| 3 | Atualizar `MEMDIR/admin_overhaul_roadmap.md` com cross-link para `docs//` | `grep -q "/" MEMDIR/admin_overhaul_roadmap.md` |
| 4 | Atualizar `MEMDIR/MEMORY.md` index: remover linha SuitPay + adicionar 10 entradas das memórias novas | `! grep -q "suitpay_deprecated" MEMDIR/MEMORY.md && [ "$(grep -c '^- \[' MEMDIR/MEMORY.md)" -ge 19 ]` |

### Wave 2 — Novas memórias (10 items)

Cada item: criar arquivo `MEMDIR/{name}.md` com frontmatter (`name`, `description`, `metadata.type`) + body com **Why:** + **How to apply:** + cross-links onde aplicável.

| # | Item | Acceptance test |
|---|---|---|
| 5 | `MEMDIR/llm_combo_strategy.md` (planned, Fase 3.5 — Anthropic primary + DeepSeek fallback custo) | `test -f MEMDIR/llm_combo_strategy.md && grep -q "^name:" MEMDIR/llm_combo_strategy.md && grep -q "^description:" MEMDIR/llm_combo_strategy.md && grep -q "Anthropic" MEMDIR/llm_combo_strategy.md && grep -q "DeepSeek" MEMDIR/llm_combo_strategy.md && grep -q "status: planned" MEMDIR/llm_combo_strategy.md` |
| 6 | `MEMDIR/report_flow_v2.md` (planned, Fase 3.5 — 6 passos / FLOW-3) | idem com "6 passos" e "FLOW-3" |
| 7 | `MEMDIR/credits_system.md` (planned, Fase 3.5 — 1 crédito = R$5 / MN-1) | idem com "1 crédito" e "MN-1" |
| 8 | `MEMDIR/share_link_pattern.md` (planned, Fase 3.5 — UUID v4 + Firestore public + snapshot) | idem com "UUID v4" e "snapshot" |
| 9 | `MEMDIR/playwright_pdf.md` (planned, Fase 3.5 — Playwright headless em Cloud Function) | idem com "Playwright" e "headless" |
| 10 | `MEMDIR/oauth_mfa_google.md` (active — Google Ads MFA 21/abr/2026) | `test -f ...` + frontmatter + "MFA" + "Google Ads" + "status: active" |
| 11 | `MEMDIR/i18n_three_langs.md` (active — pt-BR source + en + es / princípio 7) | idem com "pt-BR" e "princípio 7" e "status: active" |
| 12 | `MEMDIR/harness_pattern.md` (active — SPEC→CONTRACT→waves→EVALUATION) | idem com "SPEC" e "CONTRACT" e "EVALUATION" e "status: active" |
| 13 | `MEMDIR/progress_files_discipline.md` (active — PROGRESS antes de /compact) | idem com "PROGRESS.md" e "compact" e "status: active" |
| 14 | `MEMDIR/multi_process_agents.md` (active — Implementer ≠ Validator / princípio 13) | idem com "Implementer" e "Validator" e "status: active" |

### Wave 3 — Validação final (2 items)

| # | Item | Depende de | Acceptance test |
|---|---|---|---|
| 15 | Zero regressão: `cd packages/shared && bun run test` continua 195/195; `bun run typecheck` verde; `bun run lint` 0 errors; zero `.ts`/`.tsx` da app modificado | 1-14 | output dos 3 sensores + `git diff --stat $(git merge-base HEAD origin/develop) HEAD -- '*.ts' '*.tsx' \| wc -l` retorna apenas linha total |
| 16 | `docs/specs/0c-foundation-memory/EVALUATION.md` com `verdict: pass` | 15 | `grep -q 'verdict: pass' docs/specs/0c-foundation-memory/EVALUATION.md` |

## Out of scope (explicit)

- [ ] Reescrever memórias `feedback_*` (autoridade do usuário) — não tocar
- [ ] Publicar ADRs em `docs/Decisions.md` — **Fase 0d**
- [ ] Cleanup textual em docs/UI mencionando SuitPay/Asaas/Data Studio — **Fase 0.5**
- [ ] Implementar features mencionadas nas memórias `status: planned` (LLM combo real, credits system, Playwright PDF, etc.) — **Fases 3.5+**
- [ ] Refactor das skills/commands/hooks da Fase 0b
- [ ] Mudanças em código TS/TSX da app
- [ ] Mudanças em `firestore.rules` ou `firestore.indexes.json`

## Sensors a rodar

### Computacionais (bloqueantes ao fim de cada wave)

- [ ] `test ! -f MEMDIR/suitpay_deprecated.md` (Wave 1)
- [ ] `grep -q` em cada arquivo atualizado/criado (Waves 1+2)
- [ ] `cd packages/shared && bun run test` — 195/195 verde (Wave 3)
- [ ] `bun run typecheck` — verde (Wave 3)
- [ ] `bun run lint` — 0 errors (Wave 3)
- [ ] Pre-commit hooks via `git commit` — passam (cada wave)

### Inferenciais (ao fim de cada wave)

- [ ] `Agent(validator, "check Wave N: memórias seguem convenção do projeto (frontmatter + Why/How to apply) + status correto (planned/active) + cross-links via [[name]] válidos + não duplicam conteúdo já em AGENTS/docs")` retorna PASS antes de seguir próxima wave

## Sign-off

- [ ] Implementer assinou — 2 commits (1 por wave) pushed + 1 closing commit
- [ ] Validator assinou (2 passes intermediários + 1 final) — EVALUATION.md `verdict: pass`
- [ ] Human revisou — PR aberto e mergeado em develop
