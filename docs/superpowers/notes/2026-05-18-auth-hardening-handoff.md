# Auth Flow Hardening — Handoff to Next Chat

**Status:** ADR-020 SHIPPED on develop in 31 commits (`621bfab..b3ad760`). Code + docs (Decisions/SECURITY/QA-CHECKLIST/ERROR-HANDLING/AGENTS/CLAUDE/CHANGES) all complete. Browser-validated. **This file is the bridge to whoever continues the work in a new chat.**

Sibling memory: `auth_hardening_continuation_2026_05_18.md` (Claude Code memory directory). The two files are intentionally redundant — the doc lives in the repo for any agent; the memory survives compaction in Claude Code sessions.

---

## Paste-and-go prompt for the next chat

```text
Estou continuando o trabalho de auth flow hardening (ADR-020). Tudo foi
shipped em develop em 31 commits (621bfab..b3ad760). Todos os docs
canônicos atualizados: Decisions, SECURITY, QA-CHECKLIST, ERROR-HANDLING,
AGENTS, CLAUDE, CHANGES.

CONTEXTO QUE VOCÊ DEVE LER ANTES DE QUALQUER AÇÃO:

1. docs/Decisions.md → ADR-020 (12 decisões, 7 deferred follow-ups,
   trade-offs explícitos). ADR-021 (entry vizinho) é SuitPay removal de
   um chat paralelo — NÃO confundir.

2. docs/superpowers/notes/2026-05-17-auth-flow-hardening-execution-log.md
   — log per-commit de toda execução, com 2 bugfixes via browser
   validation e a lição da E5 scope-creep amend.

3. docs/CHANGES.md → entry [2026-05-18] "Auth flow hardening"
   (resumido de tudo).

4. docs/superpowers/plans/2026-05-17-auth-flow-hardening-plan.md →
   plano original com tasks A1-G6.

5. docs/superpowers/specs/2026-05-17-auth-flow-hardening-design.md →
   spec original com 12 pontos de drift + 3 approaches considerados.

ESTADO ATUAL:

- bun run typecheck ✅
- bun run test --run ✅ 62/62 web tests
- cd functions && bun run typecheck ✅
- cd functions && bun run build ✅
- cd functions && bun run test ❌ pré-existente (emulators offline; é
  estado conhecido, não bloqueia)
- 31 commits empilhados em develop, NÃO pushed
- ADR-020 = auth flow (este); ADR-021 = SuitPay removal (chat paralelo).
  Stable, não renumerar.

O QUE NÃO FOI FEITO (escolha o que fazer):

═══════════════════════════════════════════════════════════════════════
OPÇÃO 1 — HARNESS (recomendado, ~1h)
═══════════════════════════════════════════════════════════════════════

Criar enforcement automatizado para o refactor não regredir:

A) .claude/agents/auth-flow-reviewer.md — agente que revisa mudanças em
   src/contexts/AuthContext.tsx, src/lib/auth/*,
   src/pages/{LoginPage,ForgotPasswordPage,SettingsPage,DeleteDataPage}.tsx,
   functions/src/{bootstrapUser,deleteUserData}.ts.
   Checks:
   - no `createUserWithEmailAndPassword` direto (usar Context.signUp);
   - no local `validatePassword` (usar shared);
   - catch handlers usam split pattern (isAuthError → map, else
     err.message);
   - no PII em console.log de auth handlers;
   - signInWithGoogle/Facebook têm scopes explícitos.

B) .claude/hooks/auth-no-error-any.sh (PreToolUse) — bloqueia `error: any`
   em arquivos auth (LoginPage, SettingsPage, *Banner, *Route).

C) .cursor/rules/auth-flow.mdc — mirror das conventions para Cursor IDE.

D) Adicionar a AGENTS.md uma nota apontando para esses hooks/agents.

═══════════════════════════════════════════════════════════════════════
OPÇÃO 2 — DEFERRED FOLLOW-UPS (escolher individualmente)
═══════════════════════════════════════════════════════════════════════

Listados em ADR-020 "Not done". Por prioridade prática:

1. (1h) Provisionar custom admin claim para
   agency.elovisiondigital@gmail.com e admin@adsmart.app via Admin SDK
   script. Remover allowlist email do shared (one-line change) só DEPOIS
   de validar que os claims funcionam. Triggar próximo sign-in via
   window.location.reload() ou comunicar admins a relogarem.

2. (30min) Configurar Identity Platform Password Policy no Firebase
   Console (Authentication → Settings → Password policy) mirroring nosso
   shared (8 chars + complexity). Pure defense-in-depth.

3. (45min) Adicionar `auth/provider-already-linked` ao
   AUTH_ERROR_KEY_MAP. Decidir UX: "esta conta já tem senha cadastrada"
   vs collapse para outro key. Adicionar a 3 locales.

4. (1h) Playwright spec file commitado para os fluxos browser-validated:
   /login signup com weak password, /forgot-password privacy collapse,
   /admin redirect. Padrão: tests/e2e/auth.spec.ts. Provavelmente vai
   exigir test user fixtures (criar via Admin SDK no setup).

5. (4h) HomePage flash fix: envolver public pages com um inline loading
   hint que respeita useAuth().loading. Ou alternativa: skeleton só na
   parte que lê user. Discutir tradeoffs antes de implementar.

6. (15min) Cleanup das memories obsoletas. A memory antiga
   `auth_hardening_execution_2026_05_17.md` já foi deletada. A memory
   `auth_hardening_continuation_2026_05_18.md` (este handoff) pode ser
   deletada quando harness ou follow-ups landarem.

═══════════════════════════════════════════════════════════════════════
OPÇÃO 3 — VALIDAR EM PROD (cuidado, irreversível)
═══════════════════════════════════════════════════════════════════════

- Push para origin/develop
- Abrir PR develop→main
- Merge → autodeploy via deploy.yml (CI pode estar com startup_failure
  pré-existente; verificar antes)
- Validar /forgot-password em prod (NÃO disparar emails de teste para
  emails reais)
- Validar smoke browser test em prod com user de teste descartável
- Confirmar COOP header em prod (DevTools → Network → Response Headers)
  → deve ser "same-origin-allow-popups"

Como você quer começar?
```

