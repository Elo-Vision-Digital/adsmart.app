---
sprint-id: "0c"
name: "foundation-memory"
status: contract
depends-on: ["-1", "0a", "0b"]
est-days: 1
references:
  - docs/redesign/EXECUTION-CHECKLIST.md
  - docs/research/01-firebase-stack.md
  - docs/research/02-llm-strategy.md
  - docs/research/04-share-link-patterns.md
  - docs/research/05-pdf-generation.md
  - docs/research/06-oauth-platforms.md
  - docs/research/09-harness-engineering.md
---

# Sprint 0c — foundation-memory — SPEC

> Memória cleanup + criação. Sprint pequena (1 dia) que limpa memórias obsoletas e documenta decisões do redesign roadmap como state persistente para sessões futuras.

## Outcomes

- [ ] **1 memória deletada**: `suitpay_deprecated.md` (SuitPay foi removido em ADR-021; memória vira ruído; histórico fica em `docs/Decisions.md`)
- [ ] **3 memórias atualizadas**:
  - `firebase_secrets.md` — adicionar `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY` como secrets planejados (não criar secrets reais ainda — só documentar a convenção)
  - `admin_overhaul_roadmap.md` — cross-link com este redesign roadmap (`docs/redesign/EXECUTION-CHECKLIST.md`)
  - `MEMORY.md` (index) — remover linha SuitPay + adicionar linhas das 10 novas memórias
- [ ] **10 memórias novas criadas** (com `status: planned` quando a feature ainda não foi implementada):
  - `llm_combo_strategy.md` — Anthropic Claude (primary) + DeepSeek (fallback custo) — research/02 (planned, lands Fase 3.5)
  - `report_flow_v2.md` — novo fluxo 6 passos — FEATURES-INVENTORY § FLOW-3 (planned, Fase 3.5)
  - `credits_system.md` — 1 crédito = R$5, 1 plataforma = 1 crédito (Google + Meta = 2 créditos) — FEATURES-INVENTORY § MN-1 (planned, Fase 3.5)
  - `share_link_pattern.md` — UUID v4 + Firestore public collection + snapshot — research/04 (planned, Fase 3.5)
  - `playwright_pdf.md` — Playwright headless em Cloud Function para Export PDF — research/05 (planned, Fase 3.5)
  - `oauth_mfa_google.md` — Google Ads MFA mudança 21/abr/2026 — research/06 (active, já no código)
  - `i18n_three_langs.md` — toda string em pt-BR/en/es; pt-BR é source — princípio 7 (active, hook bloqueia)
  - `harness_pattern.md` — workflow harness end-to-end (SPEC → CONTRACT → waves → EVALUATION) — research/09 (active, Fase 0a+0b)
  - `progress_files_discipline.md` — sempre update PROGRESS.md antes de `/compact` — research/09 (active)
  - `multi_process_agents.md` — Implementer ≠ Validator (permissions separadas via frontmatter tools) — research/09 (active, Fase 0a)
- [ ] **MEMORY.md** reflete novo estado: zero referência a SuitPay/Asaas; 10 entradas novas listadas; padrão de uma linha cada com link
- [ ] **Zero regressão** nos sensores (test 195/195, typecheck verde, lint 0 errors)
- [ ] **Dogfood**: esta sprint usa o harness (sprint folder via `new-sprint.sh`, validator+sensores ao fim de cada wave, PROGRESS atualizado, EVALUATION verdict pass)

## Scope

### In

- Deletar `suitpay_deprecated.md` (com autorização explícita do usuário em 2026-05-19)
- Atualizar 3 memórias existentes (`firebase_secrets.md`, `admin_overhaul_roadmap.md`, `MEMORY.md`)
- Criar 10 memórias novas conforme detalhado em Outcomes
- Memórias planejadas (features ainda não implementadas) usam frontmatter `status: planned` + link para sprint que vai implementar

### Out

- **Reescrever memórias `feedback_*`** (preferências do usuário — não tocar)
- **ADRs publicados em `docs/Decisions.md`** → Fase 0d (separação intencional: memória é state pessoal/sessão; ADR é decisão oficial pública)
- **Cleanup textual em docs/UI mencionando SuitPay/Asaas/Data Studio** → Fase 0.5
- **Implementar features mencionadas nas memórias planejadas** (LLM combo real, credits system real, Playwright PDF real, etc.) → Fases 3.5+
- **Refactor das skills/commands/hooks da Fase 0b** — mantidos como estão
- **Mudanças em código TS/TSX da app** — esta sprint é apenas `.md` em `.claude/projects/.../memory/`
- **Mudanças em `firestore.rules` ou `firestore.indexes.json`**

## Constraints

| Tipo | Restrição |
|---|---|
| Formato | Frontmatter YAML com `name`, `description`, `metadata.type` (ou `type` legado). Body com **Why:** + **How to apply:** quando feedback/project; estrutura livre quando reference/user. |
| Status field | Memórias de features não-implementadas: `status: planned` + link para sprint que vai implementar. Quando o feature merge, atualiza para `status: active`. |
| Datas | Datas absolutas ISO (2026-05-19), nunca relativas ("ontem", "semana passada"). |
| Cross-links | Usar `[[name]]` para links entre memórias (mesmo se memória ainda não existe — marca trabalho futuro). |
| Não duplicar | Conteúdo já presente em `AGENTS.md`, `CLAUDE.md`, `docs/research/`, `docs/Decisions.md` NÃO entra em memória. Memória é apenas para coisas que NÃO podem ser derivadas do código/docs. |
| Não temos usuários em prod | irrelevante para esta sprint (só docs/state) |
| Zero regressão | sensores existentes continuam verdes |

