# AdSmart — Modernização, Segurança e Camada de IA

**Data:** 2026-04-24
**Projeto:** adsmart-app (Firebase + React + Vite)
**Status:** Aprovado pelo usuário (opção B: manter Firebase, modernizar in-place)

## 1. Contexto

O projeto AdSmart está parado desde agosto de 2025 e acumulou dívida técnica em três dimensões:

1. **Stack desatualizada** — React 18, Tailwind 3, Firebase SDK 10, react-router-dom 6, firebase-admin 12/13 divergentes, zod 3, framer-motion (renomeado para `motion`), ESLint 8 nas functions.
2. **Higiene de repositório** — `.backups/` com 8 arquivos `.env` versionados por typo no `.gitignore` (`.backup/` vs `.backups/`), `firebase-admin` no bundle do frontend, `tsconfig.json` do frontend importando arquivo de functions, código morto, sem testes, sem CI, sem hooks, sem documentação para agentes IA.
3. **Segurança** — validação de hash do webhook SuitPay opcional, IP allowlist não bloqueia, rules do Firestore com algumas brechas (`rateLimits` gravável pelo dono), headers de hosting sem CSP/HSTS, mistura de `process.env` e `defineSecret` nas Cloud Functions, route `/admin` sem guard de admin no client.

**Decisões do usuário fixadas:**

- Manter stack Firebase (não migrar para Next.js/Prisma).
- Secrets vazados: repo é privado, acesso só do usuário, rotação adiada — apenas remover `.backups/` da árvore atual e corrigir `.gitignore`.
- Pagamentos: **SuitPay vai sair em favor do Asaas** em fase futura. Código SuitPay **não recebe investimento** nesta modernização — apenas o mínimo para não quebrar.
- Upgrades: **todos de uma vez** (React 19, Tailwind 4, Router 7, firebase 11, firebase-admin 13, TS 5.9, motion, zod 4, ESLint 9 nas functions).
- Testes: **opção C** — scaffolding Vitest + bateria nas áreas que permanecem após Asaas (rules, rate limiter, admin guard, OAuth Google/Meta, utils).
- Tailwind 4 aprovado mesmo com necessidade de QA visual.
- i18n: quebrar `LanguageContext.tsx` (1489 linhas) em arquivos JSON de locale.

## 2. Ordem de fases

```
Fase 1 (Limpeza + Testes) → Fase 3 (Segurança) → Fase 4 (Docs/IA) → Fase 2 (Upgrades)
```

Motivação da ordem:

- **Segurança antes dos upgrades** porque já há buracos identificados e não faz sentido modernizar código inseguro.
- **Docs/IA antes dos upgrades** para o contrato de comportamento ficar documentado antes das mudanças grandes — a documentação vira oráculo de regressão.
- **Upgrades no final** porque são os mais invasivos e se beneficiam da rede de segurança (testes, docs, CI) construída antes.
- **Migração Asaas** NÃO faz parte deste plano — entra como trabalho futuro.

## 3. Fase 1 — Limpeza e Fundação

### 3.1 Limpeza de repositório

- Remover `.backups/` da árvore atual (`git rm -r .backups/`). Histórico permanece, mas árvore fica limpa.
- Corrigir `.gitignore`: `.backup/` → `.backups/` (ou adicionar ambos).
- Remover `src/pages/_deleted/` e `src/test-translations.ts.bak`.
- Remover `dist/` versionado (adicionar ao `.gitignore` se ainda não estiver — já está).
- Remover `firebase-admin` de `dependencies` no `package.json` da raiz (só pode viver em `functions/`).
- Corrigir `tsconfig.json`: remover `functions/src/rateLimiter.ts` do `include`, unificar `target` e `lib` com `tsconfig.app.json` (ES2022).
- Corrigir inconsistência de env var: `.env.example` define `VITE_USE_EMULATORS`, código em `src/firebase/config.ts` lê `VITE_USE_FIREBASE_EMULATOR`. Padronizar para **`VITE_USE_FIREBASE_EMULATOR`** (nome mais explícito) e atualizar `.env.example`.
- Remover `test-translations.ts.bak` do `src/`.

### 3.2 Quebra do i18n

- Criar `src/locales/pt-BR.json` e `src/locales/en.json` (outros locales se existirem) extraindo as traduções atualmente inline em `src/contexts/LanguageContext.tsx`.
- Reescrever `LanguageContext.tsx` como loader: carrega o JSON do locale ativo, mantém mesma API pública (`useLanguage`, `setLanguage`).
- Preservar 100% das chaves e valores — nenhuma mudança de UX.
- Resultado: `LanguageContext.tsx` sai de 1489 linhas para ~60-80 linhas.

### 3.3 Ferramentas operacionais

