---
sprint-id: "0a"
name: "foundation-harness"
negotiated-on: "2026-05-19"
parties:
  implementer: "main session (Claude Opus 4.7)"
  validator: "post-implementation pass — same session, separate verification step"
status: locked
---

# Sprint 0a — Foundation Harness — CONTRACT

> Locked. Validator bate item-a-item após Implementer commitar.

## Items (Implementer commits to delivering)

### Wave 1 — Agents (independentes)

| # | Item | Acceptance test |
|---|---|---|
| 1 | `.claude/agents/orchestrator.md` com frontmatter (`name, description, tools: Agent + Read + Grep + Glob + TodoWrite + Bash, model: sonnet`) + corpo descrevendo Workflow + Hard rules | `test -f .claude/agents/orchestrator.md && grep -q '^name: orchestrator$' && grep -qE '^tools:.*Agent' .claude/agents/orchestrator.md` |
| 2 | `.claude/agents/researcher.md` com `tools` incluindo `WebSearch, WebFetch, mcp__plugin_context7_context7__*`, sem `Edit/Write` | `grep -q '^name: researcher$' .claude/agents/researcher.md && grep -qE 'mcp__plugin_context7' .claude/agents/researcher.md && ! grep -qE '^tools:.*\b(Edit\|Write)\b' .claude/agents/researcher.md` |
| 3 | `.claude/agents/planner.md` com `tools` incluindo `Write` (escopo `docs/specs/`), sem `Agent` | `grep -q '^name: planner$' .claude/agents/planner.md && grep -qE '^tools:.*Write' .claude/agents/planner.md && ! grep -qE '^tools:.*\bAgent\b' .claude/agents/planner.md` |
| 4 | `.claude/agents/implementer.md` com `tools: Edit, Write, ...` MAS sem `Agent` | `grep -q '^name: implementer$' .claude/agents/implementer.md && grep -qE '^tools:.*\bEdit\b' && grep -qE '^tools:.*\bWrite\b' && ! grep -qE '^tools:.*\bAgent\b' .claude/agents/implementer.md` |
| 5 | `.claude/agents/validator.md` com `tools: Read, Grep, Glob, Bash` SEM `Edit, Write, Agent` | `grep -q '^name: validator$' .claude/agents/validator.md && ! grep -qE '^tools:.*\b(Edit\|Write\|Agent)\b' .claude/agents/validator.md` |
| 6 | `.claude/agents/debugger.md` com `tools` SEM `Edit, Write, Agent` | `grep -q '^name: debugger$' .claude/agents/debugger.md && ! grep -qE '^tools:.*\b(Edit\|Write\|Agent)\b' .claude/agents/debugger.md` |

### Wave 1 — Templates (independentes, paralelas com agents)

| # | Item | Acceptance test |
|---|---|---|
| 7 | `docs/specs/_templates/SPEC.md` com placeholders `{ID}`, `{NAME}` e seções `## Outcomes`, `## Scope`, `## Constraints`, `## Prior decisions`, `## Task breakdown`, `## Verification criteria` | `grep -q '^## Outcomes' docs/specs/_templates/SPEC.md && grep -q '{ID}' && grep -q '{NAME}' docs/specs/_templates/SPEC.md` |
| 8 | `docs/specs/_templates/CONTRACT.md` com placeholders + frontmatter `status: draft` + seções `## Items`, `## Out of scope`, `## Sensors a rodar`, `## Sign-off` | `grep -q 'status: draft' docs/specs/_templates/CONTRACT.md && grep -q '## Items' docs/specs/_templates/CONTRACT.md` |
| 9 | `docs/specs/_templates/PROGRESS.md` com placeholders + frontmatter `started:` + seções `## Sessions log`, `## Decisions taken`, `## Blockers / risks`, `## Tests/build status` | `grep -q 'started:' docs/specs/_templates/PROGRESS.md && grep -q '## Sessions log' docs/specs/_templates/PROGRESS.md` |
| 10 | `docs/specs/_templates/EVALUATION.md` com `verdict: pending` + seções `## Verdict`, `## Score por item`, `## Computational sensors output`, `## Fix list` | `grep -q 'verdict: pending' docs/specs/_templates/EVALUATION.md && grep -q '## Verdict' docs/specs/_templates/EVALUATION.md` |

### Wave 2 — Scripts (depende de templates)

| # | Item | Depende de | Acceptance test |
|---|---|---|---|
| 11 | `scripts/harness/bootstrap-session.sh` com `set -euo pipefail`, sem hardcoded paths, executável | — | `test -x scripts/harness/bootstrap-session.sh && bash -n scripts/harness/bootstrap-session.sh` |
| 12 | `scripts/harness/update-progress.sh` exit 1 sem arg, append timestamped section em PROGRESS.md | — | `bash -n scripts/harness/update-progress.sh && bash scripts/harness/update-progress.sh 2>&1 \| grep -q Usage` |
| 13 | `scripts/harness/new-sprint.sh <id> <name>` cria folder com 4 templates instanciados (placeholders substituídos), executável | 7,8,9,10 | `bash scripts/harness/new-sprint.sh tmpsprint test && test -f docs/specs/tmpsprint-test/SPEC.md && grep -q 'sprint-id: "tmpsprint"' docs/specs/tmpsprint-test/SPEC.md && rm -rf docs/specs/tmpsprint-test` |

