---
sprint-id: "2"
name: "ui-shell"
started: "2026-05-29"
status: in-progress  # in-progress | blocked | done
current-step: research  # research | plan | contract | implement | validate | ship
---

# Sprint 2 — ui-shell — PROGRESS

> Memory artifact (persiste entre sessions). Bootstrap script lê este arquivo PRIMEIRO ao iniciar nova session.
>
> **Regra crítica**: atualizar ANTES de compactar contexto ou encerrar sessão. Próxima session depende.

## Status

| Field | Value |
|---|---|
| Branch | `feat/...` |
| Last commit | `hash` — descrição curta |
| Tests | verde/red — link para output |
| Build | verde/red |
| Blockers | nenhum / lista |

## Sessions log

### 2026-05-29 — Session N: {short name}

- [x] Action taken
- [x] Action taken
- [ ] Pending action

**Saída para próxima session**: …

## Decisions taken

Decisões não-óbvias que afetam a sprint. Cita razão:

- **Decisão**: … — **Razão**: … (referencia ADR ou research se aplicável)

## Blockers / risks

- **Blocker**: descrição + quem precisa resolver + ETA
- **Risk mitigated**: descrição + como foi mitigado

## Tests/build status

```text
bun run test --filter=@adsmart/shared    →  XXX/XXX verde
bun run typecheck                         →  verde
bun run build (functions)                 →  verde
```

## Next steps

1. Próxima ação concreta
2. …
