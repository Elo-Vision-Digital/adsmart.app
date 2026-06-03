# Sprint 0.7 — deploy-oauth — CONTRACT

> **Regra de Ouro**: O agente Implementer SÓ pode criar/editar arquivos *após* este contrato ter status `locked` no header YAML da `SPEC.md`.

## Acceptance criteria (The Contract)

### 1. Build Resolvido
- **Test**: O comando `bun run build` dentro do diretório `functions` não falha com o erro `TS2307: Cannot find module '@adsmart/shared'`. O arquivo `functions/tsconfig.json` tem `moduleResolution` como `bundler`.

### 2. Deploy Efetivado
- **Test**: O log da AWS/GCP (Firebase) mostra que o `firebase deploy --only functions` foi executado com sucesso e não há endpoints V2 sendo implantados, somente as rotas V1 padronizadas.

### 3. Validação Frontend End-to-End
- **Test**: Na página `http://localhost:5173/integrations`, o clique no botão "Gerenciar contas" aciona o `getGoogleAdsAuthUrl` e o sistema não retorna erro CORS/500, respondendo em vez disso com status 200 e a URL correspondente (ou acionando o redirecionamento oauth).
