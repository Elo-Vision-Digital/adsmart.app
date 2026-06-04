# Sprint 0.6 — oauth-consolidation — CONTRACT

> **Regra de Ouro**: O agente Implementer SÓ pode criar/editar arquivos *após* este contrato ter status `locked` no header YAML da `SPEC.md`. (BACKFILL: executado retroativamente)

## Acceptance criteria (The Contract)

### 1. Documentação Consolidada
- **Status**: PASSED
- **Test**: `cat docs/OAUTH.md` reflete o fluxo V2 único e não cita mais a versão obsoleta.

### 2. Backend API Renomeada
- **Status**: PASSED
- **Test**: `googleAdsOAuth.ts` e `metaAdsOAuth.ts` possuem as funções `handleGoogleAdsCallback` e `handleMetaAdsCallback` respectivamente. Os arquivos `*V2.ts` foram deletados.

### 3. Integração Frontend
- **Status**: PASSED
- **Test**: `oauthServices.ts` invoca `handleGoogleAdsCallback` e não a versão terminada em `WithSelection`.

### 4. Zero Regressão Funcional de UI
- **Status**: PASSED
- **Test**: Acessar `http://localhost:5173/integrations` através do Chrome DevTools MCP e garantir que a renderização inicial (`take_snapshot`) retorne a tela corretamente.