## Prior decisions

- **Decisão sobre `suitpay_deprecated.md`**: deletar (confirmado pelo usuário em 2026-05-19). Razão: SuitPay foi removido em ADR-021 (2026-05-18); memória só serve para confundir; histórico permanece em `docs/Decisions.md` + `docs/CHANGES.md`.
- **Decisão sobre memórias de features planejadas**: criar agora com `status: planned` + link para sprint (confirmado pelo usuário 2026-05-19). Razão: documenta a DECISÃO do roadmap mesmo antes da implementação; reduz risco de drift entre roadmap e memória; quando a feature merge, atualizar para `active`.
- **Decisão sobre estrutura**: 1 sprint, 2 waves (W1: delete+updates+MEMORY index; W2: 10 creates). Razão: granularidade adequada ao escopo (~14 items); validator ao fim de cada wave; 1 PR final.
- **Memória vs ADR vs skill vs hook** (research/09 + MEMORY.md já tem nota sobre isso): convenção do projeto pós-2026-05-18 é:
  - **Memória**: state pessoal de sessão; decisão não-óbvia que afeta como o assistant deve trabalhar
  - **ADR** (`docs/Decisions.md`): decisão arquitetural pública, registrada permanentemente
  - **Skill** (`.claude/skills/X/SKILL.md`): procedimento operacional reutilizável, auto-invocável
  - **Hook** (`scripts/firebase/` ou `scripts/hooks/` + `.claude/settings.json`): bloqueio determinístico
- **Não tocar `feedback_*`** (preferências do usuário): essas são autoridade do usuário, não devo reescrever.

## Task breakdown

2 waves + 1 validação final. Cada wave fecha com validator agent + sensores.

### Wave 1 — Cleanup (4 items, ~1h)

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 1 | Deletar `suitpay_deprecated.md` | — | arquivo não existe mais |
| 2 | Atualizar `firebase_secrets.md` adicionando ANTHROPIC_API_KEY + DEEPSEEK_API_KEY (planned) | — | grep encontra ambas chaves no arquivo |
| 3 | Atualizar `admin_overhaul_roadmap.md` com cross-link para `docs/redesign/EXECUTION-CHECKLIST.md` | — | grep encontra link |
| 4 | Atualizar `MEMORY.md` index: remover linha SuitPay + adicionar 10 linhas novas | 1, 2, 3 | sem ref a suitpay; ≥ 19 bullets de memória |

### Wave 2 — Novas memórias (10 items, ~2h)

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 5 | Criar `llm_combo_strategy.md` (planned, Fase 3.5) | — | arquivo + frontmatter name/description + body com Anthropic+DeepSeek |
| 6 | Criar `report_flow_v2.md` (planned, Fase 3.5) | — | arquivo + frontmatter + body com "6 passos" / FLOW-3 |
| 7 | Criar `credits_system.md` (planned, Fase 3.5) | — | arquivo + frontmatter + body com "1 crédito = R$5" / MN-1 |
| 8 | Criar `share_link_pattern.md` (planned, Fase 3.5) | — | arquivo + frontmatter + body com "UUID v4" / snapshot |
| 9 | Criar `playwright_pdf.md` (planned, Fase 3.5) | — | arquivo + frontmatter + body com Playwright / headless |
| 10 | Criar `oauth_mfa_google.md` (active) | — | arquivo + frontmatter + body com MFA / Google Ads |
| 11 | Criar `i18n_three_langs.md` (active) | — | arquivo + frontmatter + body com pt-BR / 3 línguas / princípio 7 |
| 12 | Criar `harness_pattern.md` (active) | — | arquivo + frontmatter + body com SPEC / CONTRACT / EVALUATION |
| 13 | Criar `progress_files_discipline.md` (active) | — | arquivo + frontmatter + body com PROGRESS.md / compact |
| 14 | Criar `multi_process_agents.md` (active) | — | arquivo + frontmatter + body com Implementer ≠ Validator / princípio 13 |

### Wave 3 — Validação final

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 15 | Zero regressão (sensores) | 1-14 | test 195/195; typecheck verde; lint 0 errors |
| 16 | EVALUATION.md verdict: pass | 15 | grep encontra `verdict: pass` |

## Verification criteria

| Outcome | Sensor | Comando / Subagent |
|---|---|---|
| 1 delete | Computacional | `test ! -f` |
| 3 updates | Computacional | `grep -q` pattern por arquivo |
| 10 creates | Computacional | `test -f` + `grep -q "^name:"` + `grep -q "^description:"` |
| MEMORY.md index | Computacional | `! grep -q "suitpay" MEMORY.md && [ $(grep -c '^- \[' MEMORY.md) -ge 19 ]` |
| Coerência | Inferencial | `Agent(validator, "check Wave N — memórias seguem convenção + status correto + cross-links válidos")` |
| Zero regressão | Computacional | test + typecheck + lint |

## References

- `docs/redesign/EXECUTION-CHECKLIST.md` § FASE 0c (linha 284-322)
- `docs/research/09-harness-engineering.md` § 6 (Persistent state)
- `.claude/projects/.../memory/MEMORY.md` (index atual)
- `docs/specs/0a-foundation-harness/`, `docs/specs/0b-foundation-tooling/` (sprints anteriores como dogfood)
