---
sprint-id: "3"
name: "ui-dashboard"
started: "2026-05-29"
status: done  # in-progress | blocked | done
current-step: research  # research | plan | contract | implement | validate | ship
---

# Sprint 3 — ui-dashboard — PROGRESS

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

### 2026-05-30 — Refatoração Integrations e Transactions

- [x] Refatorado `IntegrationsPage.tsx` para o layout V2 (Projects-first).
- [x] Refatorado `TransactionsPage.tsx` incluindo correção pontual para alinhar o extrato perfeitamente ao protótipo.
- [x] Antiga `IntegrationsPage.tsx` renomeada para `ProjectsPage.tsx` na rota `/projects`.
- [x] Nova `IntegrationsPage.tsx` criada baseada no protótipo HTML (Figma) na rota `/integrations`.
- [x] Atualizado `Sidebar.tsx` e `App.tsx` refletindo as rotas independentes de Projetos e Integrações.

**Saída para próxima session**: Layouts de Projetos, Integrações e Créditos implementados com sucesso e typecheck passando verde.

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
