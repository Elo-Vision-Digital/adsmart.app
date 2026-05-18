# Auth Flow Hardening — Execution Log

Live log of the execution of [the implementation plan](../plans/2026-05-17-auth-flow-hardening-plan.md). Purpose: durable checkpoint so future sessions can resume without losing context. Delete when ADR-016 + CHANGES.md entry land in `develop` (Phase G).

## Spec / Plan

- Spec: [docs/superpowers/specs/2026-05-17-auth-flow-hardening-design.md](../specs/2026-05-17-auth-flow-hardening-design.md)
- Plan: [docs/superpowers/plans/2026-05-17-auth-flow-hardening-plan.md](../plans/2026-05-17-auth-flow-hardening-plan.md)
- Branch: `develop` (not main).
- Execution mode: superpowers:subagent-driven-development — one implementer subagent per task + spec compliance review + code quality review.
- Baseline commit before execution: `f5d5710` (plan commit).

## Task status

| Task | Status | Commit | Notes |
|---|---|---|---|
| PF1-PF4 | ✅ pre-flight | — | Web tests 61/61 verde. Functions tests precisam de emulators (pré-existente; não bloqueia). |
| A1 — shared admin module | ✅ | `621bfab` | Spec + quality approved. |
| A2 — shared password policy | ✅ | `710810a` | DONE_WITH_CONCERNS (commit do `dist/` inteiro, intentional per Step 7 do plano). Approved. |
| B1 — initializeAuth + persistence | ✅ | `daa9be6` | DONE_WITH_CONCERNS — adicionou `vi.mock('@/firebase/config')` em `src/test/setup.ts` porque `browserPopupRedirectResolver` é sentinel Error no node-esm bundle do firebase/auth (vitest happy-dom). Solução pragmática e bem documentada; tests overridem com `vi.mock` local se precisarem. |
| B2 — App Check gated init | ✅ | `78d6e3b` | Approved. Sem chunk app-check no bundle quando env-var vazia (gating funciona). |
| B3 — auth error map + type guards | ✅ | `0e4c58d` | Approved. 7 vitest passing. |
| B4 — AuthContext refactor | ✅ | `d9547e5` | Approved with follow-ups (issues #1 e #5 abaixo). |
| C1 — AuthLoadingFallback component | ✅ | `5c6283d` | Approved. 13 lines. |
| C2 — loading-aware route guards + tests | ✅ | `e917d96` | Approved. Replaced pre-existing `AdminRoute.test.tsx` (3 spyOn tests) with new context-provider pattern (4 tests). PrivateRoute.test.tsx novo (3 tests). Total +4 tests. Plan body tinha typo no `renderWithAuth` da AdminRoute test (dois `</AuthContext.Provider>`) — corrigido pelo implementer. |
| C3 — EmailVerificationBanner | ✅ | `86250ee` | Approved. Mounted como first child do `<main>` em MainLayout. 5 i18n keys novas em `common.emailVerification.*` em 3 idiomas + types.ts. Cuidado: `settingsPage.emailVerification` pré-existente continua intocado. |
| D1 — LoginPage refactor | ✅ | `c937d26` | Approved. signUp via Context (não mais direct call), shared validatePassword, shared error map. 12 i18n keys novas (3 common.error + 4 loginPage.error + 5 passwordPolicy). |
| D2 — ForgotPasswordPage | ✅ | `0cfdc7a` | Approved. Rota `/forgot-password` real. Privacy collapse: user-not-found também mostra success (sem enumeration). |
| D3 — SettingsPage password change | ✅ | `df2f5bc` | Approved. Shared validatePassword (era 6 chars; agora 8 + complexity). `authErrorToTKey` no catch. Conhecida regressão UX: `auth/wrong-password` agora colapsa para "credenciais inválidas" (privacy). |
| D4 — validation.ts shim | ✅ | `9cda1ee` | DONE inline (não dispatchado). Deletou `src/utils/validation.test.ts` (10 tests legacy, mesma cobertura no shared password.test.ts). `getPasswordStrength` mantido local. |
| E1 — bootstrapUser fallback | ✅ | `0dc4517` | Approved. Email fallback `event.data.email → providerData[].email → null`. Sem mais `email: ''` no Firestore. Telemetria estruturada JSON. |
| E2 — USER_DELETION enum | ✅ | `98fd369` | DONE inline. 1 valor enum adicionado para E3 consumir. |
| E3 — deleteUserData real | ⏳ pending | — | |
| E4 — DeleteDataPage double-confirm | ⏳ pending | — | |
| E5 — unify ADMIN_EMAILS server-side | ⏳ pending | — | |
| F1 — COOP downgrade | ⏳ pending | — | |
| G1-G6 — docs sweep | ⏳ pending | — | |

## Decisões / desvios do plano

- **B1: vi.mock global de `@/firebase/config` em `src/test/setup.ts`.** Origem: `initializeAuth({ popupRedirectResolver: browserPopupRedirectResolver })` crasha em `vitest` happy-dom porque o bundle node-esm do `firebase/auth` exporta `browserPopupRedirectResolver` como sentinel `Error`, não como classe. Trade-off: tests que precisem de Firebase real podem override com seu próprio `vi.mock`. Mock retorna objetos vazios (não jest auto-mock) — código que chamar método ausente falha alto, não silencia. Já existia precedente em `src/pages/admin/AdminDashboardPage.test.tsx`.

- **A2: `dist/` força-commitado.** O plano (Step 7) pediu `git add packages/shared/dist/` explicitamente. Implementer seguiu literalmente, e o commit incluiu também os artefatos de A1 (que estavam pendentes — A1 não pediu commit de dist). Resultado: dist agora reflete A1 + A2. Functions deploy consome dist por bundling (ADR-011). Convenção: `dist/` é gitignored MAS force-committed manualmente quando schemas/auth mudam. Documentar isso em ADR-016 ou follow-up.

- **B4: redundant force-refresh.** A revisão de qualidade flagou que cada sign-in faz `refreshAuthState` (= `getIdToken(true)` + `user.reload()`) E o listener `onAuthStateChanged` força refresh de novo via `getIdTokenResult(true)`. São 3 round-trips ao Identity Toolkit por sign-in. Correto, mas chatty. Decisão: aceitar para a primeira passada (correctness > perf). Otimizar em PR de follow-up se virar gargalo.

## Follow-ups abertos (não bloqueiam B5+)

Reportados pelo code-quality reviewer de B4. Endereçar em Phase G ou follow-up dedicado:

- **B4 issue #1 — Public pages flash:** Removendo `{!loading && children}` do Provider, páginas públicas (`/`, `/login`, `/privacy`, `/terms`) renderizam com `loading: true, user: null` por uma tick antes do listener resolver. `HomePage` lê `user` em 5 lugares para decidir CTA (logged-in → `/dashboard`, anônimo → `/login`); usuário recorrente vai ver "Entrar" piscar antes de "Dashboard". Phase C cobre páginas guardadas, NÃO públicas. **Ação:** decidir em G1/G2 se cobrimos com fallback em `MainLayout` ou aceitamos o flash (documentar em CHANGES.md).

- **B4 issue #5 — Silent catch em `getIdTokenResult(true)` failure:** Quando Identity Toolkit é inalcançável, fallback para `isAdminUser(null, user.email)` (allowlist apenas) sem log nem telemetria. **Ação:** adicionar `console.warn('[auth] token refresh failed', err)` no catch (Biome `noConsole` é warn-level, não block). Pequeno, ~1 linha. Pode fazer agora ou no follow-up.

- **B2 issue minor — `.catch` no dynamic import:** `void import('firebase/app-check').then(...)` não trata rejection. App Check em monitor mode é tolerante, mas em enforce mode (Phase H) a falha de init silenciosa virá morder. **Ação:** adicionar `.catch((err) => console.warn('[app-check] init failed', err))` quando Phase H aproximar. Tracked.

- **B4 minor — `hasPasswordProvider` comment block removido:** Pre-refactor tinha comentário inline explicando. Vale restaurar quando A4 (test setup) ou D3 (SettingsPage) for tocar. CLAUDE.md ainda tem a explicação completa.

## Hooks / lefthook caveats observados

- `scripts/firebase/check-rules-tested.sh` (PreToolUse) dispara em alguns bash commands não relacionados a deploy (heredoc-containing, ou usando padrões que match accidentally). Bypass: variável `ADSMART_SAFE_DEPLOY=1` documentada no script. Vários subagents tropeçaram nisso e usaram o bypass corretamente. **Ação:** apertar regex do hook em PR separado.

- Working tree pré-existente com `M .firebase/hosting.ZGlzdA.cache` (build cache local, gitignored efetivamente). Ignorado em todos os commits desta execução — nenhum subagent o tocou.

## Sanity check a cada N tasks

### Após Phase A+B (commits 1–6 + follow-up `62e0e60`)
- `bun run typecheck` ✅
- `bun run lint` ✅ (115 warnings pré-existentes, 0 errors)
- `bun run test --run` ✅ 68/68 passing
- `cd functions && bun run test` ❌ pré-existente — depende de emulators offline. Não bloqueia.

### Após Phase D + E1+E2 (commits `c937d26`, `0cfdc7a`, `df2f5bc`, `9cda1ee`, `0dc4517`, `98fd369`)
- `bun run typecheck` ✅
- `bun run test --run` ✅ 62/62 passing (caiu de 72 → 62 porque D4 deletou os 10 tests legacy de `src/utils/validation.test.ts`; cobertura equivalente em `packages/shared/src/auth/password.test.ts`)
- `cd functions && bun run typecheck` ✅
- `cd functions && bun run build` ✅
- 12 i18n keys novas em 3 idiomas (D1) + 6 forgot-password keys (D2). Types.ts atualizado.
- Próximo: E3 (deleteUserData real) é a maior tarefa restante de Phase E. Cuidado.

### Após Phase C (commits `5c6283d`, `e917d96`, `86250ee`)
- `bun run typecheck` ✅
- `bun run lint` ✅ (warnings pré-existentes intactos, novos arquivos clean)
- `bun run test --run` ✅ 72/72 passing (15 test files, +4 tests novos de C2)
- App Check init em `src/firebase/config.ts` removido pelo usuário (paralelamente, **ADR-019**) — Task B2 fica marcada como superseded. Plan G1-G6 precisa reconciliar.

**Compromissos abertos endereçados no checkpoint Phase C:**
- B4 issue #5 (silent catch) → `console.warn` adicionado em `62e0e60`.
- B2 minor (sem .catch no App Check) → endereçado em `62e0e60`; ficou moot porque ADR-019 removeu App Check inteiro.
- B4 issue #1 (public pages flash) → ainda em aberto. Phase G1/G2 decidirá: documentar como aceitável ou wrap public pages com fallback.

### Notas operacionais
- Após **6 tarefas + 1 checkpoint**, esta é a segunda atualização do log (cadência ~3 tarefas como pedido).
- Próxima auditoria: após D3 ou início de Phase E.
- ADR-019 (App Check removal) precisa ser referenciado em ADR-016 quando ele for escrito em G1.

Próximo dispatch: Task D1 (LoginPage refactor).