- **Biome** como formatter + linter único, substituindo ESLint no frontend. Manter ESLint apenas nas functions (porque functions usa config Node com convenções diferentes — e o upgrade para ESLint 9 flat já está planejado na Fase 2). `biome.json` com regras padrão + overrides para React.
- **lefthook** com hooks:
  - `pre-commit`: Biome check (staged files only)
  - `pre-push`: `tsc --noEmit` no frontend + `tsc --noEmit` nas functions
- **GitHub Actions** CI (`.github/workflows/ci.yml`):
  - Job `web`: install → biome check → tsc → vite build
  - Job `functions`: install → eslint → tsc → build
  - Trigger: push em `main` e `migrate`, pull_request
- **Vitest** scaffolding:
  - `vitest.config.ts` no frontend
  - `vitest.config.ts` em `functions/`
  - Scripts `test`, `test:watch`, `test:coverage` em ambos os `package.json`
  - Setup file com mocks globais se necessário

### 3.4 Testes (opção C — bateria inicial)

Áreas cobertas (todas sobrevivem à migração Asaas):

1. **Firestore rules** — usar `@firebase/rules-unit-testing` contra o emulador para validar:
   - Usuário só lê/escreve em `users/{seuId}/**`
   - `rateLimits` não pode ser escrito arbitrariamente (ver correção na Fase 3)
   - `securityLogs`, `backupMetadata`, `reportTemplates`, `systemConfig`, `productPrices` bloqueiam write do cliente
   - `campaigns` só visível/editável pelo dono (`userId` match)
   - `activityLogs` imutáveis após criação
2. **Rate limiter** (`functions/src/rateLimiter.ts`) — testar primeira tentativa, reset de janela, bloqueio após `maxAttempts`, persistência de `blocked` após janela expirar.
3. **Admin guard** (`functions/src/adminWalletManager.ts`) — garantir que `addUserCredits` rejeita usuário não-admin, aceita admin, valida input, é idempotente onde deveria ser.
4. **OAuth Google Ads V2** (`functions/src/googleAdsOAuthV2.ts`) — testar fluxo `handleGoogleAdsCallbackWithSelection` e `confirmGoogleAdsAccountSelection` com tokens mockados; validação de state, expiração de token.
5. **OAuth Meta Ads V2** (`functions/src/metaAdsOAuthV2.ts`) — mesma cobertura.
6. **Utils de sanitize/validation** (`src/utils/sanitize.ts`, `src/utils/validation.ts`) — testes de casos de input malicioso (XSS, SQL-like, null bytes).

Cobertura alvo: **80%+ nas áreas acima**. Não é cobertura total do projeto.

### 3.5 Saída da Fase 1

- Repositório limpo (sem backups, sem código morto, sem deps indevidas).
- Biome + lefthook + CI rodando.
- Vitest scaffoldado com ~25-40 testes em áreas críticas.
- i18n refatorado.
- **Nenhuma mudança de comportamento visível ao usuário final.**

## 4. Fase 3 — Segurança (executada depois da Fase 1)

### 4.1 Firestore rules

- Revisar `match /rateLimits/{userId}`: atualmente `allow write: if isOwner(userId) && request.resource.data.count <= 1000` é contornável pelo próprio usuário (ele resetaria o contador). Mudar para `allow write: if false` — rate limit deve ser escrito **apenas** via Admin SDK nas Cloud Functions.
- Revisar `match /users/{userId}/{document=**}` — regra muito ampla. Quebrar em regras específicas por subcoleção (`wallet`, `transactions`, `oauthConnections`) com restrições apropriadas (ex.: usuário não pode escrever `wallet/current` — isso é só via Cloud Function).
- Adicionar testes de regras para cada mudança (conectam com a Fase 1).

### 4.2 Headers de Firebase Hosting

