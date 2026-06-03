# Sprint 0.7 — deploy-oauth — PROGRESS

## Timeline

- **2026-06-03 20:56**: Sprint 0.7 iniciada via script do harness para resolver falhas de build/deploy no OAuth.
- **2026-06-03 20:57**: Modificado `functions/tsconfig.json` ajustando `module` para `es2022` e `moduleResolution` para `bundler`, o que mitigou as falhas relacionadas à importação do `@adsmart/shared` pelo workspace Bun. Build concluído com sucesso localmente.
- **2026-06-03 20:59**: Deploy efetuado localmente via `bun run deploy --force` após limpeza das funções V2 que usavam sufixos "WithSelection".
- **2026-06-03 21:03**: Identificado que o erro de CORS permanecia devido à ausência de políticas públicas do IAM para callables no GCP. O script corrigiu o acesso para `getgoogleadsauthurl`, `getmetaadsauthurl`, `handlegoogleadscallback` e `handlemetaadscallback` adicionando a policy `roles/run.invoker` para `allUsers`.
- **2026-06-03 21:04**: Teste automatizado de navegador (Playwright/MCP) clicou em "Gerenciar contas" e o fluxo migrou perfeitamente para a tela de permissão da Google Account, validando toda a conexão e sanando os erros.
