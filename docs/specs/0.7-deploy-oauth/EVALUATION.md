---
sprint-id: "0.7"
name: "deploy-oauth"
verdict: pass
---

# Sprint 0.7 — deploy-oauth — EVALUATION

## Verification criteria

1. **Build Resolvido**: `pass` — Modificar o `moduleResolution` para `bundler` e a engine do `module` para `es2022` corrigiu a importação da monorepo (`@adsmart/shared`) na suíte de Cloud Functions. `bun run build` foi bem-sucedido e não retornou tipagens inferidas falsas (`TS2307`/`TS7006`).
2. **Deploy Efetivado**: `pass` — Deploy concluído via CLI `bun run deploy --force`. As funções legadas foram substituídas e a UI agora reporta que `getMetaAdsAuthUrl` e outras 15 funções foram atualizadas ou criadas na V2.
3. **Validação Frontend End-to-End**: `pass` — IAM policies para Cloud Run public invoker (`allUsers`) inseridas com sucesso. Browser MCP comprovou redirecionamento final da URL de integração, superando as falhas de CORS pré-flight.