- Adicionar `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- Adicionar `Content-Security-Policy` (restritivo mas permitindo Firebase/reCAPTCHA/Google fonts).
- Remover `X-XSS-Protection` (obsoleto, causa problemas em alguns browsers modernos).
- Considerar `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Resource-Policy: same-origin`.

### 4.3 Secrets nas Cloud Functions

- Padronizar: todas as functions usam `defineSecret` + injeção via `{ secrets: [...] }` no trigger, **nunca** `process.env` direto.
- Atualmente `suitpayPayment.ts` e `suitpayWebhook.ts` usam fallback `process.env.SUITPAY_CLIENT_SECRET` — remover. **Exceção:** como SuitPay está saindo, apenas documentar como legado em `docs/DECISIONS.md` e marcar em TODO para remoção junto com a migração Asaas.
- `recaptcha.ts` usa `process.env.RECAPTCHA_SECRET_KEY` — migrar para `defineSecret`.
- Verificar `googleAdsOAuth*`, `metaAdsOAuth*` — migrar para `defineSecret` se ainda não usam.

### 4.4 Admin guard no client

- Criar `AdminRoute` que estende `PrivateRoute` e verifica claim `admin` no token do usuário.
- Aplicar em `/admin` no `App.tsx`.
- Documentar no `docs/SECURITY.md` como adicionar o claim via Admin SDK.

### 4.5 Logging sanitizado

- Webhook SuitPay atualmente salva `request.headers` inteiro em Firestore (`webhook_logs`). Como SuitPay vai sair, apenas **reduzir o log** para `user-agent`, `x-forwarded-for`, `content-type` — nada mais — e documentar que a coleção será removida com a migração Asaas.
- Outras functions: auditar uso de `console.log(request.body)` em endpoints que recebem dados sensíveis.

### 4.6 SuitPay — mínimo obrigatório

Como está saindo, NÃO investir em:
- Tornar hash obrigatório (vai sair)
- IP allowlist real (vai sair)

Mas SIM:
- Adicionar comentário `// @deprecated - será substituído pela integração Asaas` no topo dos arquivos SuitPay.
- Adicionar entrada em `docs/DECISIONS.md` registrando a decisão.

### 4.7 CSP inline tracking

- Auditar uso de `dangerouslySetInnerHTML`, `eval`, inline scripts. Se houver, ajustar CSP para acomodar ou refatorar.

## 5. Fase 4 — Documentação e Camada de IA (executada depois da Fase 3)

### 5.1 Arquivos raiz

- **`AGENTS.md`** — Project Overview, stack table, read-first map (quais arquivos ler primeiro para cada tipo de tarefa), scopes de commit, convenções.
- **`CLAUDE.md`** — Variante específica para Claude Code com stack table e design system inline (cores, tipografia, componentes shadcn usados).
- **`README.md`** — Atualizar com setup, scripts, fluxo de desenvolvimento.

### 5.2 Pasta `docs/`

Arquivos **permanentes** (independentes de SuitPay):

- `Decisions.md` — ADRs retroativos: por que Firebase, por que React, por que Firestore, por que Cloud Functions v2, por que Asaas (futuro).
- `ENVIRONMENT.md` — vars de ambiente, emuladores, fluxo dev → staging → prod.
- `DATA-MODEL.md` — coleções e subcoleções Firestore (users, users/**/wallet, users/**/transactions, campaigns, reports, reportTemplates, productPrices, systemConfig, activityLogs, rateLimits, securityLogs, pendingPayments, payments, orphan_payments, webhook_logs, backupMetadata).
- `API-CONTRACTS.md` — todas as callable functions (input/output/auth) + webhook.
- `DOMAIN.md` — regras de negócio: wallet em centavos, relatórios descontam saldo, campanhas draft vs active, OAuth por provedor.
- `SECURITY.md` — rules, headers, rate limit, reCAPTCHA, claims de admin, fluxo de secrets.
- `PAYMENTS.md` — fluxo PIX/SuitPay atual (marcado deprecated) + placeholder para Asaas.
- `OAUTH.md` — Google Ads V2 + Meta Ads V2 (fluxo completo, tokens, refresh, storage).
- `I18N.md` — estrutura de locales, como adicionar idioma novo.
- `TESTING.md` — estratégia Vitest + emuladores Firebase + `@firebase/rules-unit-testing`.
- `DEPLOYMENT.md` — Firebase Hosting + Functions + GitHub Actions CI.
- `QA-CHECKLIST.md` — checklist manual antes de deploy em prod.
- `CHANGES.md` — log de mudanças relevantes por data.

### 5.3 Sub-AGENTS.md

- `src/AGENTS.md` — convenções do frontend (rotas, contexts, padrão de páginas, convenção de i18n).
- `functions/AGENTS.md` — convenções do backend (v2 triggers, secrets, rate limiter, security logger, região `us-central1`).

### 5.4 Camada `.claude/` (opcional, se usuário quiser)

Skills atômicas + subagents + slash commands específicos do projeto. **Decisão deferida ao final da Fase 4** — usuário decide se quer agora ou depois.

## 6. Fase 2 — Upgrades da Stack (por último, em PRs sequenciais)

Ordem de sub-etapas, cada uma é um commit separado (não PR se local, mas agrupamento lógico):

### 6.1 Etapa 2a — Baixo atrito

- TypeScript 5.2 → 5.9 (frontend + functions)
- firebase JS SDK 10 → 11
- firebase-admin 12 → 13 (functions) — frontend já removeu na Fase 1
- lucide-react 0.396 → 1.0 (bundle menor, possível renomeação de ícones — ajustar imports)
- Rodar `tsc`, Biome, build, testes. Aceitar quando tudo passar.

