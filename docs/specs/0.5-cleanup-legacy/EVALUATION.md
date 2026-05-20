---
sprint-id: "0.5"
name: "cleanup-legacy"
validated-on: "2026-05-19"
validator: "agent:validator"
verdict: pending  # pass | fail | pending
---

# Sprint 0.5 — cleanup-legacy — EVALUATION

> Sensor feedback artifact. Validator preenche depois que Implementer commitou. Score binário por item.
>
> Validator **NÃO TEM permissão de Edit/Write em código**. Só lê e julga. Falha em qualquer item → loop de correção.

## Verdict

**PASS** ✅ ou **FAIL** ❌

## Score por item do CONTRACT

| # | Item | Score | Evidência |
|---|---|---|---|
| 1 | Criar `packages/shared/src/schemas/foo.ts` | ✅ PASS | `git ls-files` confirma arquivo + `bun run test` verde |
| 2 | Refatorar `bar.ts` | ❌ FAIL | `grep "OldType"` ainda retorna 3 ocorrências |

## Computational sensors output

```text
bun run lint                  →  PASS (0 errors, 2 warnings non-blocking)
bun run typecheck             →  PASS
bun run test (shared)         →  PASS (195/195)
bun run build (functions)     →  PASS
.claude hooks                  →  PASS (all PreToolUse passed)
```

## Inferencial sensors (se rodados)

- `pr-review-toolkit:code-reviewer` → PASS / FAIL — link para output
- `functions-security-reviewer` → PASS / FAIL — link

## Fix list (se FAIL)

Itens que precisam correção antes de re-validar. Devolve para Implementer:

1. Item: …
   - **Onde**: arquivo:linha
   - **Esperado**: …
   - **Atual**: …
   - **Hint**: …

## Sign-off

- [ ] Validator concluiu análise item-a-item
- [ ] Computational sensors rodados
- [ ] Inferencial sensors rodados (quando aplicável)
- [ ] Verdict registrado (PASS/FAIL)
- [ ] Se FAIL: fix list enviado ao Implementer via `docs/specs/{id}/PROGRESS.md`