---

## Regras do handoff

**NÃO renumerar ADR-020.** Estado final estável: ADR-020 = auth flow (este); ADR-021 = SuitPay removal (chat paralelo). Já houve uma renumeração ida-e-volta nesta sessão; outro round seria desnecessário.

**Working tree pode ter modificações não-commitadas do outro chat** (schemas/API CONTRACT). Use `git status --short` para ver. O trabalho parallel é independente do auth flow. NÃO mexer nesses arquivos sem pedido explícito.

**31 commits não pushed.** Push só com autorização explícita do usuário (regra do classifier para destrutivo em prod).

**Browser validation já feita.** Se for re-validar, IndexedDB tem state stale do user de teste `weakpass@test.com` no `adsmart-web-dev`. O fluxo de signup desse user criou doc em `users/{uid}` e wallet/current (R$ 0,00).

**Two real bugs descobertos via browser test** (commit `f0fc264`):
1. Catch handlers em LoginPage + SettingsPage passavam `throw new Error(t('<translated>'))` por `authErrorToTKey`, mascarando como `common.error.generic`. Fix: split pattern com `isAuthError`.
2. `common.validation.minimumCharacters` estava stale "Mínimo 6 caracteres". Fix: alinhado com policy de 8 chars.

Padrão validado: **browser smoke test detecta bugs reais que typecheck + unit tests não pegam.** Continuar usando.

**Browser validation NÃO incluiu Google/Facebook OAuth real** (classifier bloqueia auto-fill de credenciais) e NÃO incluiu DeleteDataPage click real (classifier bloqueia destruição irreversível). Esses dois fluxos precisam ser validados manualmente pelo usuário com Playwright/DevTools rodando no browser próprio.