### 6.2 Etapa 2b — React 19

- `npx codemod@latest react/19/migration-recipe`
- Bump `react`, `react-dom`, `@types/react`, `@types/react-dom`
- Revisar: propTypes/defaultProps em function components, JSX transform, forwardRef deprecation
- Rodar suite de testes + smoke test manual

### 6.3 Etapa 2c — React Router 7

- Desinstalar `react-router-dom`, instalar `react-router`
- Atualizar imports em todos os arquivos (~25 arquivos)
- Atualizar `App.tsx` se necessário
- Zero-break se `future` flags já estavam habilitadas (validar)

### 6.4 Etapa 2d — Tailwind 4

- `npx @tailwindcss/upgrade`
- Migrar `tailwind.config.js` → `@theme` dentro do CSS principal
- Remover `autoprefixer`, `postcss` se não mais necessários (v4 tem engine Oxide próprio)
- Ajustar utilities renomeadas: `shadow-sm`→`shadow-xs`, `ring`→`ring-3`, `outline-none`→`outline-hidden`
- **QA visual manual** em: HomePage, LoginPage, Dashboard, SettingsPage, AdminPanel, PaymentSuccessPage, ReportsPage, TransactionsPage. Iniciar `vite dev` e navegar.

### 6.5 Etapa 2e — motion + zod 4

- `framer-motion` → `motion`, imports `motion/react`
- zod 3 → 4: pode exigir refactor de schemas conforme tamanho do uso. Se o refactor for grande, fazer em commits separados por área.

### 6.6 Etapa 2f — Functions ESLint 9 flat

- Migrar `functions/.eslintrc` → `functions/eslint.config.js` flat
- Bump `@typescript-eslint/*` de v5 para v8+
- Rodar lint, ajustar violações

### 6.7 Gate de cada etapa

- `tsc --noEmit` passa
- Biome/ESLint passa
- Build passa
- Testes existentes passam
- Nenhuma regressão visual (Tailwind 4)

## 7. O que **NÃO** está neste plano

- Migração SuitPay → Asaas (projeto separado, fase 5 futura)
- Rotação de secrets vazados (débito pendente do usuário, documentado em `docs/SECURITY.md`)
- Reescrita de páginas grandes (HomePage 810 linhas, GenerateReportPage 539) — fica para refatoração futura, não bloqueia modernização
- Reescrita dos OAuth V1 deprecated (`googleAdsOAuth.ts`, `metaAdsOAuth.ts`) — só V2 está em uso, V1 fica até limpeza futura
- Integração de Firebase App Check (vale avaliar na Fase 3 se tempo permitir)

## 8. Critérios de sucesso

1. `git log` limpo: sem `.backups/`, sem código morto, sem deps cruzadas.
2. `biome check .` e `eslint .` passam em 100%.
3. `tsc --noEmit` passa em frontend e functions.
4. Vitest roda e passa em todos os testes criados (meta 25+ testes, 80%+ em áreas cobertas).
5. `vite build` e `tsc` nas functions produzem output funcional.
6. GitHub Actions verde em PR de teste.
7. Firebase Hosting headers incluem HSTS + CSP.
8. Route `/admin` exige claim `admin`.
9. `AGENTS.md` + `CLAUDE.md` + todos os docs da seção 5.2 existem e refletem o código.
10. Stack em latest: React 19, Tailwind 4, Router 7, firebase 11, firebase-admin 13, TS 5.9, motion, zod 4.
11. Nenhum breaking change de UX: usuário final não percebe nada (exceto UI possivelmente diferente em detalhes após Tailwind 4 — aprovado pelo usuário).

## 9. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Tailwind 4 quebra visual em páginas não testadas | QA visual manual das páginas-chave; rollback do commit se necessário |
| zod 4 exige refactor grande de schemas | Fazer por área (validation.ts, forms, API contracts) em commits separados |
| React Router 7 quebra rotas com `future` flags não habilitadas | Auditar `App.tsx` antes; habilitar `future` flags primeiro se faltarem |
| OAuth V2 tem bug latente descoberto nos testes | Bugs reais que escaparam anteriormente são achado positivo; corrigir antes dos upgrades |
| Usuário precisa usar SuitPay durante o período | SuitPay é mantido funcional; apenas não recebe investimento de hardening |
| Regra `rateLimits` ao virar `write: false` quebra client | Verificar se alguma lógica client escreve direto; mover para callable function |
| Biome conflita com ESLint no frontend | Remover ESLint do frontend na Fase 1; functions mantém ESLint (próprio config) |

## 10. Próximo passo

Invocar `superpowers:writing-plans` para transformar este spec em plano de implementação executável com tasks numeradas.
