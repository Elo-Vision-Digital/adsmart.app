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
| C1 — AuthLoadingFallback component | ⏳ pending | — | Next. |
| C2 — loading-aware route guards + tests | ⏳ pending | — | |
| C3 — EmailVerificationBanner | ⏳ pending | — | |
| D1 — LoginPage refactor | ⏳ pending | — | |
| D2 — ForgotPasswordPage | ⏳ pending | — | |
| D3 — SettingsPage password change | ⏳ pending | — | |
| D4 — validation.ts shim | ⏳ pending | — | |
| E1 — bootstrapUser fallback | ⏳ pending | — | |
| E2 — USER_DELETION enum | ⏳ pending | — | |
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

Após B4, todos os 6 commits empilhados em `develop`. Estado:
- `bun run typecheck` ✅
- `bun run lint` ✅ (115 warnings pré-existentes em arquivos não-tocados, 0 errors)
- `bun run test --run` ✅ 68/68 passing (14 test files)
- `cd functions && bun run test` ❌ pré-existente — depende de emulators offline. Não bloqueia.

Próximo dispatch: Task C1 (AuthLoadingFallback).