### Wave 2 — Runbook (depende de agents + templates)

| # | Item | Depende de | Acceptance test |
|---|---|---|---|
| 14 | `docs/HARNESS-RUNBOOK.md` com seções `## Anatomy`, `## Typical sprint flow`, `## Hard rules`, `## Failure modes & escalation`, `## References` | 1-10 | `for s in Anatomy 'Typical sprint flow' 'Hard rules' 'Failure modes' References; do grep -q "## $s" docs/HARNESS-RUNBOOK.md \|\| exit 1; done` |

### Wave 3 — Dogfood (depende de templates + scripts)

| # | Item | Depende de | Acceptance test |
|---|---|---|---|
| 15 | `docs/specs/0a-foundation-harness/SPEC.md` preenchido (não placeholder) com Outcomes específicos desta sprint + Scope in/out + Constraints + Prior decisions + Task breakdown | 7 | `grep -q 'sprint-id: "0a"' docs/specs/0a-foundation-harness/SPEC.md && ! grep -q '{ID}' docs/specs/0a-foundation-harness/SPEC.md` |
| 16 | `docs/specs/0a-foundation-harness/PROGRESS.md` preenchido com sessão registrada | 9 | `grep -q 'sprint-id: "0a"' docs/specs/0a-foundation-harness/PROGRESS.md && grep -q '### 2026-05-19' docs/specs/0a-foundation-harness/PROGRESS.md` |
| 17 | `docs/specs/0a-foundation-harness/CONTRACT.md` (este arquivo) com `status: locked` | 8,15 | `grep -q 'status: locked' docs/specs/0a-foundation-harness/CONTRACT.md` |

### Wave 4 — Validação (depende de tudo acima)

| # | Item | Depende de | Acceptance test |
|---|---|---|---|
| 18 | Zero regressão: `bun run test --filter=@adsmart/shared` continua 195/195; nenhum arquivo `.ts`/`.tsx` foi tocado nesta sprint | 1-17 | `bun run test --filter=@adsmart/shared 2>&1 \| grep -q 'Tests  195 passed'` e `git diff --stat $(git merge-base HEAD origin/develop) HEAD -- '*.ts' '*.tsx' \| wc -l` retorna apenas linha total (sem arquivos) |
| 19 | `docs/specs/0a-foundation-harness/EVALUATION.md` preenchido com `verdict: pass` após verificação manual de items 1-18 | 18 | `grep -q 'verdict: pass' docs/specs/0a-foundation-harness/EVALUATION.md` |

## Out of scope (explicit)

Sem ambiguidade — isto NÃO faz parte desta sprint:

- [ ] Atualizar `.claude/settings.json` com hook configurations novos — **Fase 0b**
- [ ] Criar `.claude/skills/-screen/`, `new-zod-schema/`, etc. — **Fase 0b**
- [ ] Criar `.claude/commands/new-sprint.md`, `/research-sprint`, etc. — **Fase 0b**
- [ ] Atualizar `AGENTS.md` root ou criar sub-AGENTS.md por área — **Fase 0b**
- [ ] Criar ou atualizar arquivos de memory em `.claude/projects/.../memory/` — **Fase 0c**
- [ ] Publicar ADRs (Harness, Multi-process agents, etc.) — **Fase 0d**
- [ ] Refatorar agents existentes (`firestore-*-reviewer`, `functions-security-reviewer`) — **fora  ** (esses agents são specializados em revisão, não em workflow de sprint; coexistem)
- [ ] Implementar slash commands automatizados — **Fase 0b**
- [ ] Conexão real com MCP servers novos — **fora do escopo** (já configurados via `.claude/settings.json` enabledPlugins)
- [ ] Mudanças em `firestore.rules` ou `firestore.indexes.json` — fora do escopo
- [ ] Mudanças em código TS/TSX da app — esta sprint é puramente infraestrutura (`.md` + `.sh`)

## Sensors a rodar

### Computacionais (bloqueantes)

- [x] `bash -n scripts/harness/*.sh` — sintaxe shell válida
- [x] `chmod +x scripts/harness/*.sh` — executáveis
- [x] Smoke test `new-sprint.sh tmpsprint test && rm -rf docs/specs/tmpsprint-test` — instanciação funciona
- [x] `bun run test --filter=@adsmart/shared` — 195/195 verde
- [x] `bun run typecheck` — verde (nenhum TS tocado, mas roda pra confirmar)
- [x] Pre-commit hooks via `git commit` — passam (nenhum hook bloqueante atinge `.md` ou `.sh` no `scripts/harness/`)

### Inferenciais (seletivos)

- [ ] Auto-revisão final: relê HARNESS-RUNBOOK e confirma que descreve o fluxo correto sem contradizer agents
- [ ] (Opcional, futuro) `pr-review-toolkit:code-reviewer` no PR — não bloqueia merge

## Sign-off

- [ ] Implementer assinou — commits da sprint pushed
- [ ] Validator assinou — EVALUATION.md `verdict: pass`
- [ ] Human revisou — PR aberto e mergeado
