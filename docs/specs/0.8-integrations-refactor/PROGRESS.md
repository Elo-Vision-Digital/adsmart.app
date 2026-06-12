---
sprint-id: "0.8"
name: "integrations-refactor"
started: "2026-06-04"
status: in-progress  # in-progress | blocked | done
current-step: research  # research | plan | contract | implement | validate | ship
---

# Sprint 0.8 — integrations-refactor — PROGRESS

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

### 2026-06-04 — Session N: Fixes & Audit

- [x] Correção de botão "Demo" esquecido e referências `handleAddMockAccounts` removidas de `ProjectsPage.tsx`
- [x] Implementação i18n completa corrigida no arquivo `AccountSelectionModal.tsx` substituindo `react-i18next` por `useLanguage` 
- [x] Fix no TS erro 2345: `useLanguage` não aceita default values como em outros pacotes. Chaves (`newProjectDesc`, `orphanAccountsSubtitle`) adicionadas ao `pt-BR.json`, `en.json` e `es.json`
- [x] Removidos imports não utilizados de icons (`Database`) e utils (`addMockAccounts`) 
- [x] Validação visual final pelo Chrome DevTools/Playwright 

### 2026-06-04 — Session N+1: Audit & Bug Fix do Erro 404 de OAuth

- [x] Auditoria do fluxo OAuth concluída após o erro "Request failed with status code 404".
- [ ] Atualização do endpoint Google Ads API para `v24` em `functions/src/googleAdsOAuth.ts` (substituindo `/v19/` hardcoded que sofreu sunsetting e gerava o 404).
- [ ] Atualização do endpoint Meta Graph API para `v25.0` em `functions/src/metaAdsOAuth.ts`.
- [ ] Adequação do `region: config.project.region` explicitamente declarado em todos os `@onCall` v2 (seguindo regras do AGENTS.md e `priceManager.ts`).

**Saída para próxima session**: Aguardando aprovação do implementation plan para corrigir o backend.

### 2026-06-11 — Session N+2: UX Refinements & OAuth state bugfix

- [x] Correção de state handling na OAuthCallbackPage usando `BroadcastChannel` para evitar null `window.opener` e state bugs.
- [x] Diagnóstico de falha silenciosa de CORS no Cloud Functions dev: O IAM `allUsers` é dropado ao realizar redeploy de função privada sem interatividade.
- [x] Injeção de policy `roles/run.invoker` diretamente via `gcloud run services add-iam-policy-binding` sem gerar nova revisão do serviço.
- [x] Melhoria de UX: exibição imediata do modal de carregamento de contas ao receber o callback OAuth, ao invés de um bloqueio invisível na página.
- [x] Inclusão de `loadingAccounts` key nos 3 arquivos de i18n (`pt-BR`, `en`, `es`).

## Decisions taken

Decisões não-óbvias que afetam a sprint. Cita razão:

- **Decisão**: Atualizar Graph API para v25.0 e Google Ads API para v24. — **Razão**: A v19 (Google) alcançou o período de sunsetting, resultando em respostas 404 silenciosas vindas do pacote `axios` no backend, o que disfarçava o erro real no console do usuário.
- **Decisão**: Remover strings de versões hardcoded na URL do `axios`. — **Razão**: Mitigar novos bugs de sunsetting obrigando a leitura da versão através de `config/index.ts`.
- **Decisão**: Usar `BroadcastChannel` para comunicação entre popup e parent. — **Razão**: Cross-origin isolation (COOP/COEP) nos browsers mais novos frequentemente anula `window.opener` em redirects complexos de OAuth.

### 2026-06-12 — Session N+3: Individual Account Disconnect & Visualization UX

- [x] Criação do `ConnectedAccountsModal.tsx` listando as dezenas de contas usando filtro/busca.
- [x] Atualização de `IntegrationsPage.tsx` para suporte nativo a remoção individual de conta via `deleteDoc` em vez de apenas desvincular a plataforma por inteiro.
- [x] Conversão do contador de "+X contas" para um `<button>` acionável que aciona o modal.
- [x] Refatoração de tradução para adicionar chaves pt-BR, en e es sem destruir as que já existiam na tag `accountsPage`.

## Blockers / risks

- **Blocker**: Nenhum
- **Risk mitigated**: O uso do i18n e a ausência de literais hardcoded, bem como falhas de typecheck foram corrigidas. 
- **Erros cometidos (Memória para evitar repetição)**: 
  1. Uso de import de bibliotecas que não estão configuradas no repo original (Ex: usar `useTranslation` do `react-i18next` no lugar do contexto nativo do projeto `useLanguage` importado de `@/contexts/LanguageContext`). A stack de i18n é custom (JSONs locais, hook próprio). 
  2. Esquecimento de hardcoded strings (Regra 7 de i18n violada): `t()` nativo do app só recebe a key. Uso incorreto de string como valor padrão dentro da função `t()` causa crash na build no CI.
  3. Esquecer features de dev / botões falsos (como MockAccounts / Demo) nas páginas ao limpá-las para produção. Importante varrer a tela inteira em busca desses lixos.
  4. Presumir que o Firebase CLI em modo non-interactive reseta o IAM de uma Cloud Function para público (ele não faz isso se a função já for privada ou se o prompt for bypassado). Solução limpa: usar `add-iam-policy-binding` do `gcloud run` para não poluir o histórico de builds de uma função gerenciada pelo Firebase.
  5. **Mútua exclusividade de edição JSON**: Substituir uma tag json (ex: `accountsPage`) por uma nova ao adicionar keys de tradução, apagando keys importantes que já existiam e estavam sendo usadas na mesma feature, gerando quebra silenciosa da tipagem. A checagem cuidadosa das tags preexistentes previne regressão nas traduções.

## Tests/build status

```text
bun run test --filter=@adsmart/shared    →  XXX/XXX verde
bun run typecheck                         →  verde
bun run build (functions)                 →  verde
```

## Next steps

1. Próxima ação concreta
2. …
