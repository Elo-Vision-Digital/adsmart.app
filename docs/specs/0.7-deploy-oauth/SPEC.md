---
sprint-id: "0.7"
name: "deploy-oauth"
status: locked
depends-on: ["0.6"]
est-days: 1
references:
  - docs/OAUTH.md
---

# Sprint 0.7 — deploy-oauth — SPEC

> Correção do build TypeScript nas functions e deploy da nova versão unificada do OAuth.

## Outcomes

- [x] O `functions/tsconfig.json` terá a resolução de módulos configurada para `bundler`, evitando erros TS2307 de workspaces.
- [x] O código da pasta `functions` passará no `bun run build`.
- [x] A nova stack unificada do OAuth estará online (`firebase deploy --only functions`).
- [x] Conexões do frontend para as APIs do OAuth devem ocorrer com HTTP 200 via `httpsCallable`.

## Scope

### In
- Modificar o `tsconfig.json` do `functions/`.
- Deploy das funções.
- Teste com DevTools no Chrome.

### Out
- Nenhuma outra refatoração de código será feita neste pacote. Somente resolução de build e deploy.

## Constraints
- Apenas alterar `compilerOptions` para alinhar à engine do bun/workspace.
- Validar se existem erros que não sejam referentes ao `@adsmart/shared` e tratá-los caso existam.
