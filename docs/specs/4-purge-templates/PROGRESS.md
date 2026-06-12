---
sprint-id: "4"
name: "purge-templates"
started: "2026-05-30"
status: done  # in-progress | blocked | done
current-step: validate  # research | plan | contract | implement | validate | ship
---

# Sprint 4 — purge-templates — PROGRESS

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

### 2026-05-30 — Session N: {short name}

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

### 2026-06-11 22:55 — Fix account connection status UI coloring
- Changed `bg-[var(--success)]` to `bg-[var(--positive)]` for the active account status dots in `IntegrationsPage.tsx` and `ConnectedAccountsModal.tsx` to match the project's true green tone, avoiding the monochrome mapping of `--success` in light mode.
- Updated the "Conectada" badge in `IntegrationsPage.tsx` to use the `--positive` CSS variable set for better visibility.
