---
sprint-id: "0.6"
name: "oauth-consolidation"
status: evaluation
depends-on: ["0.5"]
est-days: 1
references:
  - docs/OAUTH.md
  - docs/API-CONTRACTS.md
---

# Sprint 0.6 — oauth-consolidation — SPEC

> Refatoração e unificação do fluxo de OAuth para Google Ads e Meta Ads, removendo a distinção entre V1 e V2.

## Outcomes

- [x] Consolidar `getGoogleAdsAuthUrl` e `handleGoogleAdsCallbackWithSelection` (e Meta) em um fluxo único.
- [x] Remover sufixos `V2` e `WithSelection`.
- [x] Manter a lógica de tokens temporários via AES-256-GCM.
- [x] Garantir que o frontend (`IntegrationsPage.tsx`, `OAuthCallbackPage.tsx`) aponte para os endpoints consolidados.
- [x] Atualizar a documentação (OAUTH.md e API-CONTRACTS.md).

## Scope

### In
- Back-end: Mesclar `googleAdsOAuthV2.ts` em `googleAdsOAuth.ts`, e `metaAdsOAuthV2.ts` em `metaAdsOAuth.ts`.
- Exportações no `functions/src/index.ts`.
- OAUTH.md, API-CONTRACTS.md, AGENTS.md.
- Atualização do hook/service frontend.

### Out
- Nenhuma mudança na interface visual (UI) do modal de conexão ou na renderização dos componentes, apenas mudança nos hooks.

## Constraints
- A compilação do TypeScript pode apresentar erros residuais (`moduleResolution`) em outros arquivos do workspace, porém os arquivos editados devem estar em total conformidade.
- A segurança via `temporary_oauth_tokens` com encriptação não pode ser comprometida.

## Prior decisions
- Manteremos a arquitetura de tokens temporários criada na V2 (ADR-019), tornando-a a única forma de autenticação. Os retornos antigos e lógicas inseguras de V1 serão removidos.
