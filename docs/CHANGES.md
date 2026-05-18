# Changes

Append-only log of significant changes. Most recent at the top. Each entry uses the parseable header `## [YYYY-MM-DD] — Title` for tooling/lint.

Format conventions:
- One section per logical change set (a phase, a migration, an incident, a major decision).
- Use bullet points for individual changes; group by area when long (Frontend / Functions / Rules / Docs).
- Reference commit SHAs or PR numbers when relevant.
- Do NOT edit past entries. If a past claim is wrong, add a new dated entry that supersedes it (and link back).

---

## [2026-05-18] — Repo moved to Elo-Vision-Digital org + CI fully unblocked

Repo transferred from `github.com/ZenniTTy/adsmart.app` to `github.com/Elo-Vision-Digital/adsmart.app`. GitHub preserves redirects so old clones still work, but local remote was updated to the canonical new URL. PR #2 (49-commit modernization sweep) was preserved as MERGED on the new org.

Billing issue that had been keeping Actions in `startup_failure` since pre-transfer is now resolved on the org account. CI started actually running for the first time today — and surfaced 4 distinct bugs in the workflow itself:

1. **`bunx firebase` → `bunx firebase-tools`** in `scripts/firebase/test-rules.sh`. Local works because `firebase-tools` is globally installed; CI runner needed the canonical package name.
2. **Java 21 missing** on `ubuntu-latest`. `firebase-tools >= 14` requires JDK 21 for the Firestore emulator. Added `actions/setup-java@v4` with Temurin 21 to both jobs.
3. **`@adsmart/shared` not built** before `bun run typecheck` / `bun run build` in `ci.yml`. Local passes because `packages/shared/dist/` is pre-built on disk; CI fresh runner has no dist. Added explicit `cd packages/shared && bun run build` before lint/typecheck in both `ci.yml` jobs. `deploy.yml` uses Turbo so it was unaffected.
4. **`defineString` params not present in CI** after hard-rule 2026-05-18 dropped `default:` literals. `firebase deploy` exits non-zero in non-interactive mode when any param has no value. Fix: GitHub Environments `dev` and `prod`, each with 6 repo variables (`GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_REDIRECT_URI`, `GOOGLE_ADS_REDIRECT_URI_DEV`, `META_ADS_APP_ID`, `META_ADS_REDIRECT_URI`, `META_ADS_REDIRECT_URI_DEV`). New "Write functions/.env" step runs BEFORE `Build all` so `prepare-deploy.mjs` materializes `functions/deploy/.env` correctly. Both dev and prod jobs identical.

End-to-end CI run after the 4 fixes: ✅ `develop` push → CI green + Deploy → adsmart-web-dev success (~3.5 min total).

`DEPLOYMENT.md` updated with the GitHub Environments prerequisite. FIREBASE_TOKEN intentionally kept repo-level (single source, same Firebase project family) — env-level segregation would be over-engineering at MVP stage.

---

## [2026-05-18] — CI deploy scope fix: firestore:rules,firestore:indexes now ship via deploy.yml + emulator test gate

Full prod validation after the `adsmart-web` functions deploy surfaced that `firestore.rules` in production was 9 months stale — the deployed ruleset was from `2025-08-04`, before Phase 3 hardening (`wallet`/`transactions` client-write block) and ADR-012 (`documentLocked()` CPF/CNPJ immutability) landed in source.

**Root cause:** `.github/workflows/deploy.yml` deployed only `hosting,functions`. Every PR that touched `firestore.rules` or `firestore.indexes.json` and merged to `main` lost those changes silently — the CI logs reported "deploy successful" but never shipped the rule changes. The drift had accumulated for 9 months invisible because adsmart.app has no users yet and the domain isn't pointed.

**Fix landed in this commit:**
- `deploy.yml`: both jobs (dev + prod) now (a) run `bash scripts/firebase/test-rules.sh` before deploy (16 rules tests must pass), and (b) deploy `hosting,functions,firestore:rules,firestore:indexes` as a single atomic step. Rules-breaking changes now fail CI instead of deploying broken rules.
- [DEPLOYMENT.md](DEPLOYMENT.md) updated with the new scope + test-rules step in both auto-deploy and manual deploy sections. Cross-references the CHANGES entry as the cautionary tale.

**Drift correction also landed today (separate commit, manual deploy):** `firebase deploy --only firestore:rules,firestore:indexes --project adsmart-web` synced 49 lines of missing rules + verified indexes match. Post-deploy ruleset `f3201a28-5edb-4c78-8e43-2f16a98bdb75` released `2026-05-18T15:06:06Z`.

**Detection method:** Diffed source `firestore.rules` against the deployed ruleset via `firebaserules.googleapis.com` REST API (`GET /v1/projects/<project>/releases/cloud.firestore` → follow `rulesetName` → `GET /v1/<rulesetName>`). Firebase Console shows the deployed rules but doesn't diff against your repo. Adding this as a procedure in memory `firestore_rules_indexes_in_ci.md`.

**Operator follow-up:** None. Next push to `develop` or `main` will exercise the new CI scope end-to-end.

---

## [2026-05-18] — Memories promoted to skills + hook (knowledge moves from session-local to project-local)

Applied 2026-Q2 Anthropic skills best practice: procedural knowledge belongs in `.claude/skills/` (project-versioned, auto-invoked, citable), deterministic blocks belong in PreToolUse hooks, and memory is reserved for user preferences and ephemeral state.

**Promoted to project skills:**

- `.claude/skills/firebase-deploy-recovery/SKILL.md` — auto-invokes on deploy failures (`Secret environment variable overlaps`, `Image not found`, `no value for the secret`). Covers pre-deploy checklist, canonical recovery (`functions:delete` + redeploy), and the hard rules from real Sprint 3 incidents. Replaces 2 memory entries (`firebase_deploy_env_overlap_trap`, `firebase_deploy_workflow_rules`).
- `.claude/skills/dev-environment-diagnose/SKILL.md` — auto-invokes when user reports "CORS error" / 404 / post-auth failure on `adsmart-web-dev`. Enforces fixed diagnostic order (verify deployed surface BEFORE reading client code). Replaces 1 memory entry (`dev_environment_drift`).

**Promoted to PreToolUse hook:**

- `scripts/firebase/check-no-secret-in-env-example.sh` (registered in `.claude/settings.json`) — blocks `Edit/Write` to `**/.env.example` files when a credential-shaped key (`*_SECRET`, `*_TOKEN`, `*_PASSWORD`, `*_PRIVATE_KEY`, `*_API_KEY`) receives a real-looking value. Placeholder values (`empty`, `your-...`, `<REPLACE_ME>`, `${SHELL_VAR}`) pass. Self-tested with 5 cases. Replaces 1 memory entry (`env_example_leaked_token`).

**Memories deleted:** 4 entries (`firebase_deploy_env_overlap_trap`, `firebase_deploy_workflow_rules`, `dev_environment_drift`, `env_example_leaked_token`). Their MEMORY.md pointers updated to reference the new locations under "Procedures (promoted to skills)" and "Deterministic blocks (promoted to hooks)".

**Why this matters:** previously, recovery from a deploy failure depended on the agent reading the right session memory at the right moment — a soft dependency that broke on context compaction. Skills auto-invoke from their `description` field; hooks block deterministically. Same knowledge, more reliable activation, citable across sessions.

**Sources:**

- [code.claude.com/docs/skills](https://code.claude.com/docs/en/skills) — official skill spec + size guidance
- [platform.claude.com/docs/agents-and-tools/agent-skills/best-practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — anti-patterns
- [DEV 2026 skill guide](https://dev.to/muhammad_moeed/claude-code-skills-a-practical-guide-for-2026-3f6p) — "8–12 well-chosen skills, audit monthly"

---

## [2026-05-18] — Docs drift sweep: SuitPay residue + OAuth token encryption claim

Post-merge cleanup of three stale claims in the canonical docs that survived the ADR-019/021 ship cycle. Pure documentation correction — no code change.

**Fixes:**

- `docs/Integrations.md`: SuitPay row was "Deprecated — do not extend" pointing at `functions/src/suitpayPayment.ts` (deleted). Now: "Removed (ADR-021, 2026-05-18) — do not restore" with no entry-point file.
- `docs/API-CONTRACTS.md`: 3 SuitPay callable sections (`suitpayWebhook`, `createPixPayment`, `checkPaymentStatus`) described callables that no longer exist. Replaced with one pointer to ADR-021 + PAYMENTS.md.
- `docs/DATA-MODEL.md`: (a) SuitPay-era payment collections no longer carry `(deprecated)` labels — they are legacy artifacts of a removed integration; (b) wallet write-path documentation dropped a dead link to the removed `suitpayWebhook`; (c) `users/{uid}/oauth_tokens/google_ads` was documented as "base64-encoded (not truly encrypted)" — production is AES-256-GCM via `oauthCrypto` since ADR-019. Field comments updated.

**REFACTOR-PLAN.md kept.** Audited (177 lines, status `Completed (Phases A–E)`). It still has 4 live references (DATA-MODEL.md follow-up note, Decisions.md ADR-009 references, index.md historical entry). Deleting would create 4 broken links and remove the work product that justified ADR-009/010. Marked historical in `docs/index.md` (harness modernization) — that is the correct treatment.

**Why this matters:** drift in DATA-MODEL.md claiming "not truly encrypted" while production runs AES-256-GCM is exactly the kind of stale doc that makes AI agents hallucinate about the actual security posture.

---

## [2026-05-18] — Harness modernization: AGENTS.md canonical, CLAUDE.md slim, CHANGES.md rotated

Aligned the AI harness with 2026-Q2 best practices to reduce per-turn token cost and eliminate drift between agent-facing files.

**Why:** Karaca 2026 documented 83% cost reduction after slimming CLAUDE.md; InfoQ Mar 2026 showed monolithic "architecture overview" sections do not help agents; Linux Foundation adopted AGENTS.md (Dec 2025) as cross-tool standard. Pre-modernization: CLAUDE.md 304 lines + CHANGES.md 1054 lines = heavy context tax on every agent turn.

**What changed:**

- `CLAUDE.md`: 304 → 63 lines. Design system extracted to `docs/UI-DESIGN.md`. Firebase Conventions Pack inventory extracted to `docs/FIREBASE-CONVENTIONS.md`. Tool-agnostic conventions consolidated into AGENTS.md (Zod 4 idioms, schema-change 4-step flow). Now contains Claude-only orientation: skills, slash commands, memory pointer.
- `AGENTS.md`: 107 → 108 lines. Absorbed Zod 4 idioms + schema-change flow rules. Read-first map for `scripts/migrations/` now inline (was pointing at REFACTOR-PLAN.md).
- `docs/CHANGES.md`: 1054 → 604 lines. Rotated. Active log now Q2-only. Pre-2026-04-26 entries archived to `docs/changelog/2026-Q1.md` (461 lines).
- `docs/superpowers/{specs,plans,notes}/`: 16 concluded work products moved to `docs/superpowers/archive/`. Active dirs contain only WIP (functions-config-modernization + this harness plan).
- `docs/index.md`: updated for new doc locations + changelog rotation + active/archive split.
- `docs/REFACTOR-PLAN.md`: re-labeled as historical in index (work complete since 2026-04-26; ADR-009/016/018 are canonical decision record).
- Memories deleted: `auth_hardening_continuation_2026_05_18`, `phase_5_status`, `phase_5_prereqs_done`, `phase_3_status`, `admin_subprojeto2_continuation` — all transient continuation/status memories whose own notes said "delete after X lands".

**What did NOT change:**

- `.claude/agents/`, `.claude/commands/`, `.claude/settings.json` hooks: validated as best-practice in 2026-Q2 research; kept as-is.
- `.cursor/rules/`: kept (rule-porter migration deferred — out of scope here).
- ADRs in `docs/Decisions.md`: untouched (canonical decision record).
- `packages/shared/` canonical schemas: untouched.

**Sources informing the design:**

- [InfoQ — AGENTS.md value review (Mar 2026)](https://www.infoq.com/news/2026/03/agents-context-file-value-review/)
- [Karaca — 42k tokens per conversation fix](https://medium.com/@cem.karaca/my-claude-md-was-eating-42-000-tokens-per-conversation-heres-how-i-fixed-it-85ffba809bd4)
- [agents.md (Linux Foundation)](https://agents.md/)
- [Anthropic — Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

**Plan:** [docs/superpowers/plans/2026-05-18-harness-modernization.md](superpowers/plans/2026-05-18-harness-modernization.md)

---

## [2026-05-18] — Hard rules: no hardcoded environment values, no unnecessary comments

User-elevated conventions to hard rules after a self-audit of the same-day defineString migration revealed two violations the prior commit had introduced:

1. **`default:` literals on `defineString`** for `GOOGLE_ADS_CLIENT_ID`, `META_ADS_APP_ID`, redirect URIs. The defaults inlined the production OAuth IDs — that is hardcoding by another name. CLI deploy-block on missing params is the safety; a default circumvents it.
2. **Decorative comment banners** (`// ===========`) and ADR-referencing narrative comments in `config/index.ts`, the four OAuth files, and `prepare-deploy.mjs`. Restated what code already said.

**Changes:**
- `functions/src/config/index.ts`: defaults removed from all 6 defineString exports. Deadcode pruned (`config.urls`, `config.project.id`, `config.project.environment`, `isProduction()`). Decorative banners deleted. Net result: file dropped from 73 → 31 lines.
- `functions/src/googleAdsOAuth.ts`, `metaAdsOAuth.ts`, `metaAdsOAuthV2.ts`: removed comments I added in the prior commit (ADR refs, defineString notes). Pre-existing narrative comments in these files were left alone — out of scope.
- `functions/scripts/prepare-deploy.mjs`: removed three banner blocks + multi-line JSDoc + multi-line inline narrative. Behavior unchanged; 7 tests still green.
- `functions/.env.example`: rewritten. Pre-existing file contained the real `GOOGLE_ADS_DEVELOPER_TOKEN=wRhu...` as an "example" (real secret committed to a public-facing template), real client IDs as samples, and stale SuitPay / RECAPTCHA references. New version has empty placeholders + comment explaining the rules. **Leaked token still in git history**; rotation deferred (repo is private; documented in memory `env_example_leaked_token.md`).

**Conventions surfaced:**
- [AGENTS.md](../AGENTS.md) "Conventions" — two new lead bullets: "No hardcoded config values" + "No unnecessary comments". Litmus test: *"if this repo were open-sourced today, would any environment-specific value leak?"*
- [CLAUDE.md](../CLAUDE.md) — new top-level "Code quality — non-negotiable" section before stack reference.
- [.claude/agents/functions-security-reviewer.md](../.claude/agents/functions-security-reviewer.md) — review-blocker rules: no `default:` on production `defineString`, no decorative banners, no narrative WHAT-comments, no ADR-referencing source comments.
- [.cursor/rules/functions-config.mdc](../.cursor/rules/functions-config.mdc) — mirror for Cursor.
- Memory `feedback_no_hardcoded_no_unnecessary_comments.md` — both rules with origin + how-to-apply.

**Where pre-existing narrative comments still live:** `googleAdsOAuthV2.ts`, `metaAdsOAuthV2.ts`, `googleAdsOAuth.ts`, `metaAdsOAuth.ts`, several others. Not cleaned in this commit — would be scope creep. Future refactors touching these files should remove on contact.

---

## [2026-05-18] — Functions config modernization: defineString for non-secret app config + prepare-deploy regression suite

**Status:** Conventions + spec + plan shipped on `develop`. Code execution pending in the same session (see [plan](superpowers/plans/2026-05-18-functions-config-modernization-plan.md)).

Post-audit follow-up after Sprints 1–3 + ADR-021 surfaced two residual gaps:

1. **OAuth non-secret config still read via raw `process.env`** with hardcoded fallbacks duplicated across four source files (`googleAdsOAuth.ts`, `googleAdsOAuthV2.ts`, `metaAdsOAuth.ts`, `metaAdsOAuthV2.ts`). The literals re-appeared even though `config/index.ts` already centralized them — three drift surfaces (`.env` / source fallback / Cloud Run env) instead of one source of truth.
2. **`functions/scripts/prepare-deploy.mjs` filter ships without test coverage.** The hardening that shipped in ADR-021 (commit `c67c600`) protects against the secret/env overlap deploy trap, but a future regex edit would silently break the protection — next deploy is the only signal.

**Decision (research-backed, validated 2026-05-18):** Migrate non-secret config to `defineString` (canonical pattern for Functions v2 per Firebase docs + Context7 `/firebase/firebase-tools`). Extract the `prepare-deploy.mjs` filter as a pure function and add three Vitest regression tests.

**Conventions updated (this commit):**
- [AGENTS.md](../AGENTS.md) — Adds "Non-secret app config" rule (defineString-or-allowlist). Updates "what NOT to do" with the inverse.
- [CLAUDE.md](../CLAUDE.md) — Cloud Function v2 baseline section now references `defineString` for non-secret config.
- [.claude/agents/functions-security-reviewer.md](../.claude/agents/functions-security-reviewer.md) — Reverses the "process.env for non-secret config is OK and EXPECTED" line. New rule: enumerate Cloud Run built-in allowlist; require `defineString` / `defineSecret` for everything else.
- [docs/OAUTH.md](OAUTH.md) — Updated Google Ads + Meta Ads "Prerequisites" sections (defineString/defineSecret refs). Token storage section corrected to reference AES-256-GCM via `oauthCrypto` (ADR-019) — previously still claimed "Base64, TODO before Phase 2".
- [.cursor/rules/functions-config.mdc](../.cursor/rules/functions-config.mdc) — New Cursor rule mirroring the convention.
- Spec: [docs/superpowers/specs/2026-05-18-functions-config-modernization-design.md](superpowers/specs/2026-05-18-functions-config-modernization-design.md) — Full rationale, research findings, acceptance criteria.
- Plan: [docs/superpowers/plans/2026-05-18-functions-config-modernization-plan.md](superpowers/plans/2026-05-18-functions-config-modernization-plan.md) — 5 tasks, ~45 min total.

**Explicit non-goals (informed by research):**
- **Not** adding `.parse()` to internal Firestore writes. Zod docs (Context7 `/colinhacks/zod`): *"validation middleware at system boundaries"*. Internal writes by code we control are not boundaries; `z.infer` types already cover compile-time. Considered + dropped.
- **Not** broadening the `check-no-process-env-secret.sh` pre-commit hook. False-positive risk on Cloud Run built-ins (`GCLOUD_PROJECT`, etc).
- **Not** rotating `GOOGLE_ADS_DEVELOPER_TOKEN`. Repo private; user explicitly deferred.

**Refs:**
- Context7 `/firebase/firebase-tools` queried 2026-05-18.
- [Firebase — Configure your environment](https://firebase.google.com/docs/functions/config-env).
- ADR-019 (OAuth crypto), ADR-021 (SuitPay removal + prepare-deploy hardening).

---

## [2026-05-18] — Auth flow hardening: surgical refactor of Google/Facebook/Email-Password flows (ADR-020)

**Status:** Shipped on `develop` in 28 commits (`621bfab` … `957cf11`). Plan executed via `superpowers:subagent-driven-development`. Browser-validated via Playwright + Chrome DevTools end-to-end. Two real bugs detected via browser validation and fixed in commit `f0fc264` (catch handlers + stale i18n key). Decision recorded in [ADR-020](Decisions.md#adr-020-auth-flow-hardening-2026-05-approach-a--surgical-refactor).

**Numbering note:** This work landed first in `Decisions.md` as ADR-020; a parallel chat shipped a SuitPay-removal ADR (entry directly below) and renumbered theirs to ADR-021.

The pre-refactor surface had twelve concrete drift / latent-bug problems documented in [the design spec](superpowers/archive/specs/2026-05-17-auth-flow-hardening-design.md) §1. Chosen response: **Approach A — surgical refactor**. Approaches B (extract `AuthService`) and C (`signInWithRedirect` + MFA TOTP) considered and rejected — see ADR-020.

**Shared modules (single source of truth):**
- `packages/shared/src/auth/admin.ts` — `ADMIN_EMAILS` + `isAdminUser(claims, email)`. Consumed by client `AuthContext` AND 3 Cloud Functions. `const ADMIN_EMAILS\b` now returns zero matches outside `packages/shared`.
- `packages/shared/src/auth/password.ts` — `PasswordPolicy` (8 chars + complexity) + `validatePassword(pwd): { valid, errors[i18n_key] }`. Both `LoginPage` signup AND `SettingsPage` change-password consume it. Pre-refactor: LoginPage 8+complexity / SettingsPage 6 chars (silent drift).

**Frontend:**
- `src/firebase/config.ts` — `getAuth(app)` → `initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence], popupRedirectResolver: browserPopupRedirectResolver })`.
- `src/contexts/AuthContext.tsx` — removed `signIn` alias; shared `isAdminUser`; PII `console.log/console.error` removed from Facebook handler; OAuth scopes explicit (Google `profile`+`email`+`prompt: 'select_account'`; Facebook `email`+`public_profile`); `refreshAuthState(user)` (`getIdToken(true)` + `user.reload()`) after every sign-in; `getIdTokenResult(true)` in listener; `{!loading && children}` gate removed.
- `src/lib/auth/{errors,errorMessages}.ts` — `isAuthError` type guard + `AUTH_ERROR_KEY_MAP` (15 codes) + `authErrorToTKey(err)`. Privacy collapse on sign-in errors.
- `src/components/AuthLoadingFallback.tsx` — spinner with `aria-label="Carregando"`.
- `src/components/{PrivateRoute,AdminRoute}.tsx` — honor `loading`, `<Navigate replace>`. New tests (3+4).
- `src/components/EmailVerificationBanner.tsx` — non-blocking yellow banner. 5 i18n keys × 3 locales.
- `src/pages/LoginPage.tsx` — `signUp` via Context, shared `validatePassword`, shared `authErrorToTKey` with split catch pattern.
- `src/pages/ForgotPasswordPage.tsx` — new at `/forgot-password`, privacy collapse.
- `src/pages/SettingsPage.tsx` — change-password uses shared policy (8 chars). Stale `minimumCharacters` placeholder updated.
- `src/pages/DeleteDataPage.tsx` — calls `deleteUserData` callable; email-typed confirmation; `signOut()` + `navigate('/login', { replace: true })`.
- `src/utils/validation.ts` — re-export shim; `validation.test.ts` deleted (coverage in shared).
- 12 new i18n keys across pt-BR / en / es.

**Cloud Functions:**
- `functions/src/bootstrapUser.ts` — email fallback `event.data.email → providerData[*].email → null`. No more `email: ''`. Structured Cloud Logging telemetry.
- `functions/src/securityLogger.ts` — `USER_DELETION` added to `SecurityEventType`.
- `functions/src/deleteUserData.ts` — real cascade delete (5 subcollections × 400-doc batches) + `userDocuments` cleanup + Auth user delete + audit log. Rate-limited 1×/hour.
- `functions/src/{getDashboardMetrics,priceManager,adminWalletManager}.ts` — local `ADMIN_EMAILS` removed.

**Hosting:**
- `firebase.json` — `Cross-Origin-Opener-Policy: same-origin-allow-popups` (was `same-origin`). Required for `signInWithPopup` reliability.

**Test setup:**
- `src/test/setup.ts` — global `vi.mock('@/firebase/config')` because Vitest's happy-dom resolves `@firebase/auth` to its node-esm bundle where `browserPopupRedirectResolver` is a sentinel `Error`. Tests that need real Firebase override locally. Tracked as tech debt.

**Docs (Phase G):**
- `docs/Decisions.md` ADR-020; `docs/SECURITY.md` (Password policy + Auth error messaging + COOP downgrade + admin granting flow without sign-out/in); `docs/QA-CHECKLIST.md` (6 new auth sub-sections); `docs/ERROR-HANDLING.md` (Firebase Auth code → i18n table + split catch pattern); `AGENTS.md` (Conventions + What NOT to do); `CLAUDE.md` ("Auth flow conventions" section); `docs/superpowers/{specs,plans,notes}/2026-05-17-auth-flow-hardening-*.md`.

**Deferred follow-ups (tracked in ADR-020 "Not done"):**
- `HomePage` brief flash on public pages with logged-in user.
- `useMemo` on `AuthContext.value`, `useReducer` for coupled state.
- Vitest config alternative to the `vi.mock` global stub.
- `useTransition` for sign-in actions.
- Playwright e2e test artifact (browser-validated but no `.spec.ts` committed).
- Operator: provision custom admin claims for the email allowlist; mirror shared password policy in Identity Platform Console.
- `auth/provider-already-linked` not in error map.

---

## [2026-05-18] — SuitPay removed end-to-end + prepare-deploy hardened against secret/env overlap (ADR-021)

**Status:** Dev shipped (17 functions deployed, 3 SuitPay deleted, `confirmGoogleAdsAccountSelection` recreated clean). Prod cleanup pending operator authorization. Decision and trade-offs in [ADR-021](Decisions.md#adr-021-remove-suitpay-end-to-end--harden-prepare-deploy-against-secretenv-overlap).

The Sprint 3 deploy of OAuth crypto hardening (ADR-019) ran into a chain of failures rooted in SuitPay's dead-but-live code:

1. **First deploy attempt** of `confirmGoogleAdsAccountSelection` failed with HTTP 400 `Secret environment variable overlaps non secret environment variable: GOOGLE_ADS_DEVELOPER_TOKEN`. The previously-deployed revision had `GOOGLE_ADS_DEVELOPER_TOKEN` registered as a plain env var from a pre-ADR-017 deploy when the value was in `functions/.env`; the new deploy declared the same name as `secretEnvironmentVariables`; Cloud Run rejected the overlap.
2. **`gcloud run services update --remove-env-vars`** as the remediation failed with `Image 'gcf-artifacts/...:version_1' not found` because Firebase CLI 14+ applies a default Artifact Registry cleanup policy (1-day retention). The image needed to materialize a new revision was already garbage-collected.
3. **Even after cleaning `functions/.env`**, deploys kept failing on `In non-interactive mode but have no value for the secret: SUITPAY_CLIENT_ID` because `defineSecret('SUITPAY_*')` was still in `config/index.ts` and dev had never been provisioned with those secrets.

Given zero production users (domain not pointed; still in development), the cleanest path was to delete SuitPay completely rather than provision dummy SuitPay secrets in dev.

**Functions side:**

- Deleted: [functions/src/suitpayPayment.ts](../functions/src/suitpayPayment.ts) (was `createPixPayment`, `checkPaymentStatus`), [functions/src/suitpayWebhook.ts](../functions/src/suitpayWebhook.ts).
- [functions/src/index.ts](../functions/src/index.ts) — 2 export blocks removed; comment block citing ADR-021 added in their place.
- [functions/src/config/index.ts](../functions/src/config/index.ts) — `defineSecret('SUITPAY_CLIENT_ID')` and `defineSecret('SUITPAY_CLIENT_SECRET')` removed, plus the entire `config.suitpay` block and the now-orphaned `getWebhookUrl` / `getRedirectUrl` helpers (only used by SuitPay).
- [functions/.env](../functions/.env) — 3 plain-text values purged: `SUITPAY_CLIENT_ID`, `SUITPAY_CLIENT_SECRET`, and the residual `GOOGLE_ADS_DEVELOPER_TOKEN` (which should have been only in Secret Manager since ADR-017 but had been leaking into Cloud Run service specs).
- [functions/scripts/prepare-deploy.mjs](../functions/scripts/prepare-deploy.mjs) — **hardened** to extract every `defineSecret('NAME')` regex match from `config/index.ts` and filter any matching `NAME=...` line out of `functions/.env` before writing `functions/deploy/.env`. Emits a `console.warn` listing stripped keys.

**Frontend side:**

- Deleted: [src/components/ui/PixPaymentModal.tsx](../src/components/ui/PixPaymentModal.tsx), [src/services/paymentService.ts](../src/services/paymentService.ts).
- Rewritten: [src/components/ui/AddCreditsModal.tsx](../src/components/ui/AddCreditsModal.tsx) — replaced 100+ lines of SuitPay-aware code with a maintenance-notice placeholder. Three callers (Header, MobileHeader, TemplatesPage) still import it; restoring functionality is one component edit once Asaas lands.
- [src/pages/TermsOfServicePage.tsx](../src/pages/TermsOfServicePage.tsx) — "PIX (processado via SuitPay)" → "PIX (em breve)".

**Cloud Run side (dev):**

```bash
firebase functions:delete confirmGoogleAdsAccountSelection suitpayWebhook createPixPayment checkPaymentStatus --project adsmart-web-dev --region us-central1 --force
firebase deploy --only functions --project adsmart-web-dev
```

Result: 4 Cloud Run services deleted (3 SuitPay + 1 with overlap), then 17 functions deployed/created. `confirmGoogleAdsAccountSelection` was recreated fresh with the correct `encryptionKey + googleAdsClientSecret + googleAdsDeveloperToken` secret bindings (no overlap because the new service was created from a clean spec, not updated from a dirty one).

**Cloud Run side (prod) — pending:**

Same sequence needs to run in `adsmart-web` once the operator authorizes. SuitPay services are still deployed there but have zero traffic (no UI calls them after this change; domain not pointed).

**Memory triggers added for future agents:**

- [`firebase_deploy_env_overlap_trap.md`](https://example.com) — the exact failure mode + canonical recovery. Triggers on the error string.
- [`firebase_deploy_workflow_rules.md`](https://example.com) — hard rules built from the incidents (which `.env` is read, when to rebuild, why `gcloud run update` is unsafe, per-action authorization).
- [`suitpay_deprecated.md`](https://example.com) rewritten as `suitpay_removed.md` — points future agents at ADR-021 + Asaas restoration plan.

**Validation:**

- `bun run typecheck` ✅ web, functions, shared.
- `bunx vitest run` ✅ shared (94/94), functions/src/lib (19/19 crypto), web (62/62).
- `biome check` ✅ on every touched file.
- `firebase functions:list --project adsmart-web-dev` ✅ — 17 callables, all v2, no SuitPay.
- Final bundle grep `SUITPAY|suitpay` in `functions/lib/bundle.js` ✅ — 0 matches.

**Files touched:** 11 source changes + 4 doc updates + 3 memory entries.

---

## [2026-05-17] — Sprint 3: Firebase App Check removed end-to-end; AES-256-GCM for OAuth tokens at rest with backward-compat read-path migration

**Status:** Shipped. Code-only change; no Firestore or Auth state touched (legacy Base64-encoded tokens migrate opportunistically on next read — no offline script). Decision and trade-offs documented in [ADR-019](Decisions.md#adr-019-remove-firebase-app-check--aes-256-gcm-for-oauth-tokens-at-rest).

Closes the two real security gaps from the post-Sprint-2 audit. **App Check** was a dead scaffold (initialized in code but gated on an env var nobody ever set), and the **OAuth tokens** stored in Firestore at `users/{uid}/oauth_tokens/{google_ads,meta_ads}` used Base64 as "encryption" — any reader of the database could decode them trivially. Both required research before action per the workflow rule: Context7 (`/websites/nodejs_latest-v22_x_api`, `/websites/zod_dev_v4`) and Firebase developer-knowledge MCP confirmed the canonical approach (Node `node:crypto` AES-256-GCM + AEAD + `scryptSync` KDF + Secret Manager key) before any code changed.

**Frontend (App Check removal):**

- [src/firebase/config.ts](../src/firebase/config.ts) — entire `initializeAppCheck` block deleted (was a dynamic import gated on `VITE_APPCHECK_SITE_KEY`, which was never set in any environment). Replaced with a comment block citing ADR-019.
- [.env.example](../.env.example) — `VITE_APPCHECK_SITE_KEY` entry + its 4-line preamble removed.
- [src/lib/auth/errorMessages.ts](../src/lib/auth/errorMessages.ts) — `'auth/firebase-app-check-token-is-invalid'` error code mapping deleted (the Firebase Auth SDK cannot raise it without App Check initialized; mapping was dead code). No `appCheckFailed` translation key has any consumer in `src/locales/`, so no i18n cleanup needed.

**Functions (AES-256-GCM):**

- New: [functions/src/lib/oauthCrypto.ts](../functions/src/lib/oauthCrypto.ts) — exports `encryptString`, `decryptField`, `detectAndDecrypt` (backward-compat with legacy Base64), `isEncryptedField` type guard. AES-256-GCM via `node:crypto`'s `createCipheriv` / `createDecipheriv`, 32-byte key derived from `ENCRYPTION_KEY` secret via `scryptSync`, random 12-byte IV per call, 16-byte auth tag, versioned wire format `{ v: 1, iv, tag, ct }`. The derived key is cached at module scope so cold-start scrypt cost (~30 ms) is paid once.
- New: [functions/src/lib/oauthCrypto.test.ts](../functions/src/lib/oauthCrypto.test.ts) — **19 tests** covering UTF-8 round-trip with realistic OAuth tokens, random-IV uniqueness, tampering detection (ciphertext + auth tag), wrong-key failure, unsupported version, missing fields, empty input rejection, type guard happy + sad paths, legacy Base64 detection in `detectAndDecrypt`. All 19 pass.
- [functions/src/googleAdsOAuthV2.ts](../functions/src/googleAdsOAuthV2.ts) — local `encryptTokens` (Base64) deleted; imports `encryptString` from `./lib/oauthCrypto`. `confirmGoogleAdsAccountSelection` binds `encryptionKey` in `options.secrets` alongside `googleAdsClientSecret` and `googleAdsDeveloperToken`.
- [functions/src/googleAdsOAuth.ts](../functions/src/googleAdsOAuth.ts) (V1, retained) — local `encryptTokens` / `decryptTokens` deleted; imports `encryptString` + `detectAndDecrypt`. `getValidTokens` now uses `detectAndDecrypt` (accepts both v1 EncryptedField and legacy Base64 string), then on the refresh path AES-encrypts the new tokens, and on the non-refresh path opportunistically re-encrypts legacy tokens. `getGoogleAdsCampaigns` binds `encryptionKey` in `options.secrets`.
- [functions/src/metaAdsOAuthV2.ts](../functions/src/metaAdsOAuthV2.ts) — same shape as Google V2.
- [functions/src/metaAdsOAuth.ts](../functions/src/metaAdsOAuth.ts) (V1, retained) — same shape as Google V1, minus the refresh-token branch (Meta long-lived tokens don't refresh; they're rotated by user re-consent). Also drops a `export { encryptTokens }` line that existed only to silence the unused-warning.

**Operator follow-ups (out of band, see [ADR-019](Decisions.md#adr-019-remove-firebase-app-check--aes-256-gcm-for-oauth-tokens-at-rest) for full procedure):**

1. Provision `ENCRYPTION_KEY` in Secret Manager for both projects if not already set: `firebase functions:secrets:set ENCRYPTION_KEY --project <target>`. Use ≥32 high-entropy bytes (suggestion: `openssl rand -base64 32`).
2. Redeploy the 4 OAuth callables so the new secret binding takes effect: `firebase deploy --only functions:confirmGoogleAdsAccountSelection,functions:confirmMetaAdsAccountSelection,functions:getGoogleAdsCampaigns,functions:getMetaAdsCampaigns --project <target>`.
3. Pre-Sprint-3 tokens in `users/{uid}/oauth_tokens/` continue to work transparently; they migrate to AES-GCM on next read.

**Pre-existing ADR corrections (no rewrite, addendum pattern):**

ADR-016 and ADR-017 both contained the assertion "App Check is NOT initialized in the web client." Investigation during Sprint 3 found this was incorrect — the scaffold WAS initialized in `src/firebase/config.ts`, just never activated because no env var was set. Per the project's docs-as-append-only convention, both ADRs are linked from ADR-019 as the canonical correction rather than rewritten in place.

**Validation:**

- `bun run typecheck` ✅ across web, functions, and shared.
- `bun run test` in `packages/shared` ✅ — 94/94 passing (no schema changes this sprint).
- `bunx vitest run src/lib/` in `functions/` ✅ — **19/19 crypto tests passing**.
- `biome check` clean on every file modified by this change.
- Runtime smoke test via Playwright MCP (dev server on `:5174`): homepage 0 errors, bundle confirmed to no longer reference `firebase/app-check` / `initializeAppCheck` / `ReCaptchaEnterpriseProvider` / `VITE_APPCHECK`.
- Final hygiene grep: `encryptTokens` / `decryptTokens` / `process.env.*_SECRET` / `APPCHECK` — only the intentional ADR-019 history comment in `src/firebase/config.ts:39` remains.

**Files touched:** 12 (1 new crypto module + 1 new test file, 4 OAuth files refactored, 3 web cleanup, 3 docs).

---

## [2026-05-17] — Sprint 2: schemas for User, UserDocument, OAuthState, TemporaryOAuthToken, RateLimit; reserveUserDocument migrated to canonical I/O; Zod 4 modernization

**Status:** Shipped. Code-only refactor; no Firestore or Auth state touched. Decision and trade-offs documented in [ADR-018](Decisions.md#adr-018-schemas-for-user-userdocument-oauthstate-temporaryoauthtoken-and-ratelimit).

Closes the schema gap the Sprint 1 audit identified: 10 Firestore collections were lacking canonical Zod schemas, including `users/{uid}` (the most central entity). This sweep covers the 5 collections whose shapes were demonstrably referenced in shipped code; `adminActivity`, `productPrices` (already done in Sprint 1), `securityLogs`, `backupMetadata` and `users/{uid}/oauth_tokens/google_ads` are deferred to later sprints (the first three because no client code reads them; the last because it ships together with the AES-256-GCM token encryption work tracked in [ADR-017](Decisions.md#adr-017-google-ads-developer-token-rotation--future-app-check-enforcement)).

**`@adsmart/shared` (4 new schema files, 14 new exports):**

- [`schemas/user.ts`](../packages/shared/src/schemas/user.ts) — `UserSchema` (canonical profile shape), `UserClientUpdateSchema` (strict subset clients may send through `updateDoc`; rejects email/createdAt/documentType/documentNumber to mirror `firestore.rules`), `DocumentTypeSchema`. Stale `displayName`/`photoURL` fields from the old `src/types/index.ts:User` are NOT in the canonical schema — they live on Firebase Auth.
- [`schemas/userDocument.ts`](../packages/shared/src/schemas/userDocument.ts) — `UserDocumentSchema` (the uniqueness-index document), `ReserveUserDocumentInputSchema` (callable input; accepts formatted or stripped document), `ReserveUserDocumentOutputSchema` (always normalized digits-only).
- [`schemas/oauthState.ts`](../packages/shared/src/schemas/oauthState.ts) — `OAuthStateSchema` (CSRF state, 10-min TTL), `TemporaryOAuthTokenSchema` (raw provider credentials, 30-min TTL, marked as never-to-be-exposed-to-client-API), `OAuthPlatformSchema`.
- [`schemas/rateLimit.ts`](../packages/shared/src/schemas/rateLimit.ts) — `RateLimitSchema`.

Each new schema ships with a co-located `*.test.ts` file. Total test count: 70 → **94 passing** (+24 new).

**Existing schemas modernized to Zod 4 idioms (Context7-verified):**

- [`schemas/dashboardMetrics.ts`](../packages/shared/src/schemas/dashboardMetrics.ts) — `z.string().datetime()` → `z.iso.datetime()` at 3 call sites (input `startDate`, `endDate`; output `generatedAt`).
- [`schemas/report.ts`](../packages/shared/src/schemas/report.ts) — `z.string().url()` → `z.url()` for `lookerStudioUrl`.
- [`schemas/adAccount.ts`](../packages/shared/src/schemas/adAccount.ts) — `z.string().optional()` → `z.email().optional()` for the provider-reported email field.

The method forms remain deprecated-but-functional in Zod 4; switching to the top-level forms is cosmetic (94/94 tests pass unchanged) but standardizes the idiom for new schemas.

**Functions:**

- [`reserveUserDocument.ts`](../functions/src/reserveUserDocument.ts) — inline `ReserveRequest`/`ReserveResponse` interfaces deleted; manual `typeof` validation replaced with `ReserveUserDocumentInputSchema.safeParse(...)`. Return type tightened from `Promise<ReserveResponse>` to `Promise<ReserveUserDocumentOutput>`. Adds explicit `region: config.project.region` to match the v2 conventions adopted in Sprint 1.
- [`bootstrapUser.ts`](../functions/src/bootstrapUser.ts) — comment block expanded to record WHY it does not validate against `UserSchema` (preserving the ADR-010 "doc-exists-after-signup" invariant against OAuth signups with empty email). A `console.warn` is now emitted when email is missing on signup so the operational signal is no longer silent.

**Frontend:**

- [`src/types/index.ts`](../src/types/index.ts) — the local `interface User` (with the stale `displayName`/`photoURL` fields) is deleted. `User`, `DocumentType`, and `UserClientUpdate` are now re-exported from `@adsmart/shared`. No consumers of `User` from `@/types` exist today, so the deletion is risk-free; the re-export is the path future consumers should take.

**Docs:**

- [`docs/DATA-MODEL.md`](DATA-MODEL.md) — `users/{uid}`, `userDocuments/{normalizedDoc}`, `rateLimits/{userId}`, `oauth_states/{stateId}`, and `temporary_oauth_tokens/{tokenId}` all now cite their schema source-of-truth file. The `users/{uid}` section explicitly notes that `displayName`/`photoURL` are NOT mirrored into Firestore (they live on Firebase Auth) and the `temporary_oauth_tokens/{tokenId}` section adds a "MUST NEVER be exposed to client API surface" warning. Several documented-but-missing fields were corrected against the real write shapes (e.g., `oauth_states` was missing `platform`; `temporary_oauth_tokens` listed a `tokenType` field that does not exist in the Google handler write).
- [`docs/Decisions.md`](Decisions.md) — new ADR-018.

**Validation:**

- `bun run typecheck` ✅ across web, functions, and shared.
- `bun run test` in `packages/shared` ✅ — **94/94 passing** (24 new tests).
- `biome check` clean on every file modified by this change.

**Files touched:** 18 (9 schema files + tests, 2 functions, 1 web, 3 docs, plus `packages/shared/src/index.ts` for re-exports).

---

## [2026-05-17] — Single-source-of-truth sweep: ADMIN_EMAILS + ProductPrice consolidation, priceManager v1→v2, Google Ads token decoupled from source

**Status:** Shipped. Code-only refactor; no Firestore or Auth state touched. ADRs [ADR-016](Decisions.md#adr-016-centralize-admin_emails--productprice-schema-in-adsmartshared-migrate-pricemanager-to-v2) and [ADR-017](Decisions.md#adr-017-google-ads-developer-token-rotation--future-app-check-enforcement) document the decision space.

Triggered by a full audit of the schema/API-contract surface (see Decisions for the prioritized findings). Sprint 1 closes the highest-leverage drift sources: hand-maintained `ADMIN_EMAILS` constants in 5 files, the `ProductPrice` interface declared in 4 places, the lone v1 callable in `priceManager.ts`, and a Google Ads developer token committed as a code fallback.

**`@adsmart/shared` (source of truth):**

- New: [`schemas/productPrice.ts`](../packages/shared/src/schemas/productPrice.ts) — `ProductPriceSchema`, `UpdateProductPriceInputSchema`, `UpdateProductPricesInputSchema`, plus `DEFAULT_PRODUCT_PRICES` constant and `ProductPriceCategory`/`ProductPriceType` enums. Co-located test file covers happy/sad paths and the 50-item batch cap.
- Re-exported from `packages/shared/src/index.ts`.

**Functions (`functions/src/`):**

- `priceManager.ts` rewritten end-to-end: now uses `onCall` from `firebase-functions/v2/https` with explicit `region`, `safeParse` against `UpdateProductPricesInputSchema`, `isAdminUser` from `@adsmart/shared`, server-stamped `updatedAt`/`updatedBy` (no longer client-controllable), and structured `HttpsError` instead of generic throws.
- `adminWalletManager.ts`, `getDashboardMetrics.ts`, `backupScheduler.ts` — local `ADMIN_EMAILS` arrays removed; now call `isAdminUser(auth.token, email)`.
- `config/index.ts` — SuitPay secrets restored via `defineSecret` (the empty-stub workaround was actively defeating the secret-binding mechanism); new `googleAdsDeveloperToken` secret declared; `config.googleAds.developerToken` plain-env field deleted.
- `suitpayPayment.ts`, `suitpayWebhook.ts` — `process.env.SUITPAY_CLIENT_SECRET` fallbacks removed, secrets now bound via `options.secrets` on each callable/onRequest; webhook rejects unsigned payloads with 401 instead of accepting "temporarily."
- `googleAdsOAuthV2.ts` — `getDeveloperToken()` reads `googleAdsDeveloperToken.value()` and throws `HttpsError('failed-precondition')` if unset; both Step 1 and Step 2 callables now declare the secret in `options.secrets`.
- `googleAdsOAuth.ts` (legacy v1, still exported) — hardcoded developer token literal removed; comment clarifies the file does not call the Google Ads data API and so does not need the developer token bound.

**Frontend (`src/`):**

- `contexts/AuthContext.tsx` — local `ADMIN_EMAILS` removed; admin check delegates to `isAdminUser(tokenResult.claims, user.email)` from `@adsmart/shared` so server and client share one authority list.
- `hooks/useProductPrices.ts` — `ProductPrice` interface deleted; type re-imported from `@adsmart/shared`; `DEFAULT_PRICES` derived from `DEFAULT_PRODUCT_PRICES`.
- `pages/admin/PricesConfigPage.tsx` — `ProductPrice` interface deleted; type imported from `@adsmart/shared`; the Firestore-serialized `{seconds, nanoseconds}` Timestamp shape is now isolated to a single `SerializedTimestamp` helper.

**Operator follow-ups (NOT in this change — see [ADR-017](Decisions.md#adr-017-google-ads-developer-token-rotation--future-app-check-enforcement)):**

1. **Rotate the Google Ads developer token at the Google Ads API Center.** The literal value `wRhu9OHLIWdbht2HY3B9yw` is present in 6+ commits of git history and remains valid until reset at the provider. Removing it from current code does not invalidate it.
2. Provision the new value into Secret Manager for both projects (`functions:secrets:set GOOGLE_ADS_DEVELOPER_TOKEN`).
3. Redeploy `handleGoogleAdsCallbackWithSelection` and `confirmGoogleAdsAccountSelection`.

**Validation:**

- `tsc --noEmit` ✅ across web, functions, and shared.
- `vitest` ✅ in `packages/shared` (70/70 passing, including 6 new tests for `productPrice.ts`).
- Web `vitest` ✅ on the 58 tests unaffected by the pre-existing Firebase Auth init issue in `AdminRoute.test.tsx` (tracked separately; unrelated to this change).
- Functions `vitest` requires emulator startup (security-log re-entrancy tests); the emulator was not started in this sweep — to be exercised in the next deploy cycle via `/firestore-rules-test`.
- `biome check` clean on every file modified by this change.

**Files touched:** 14 (10 functions, 3 web, 2 shared, plus 3 docs).

---

## [2026-05-17] — Full Firestore + Auth + Storage wipe across dev and prod; Identity Platform blocking trigger fix (dev)

**Status:** Shipped. No code changes; this is an operational + infra-config record. Decision documented in [Decisions.md ADR-015](Decisions.md#adr-015-register-identity-platform-blocking-trigger-after-total-firestore--auth-wipe).

After the same-day reCAPTCHA + Security Logs removals (above), the project owner requested a full reset of historical data in both Firebase projects to graduate to a clean state where code + schemas + rules are the only source of truth. There are no production users; the wipe was a low-risk YAGNI cleanup to drop noise (orphan OAuth states, expired webhook logs, stale rate-limit counters, dev test accounts) before formalising the API contract surface.

**Firestore (irreversible — PITR is OFF on both projects, confirmed via `firestore:databases:get`):**

- `bunx firebase-tools firestore:delete --all-collections --recursive --force --project adsmart-web-dev` → wiped `adminActivity, productPrices, rateLimits, securityLogs, users` (5 top-level collections, including all `users/{uid}/wallet/{current,transactions}` subcollections).
- `bunx firebase-tools firestore:delete --all-collections --recursive --force --project adsmart-web` → wiped `adminActivity, backupMetadata, oauth_states, payments, pendingPayments, productPrices, rateLimits, reports, temporary_oauth_tokens, users, webhook_logs` (11 top-level collections, same recursive semantics).
- `firestore:list_collections` confirms `{}` on both projects post-wipe.

**Firebase Auth + Cloud Storage:**

- Auth wipe done by the project owner via Firebase Console (Authentication → Users → Delete account, batched). User initially preserved a small admin set, then re-wiped after the `bootstrapUser` fix landed — see next bullet.
- Storage wipe done by the project owner via Firebase Console on each project's default bucket.

**Functions / Rules / Indexes / Secrets — UNCHANGED.** The wipe was data-only.

- `firebase functions:list` returns the 20 deployed functions on prod (and the same set in dev minus the dev-only deltas), same as before the wipe. No code regression in the codebase or in deployed revisions.
- `firestore.rules` (Phase 3 baseline) and `firestore.indexes.json` (composite indexes for `getDashboardMetrics`) unchanged in source and on the wire.
- Secret Manager: `RECAPTCHA_SECRET_KEY` version 1 destroyed in prod earlier today (see reCAPTCHA entry); no other secret destruction performed. All active secrets (`asaasApiKey`, `metaAdsAppSecret`, `googleAdsClientSecret`, `suitpaySecret`) remain enabled.

**Identity Platform blocking trigger fix (dev):**

First post-wipe signup against `adsmart-web-dev` succeeded at Auth layer (user appeared in IndexedDB) but produced **no `users/{uid}` and no `users/{uid}/wallet/current`** in Firestore — the `bootstrapUser` blocking trigger never executed. Root cause: dev's Identity Platform config had `blockingFunctions: {}` (empty) — the Cloud Function `bootstrapUser` was deployed and ACTIVE, but Identity Platform had no registration pointing at it as a `beforeCreate` trigger. Prod was already correctly registered from the 2026-04-26 deploy (`bootstrapuser-2ocqwqseya-uc.a.run.app`); dev was not. The CLI `firebase deploy --only functions:bootstrapUser --project adsmart-web-dev --force` rebuilt the function but did **not** re-attempt the Identity Platform registration — a silent failure in firebase-tools' blocking-function deploy path.

First attempt to register the trigger used the legacy Cloud Functions URL (`https://us-central1-adsmart-web-dev.cloudfunctions.net/bootstrapUser`) and produced (in function logs at severity ERROR):
```
FirebaseAuthError: Firebase Auth Blocking token has incorrect "aud" (audience) claim.
Expected "run.app" but got
"https://us-central1-adsmart-web-dev.cloudfunctions.net/bootstrapUser".
```
The signup surfaced as Firebase error code `-47` (`auth/internal-error`) on the client. Functions v2 are backed by Cloud Run, and Identity Platform validates the OIDC `aud` claim against the actual Cloud Run service URL.

Fix:

```bash
curl -X PATCH \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "x-goog-user-project: adsmart-web-dev" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/adsmart-web-dev/config?updateMask=blockingFunctions" \
  -d '{
    "blockingFunctions": {
      "triggers": {
        "beforeCreate": {
          "functionUri": "https://bootstrapuser-nnhhnhk2wa-uc.a.run.app"
        }
      }
    }
  }'
```

`functionUri` is the Cloud Run service URL — visible in `firebase functions:list` output or `serviceConfig.uri` from a deploy response. Validated: second signup attempt by the same email created `users/{uid}` and `users/{uid}/wallet/current` correctly (visible via Firebase MCP `firestore_get_document` on both paths immediately after signup). Prod was not modified — its registration was already correct.

**Admin claim setup (dev):**

After the working signup, granted the admin custom claim to the test account via Identity Toolkit REST API (no script, no Admin SDK boilerplate):
```bash
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "x-goog-user-project: adsmart-web-dev" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/v1/projects/adsmart-web-dev/accounts:update" \
  -d '{"localId":"<UID>","customAttributes":"{\"admin\":true}"}'
```
Verified via `accounts:lookup` that `customAttributes` returns `{"admin":true}`. ID token refresh required on the client (sign out + sign in) for the claim to land in the active session.

**What was NOT done (deferred / out of scope):**

- Prod re-cadastro to re-validate the trigger end-to-end — deferred. Prod's `blockingFunctions` registration is intact (verified via the same admin API GET), and the owner has not yet attempted a fresh signup. If signup ever fails in prod, the same fix shape applies, with `functionUri: https://bootstrapuser-2ocqwqseya-uc.a.run.app` (the prod Cloud Run URL, stable since 2026-04-26).
- Automated emulator test for the registration. The check could be a single GET in `/firebase-deploy` flow that asserts `blockingFunctions.triggers.beforeCreate.functionUri.endsWith('.run.app')` — tracked as a possible future enhancement to the deploy guard scripts, not in this entry.
- `productPrices` re-seed. Left to organic re-creation by the existing `initializeDefaultPrices` callable, which the admin panel invokes when the collection is missing. No manual seed via MCP or scripts — keeps a single seed path (the callable + admin-only auth check), avoiding seed drift.

**Process notes:**

- Auth wipe and Storage wipe were both performed by the project owner via Firebase Console rather than CLI scripts. This was intentional: those operations are irreversible and benefit from the visual confirmation a Console action provides over a one-shot scripted batch. Documented here so the same split (CLI → Firestore; Console → Auth/Storage) can be reused if the wipe ever repeats.
- The Identity Platform PATCH was used in preference to redeploying or clicking through Firebase Console. The Console path also works (Authentication → Settings → Blocking functions → Save) but produces no reviewable artifact and is silent about the underlying URL it registers. The REST PATCH leaves the exact request body in the operator's history, which is what landed in ADR-015 verbatim.



**Status:** Shipped (client + functions code). Deploy + zombie delete: pending the next deploy step. Decision documented in [Decisions.md ADR-014](Decisions.md#adr-014-remove-security-logs-admin-tab-keep-logger-primitive).

The `/admin/security` tab and its `getSecurityStats` callable were removed. Same overengineering argument as the reCAPTCHA removal earlier this day (ADR-013): at current product stage the admin opens this tab roughly never, Cloud Logging covers the same data with proper filtering and retention, and the bespoke UI was duplicating Cloud Logging without adding signal. Critical distinction enforced in the implementation: the LOGGER primitive (`SecurityLogger` class + `SecurityEventType` + `SecuritySeverity` enums + `securityLogs/{id}` Firestore collection) **stays** — 5 other Cloud Functions write to it for audit (`googleAdsOAuth`, `metaAdsOAuth`, `rateLimiter`, `adminWalletManager`, and the SUSPICIOUS_ACTIVITY re-entrancy guard inside `securityLogger.ts` itself). Removing the logger would have broken all of them.

**Client (commit `d899a7a`):**

- Deleted [src/pages/admin/SecurityLogsPage.tsx](../src/pages/admin/SecurityLogsPage.tsx) (124 lines, single consumer of `getSecurityStats`).
- [src/App.tsx](../src/App.tsx) — dropped `SecurityLogsPage` import + `<Route path="security">` child route. Navigating to `/admin/security` now falls through to the parent's `<Route index element={<Navigate to="dashboard" replace />} />` and lands on `/admin/dashboard` — no 404, bookmarks survive.
- [src/pages/admin/AdminLayout.tsx](../src/pages/admin/AdminLayout.tsx) — removed `Shield` icon import (no other consumer) and the security entry from `tabs`. Admin sub-nav goes from 4 tabs to 3.
- [src/pages/admin/AdminLayout.test.tsx](../src/pages/admin/AdminLayout.test.tsx) — adapted to 3-tab world: renamed the first test, dropped the security child route, added a defensive `expect(hrefs).not.toContain('/admin/security')` assertion to catch silent re-introduction.
- [src/locales/pt-BR.json](../src/locales/pt-BR.json), [src/locales/en.json](../src/locales/en.json), [src/locales/es.json](../src/locales/es.json) — removed `admin.nav.security` plus the full `admin.security.*` subtree (10 keys per locale).
- [src/locales/types.ts](../src/locales/types.ts) — removed `nav.security: string` and the `security: {...}` interface block so the `as Translations` casts in `LanguageContext` stay structurally sound.

**Functions (commit `24407d4`):**

- Deleted [functions/src/securityStats.ts](../functions/src/securityStats.ts) (56 lines, the callable that wrapped `SecurityLogger.getSecurityStats()` with an admin gate).
- [functions/src/index.ts](../functions/src/index.ts) — removed `export { getSecurityStats } from './securityStats'`.
- [functions/src/securityLogger.ts](../functions/src/securityLogger.ts) — removed the `getSecurityStats(days)` method (~40 lines, only consumer was `securityStats.ts`). The rest of the class is intact: `logEvent`, `getDb`, SUSPICIOUS_ACTIVITY re-entrancy guard, the `SecurityEvent` type, both enums. Refined the `@deprecated` comment on `RECAPTCHA_SUCCESS`/`RECAPTCHA_FAILED` so it no longer references the now-deleted `SecurityLogsPage`; the new justification is "Cloud Logging / Admin-SDK audit consumers depend on the enum being exhaustive".

**Untouched (verified, not assumed):**

- `firestore.rules` `match /securityLogs/{logId}` block — `allow read/write: if false` stays. Writes from app code go through Admin SDK in the logger; nothing client-side reads.
- `firestore.indexes.json` — zero composite indexes on `securityLogs` existed (the collection was always Admin-SDK scanned), nothing to remove.
- `functions/test/securityLogger.test.ts` — tests the logger primitive that stays.
- All 5 writers (`googleAdsOAuth`, `metaAdsOAuth`, `rateLimiter`, `adminWalletManager`, the logger's own re-entrancy path).
- `securityLogs/{id}` Firestore collection — audit trail intact; cleanup of historical documents is out of scope and can be batched separately if storage cost ever becomes material.

**Deploys + zombie cleanup (pending after this commit):**

- `firebase deploy --only functions --project adsmart-web-dev` will abort with the expected non-interactive warning ("functions found in your project but do not exist in your local source code: getSecurityStats"). Resolve with `firebase functions:delete getSecurityStats --project adsmart-web-dev --region us-central1 --force`, then re-deploy. Same sequence for `--project adsmart-web` after dev validation.
- No Secret Manager cleanup required (no secret declarations were removed).

**Verification:**

- `bun run typecheck` clean across the monorepo.
- `bun run test` 61/61 web tests pass (AdminLayout test adapted to 3 tabs; everything else unchanged).
- `cd functions && bun run typecheck` clean; `bun run build` produces 0.77 MB bundle (was 0.78 MB pre-removal — 10 KB saved from the dead code path, not material).

---

## [2026-05-17] — reCAPTCHA removed end-to-end (login, callable, secret declaration, CSP)

**Status:** Shipped. Decision documented in [Decisions.md ADR-013](Decisions.md#adr-013-drop-google-recaptcha-from-authentication).

reCAPTCHA gating on the email/password login was removed from the product. Trigger was an `["invalid-input-response"]` failure from Google `siteverify` against `adsmart-web-dev` (the dev secret had drifted out of sync with the site key, blocking every dev login) but the underlying decision was that the layer was overengineering for the current product stage. The remaining anti-abuse posture is the existing client-side `useRateLimit` (5 attempts / 15 min) + Firebase Auth's server-side per-account/IP throttling. The full threat-model after the change and the reintroduction trigger (Firebase App Check, not reCAPTCHA v2) are in the ADR.

**Client (commit `cc0d2d0`):**

- [src/pages/LoginPage.tsx](../src/pages/LoginPage.tsx) — deleted `<ReCAPTCHA>` widget, `recaptchaValue` state, the dev/test-user toggle banners, all `skipRecaptcha`/`isTestUser`/`devConfig` branches in `handleSubmit`, and the `setRecaptchaValue(null)` resets in the login/signup toggle. `signInWithEmail` is now called with just `(email, password)`.
- [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx) — deleted the `verifyRecaptchaToken` helper, simplified `signInWithEmail(email, password)` (dropped the 3rd `recaptchaToken?: string` parameter), removed `httpsCallable` + `functions` imports (no other consumer in this file).
- [src/utils/development.ts](../src/utils/development.ts) — deleted entirely. `getDevConfig()` was 100% reCAPTCHA-related; the unused `isDevelopment()` and `isPrivateIP()` helpers had no consumers either.
- [package.json](../package.json) — removed `react-google-recaptcha@^3.1.0` and `@types/react-google-recaptcha@^2.1.9`. `bun install` removed 2 packages.
- [.env.example](../.env.example), [.env.production](../.env.production) — removed `VITE_RECAPTCHA_SITE_KEY` (and its preceding comment block in `.env.example`).
- [firebase.json](../firebase.json) CSP — trimmed `https://www.google.com` and `https://www.gstatic.com` from `script-src`, `connect-src`, `frame-src`. Kept `apis.google.com` (Firebase Auth Google popup), `fonts.gstatic.com` (Google Fonts), `googletagmanager.com` (GTM).

**Functions (commit `6d0e05a`):**

- Deleted `functions/src/recaptcha.ts` (126 lines including a recent uncommitted 2026-05-02 instrumentation patch capturing Google's `errorCodes` in `HttpsError.details`).
- [functions/src/index.ts](../functions/src/index.ts) — removed `export { verifyRecaptcha } from './recaptcha'`.
- `functions/src/config/index.ts` — removed `recaptchaSecretKey = defineSecret('RECAPTCHA_SECRET_KEY')`. The other secrets (`encryptionKey`, `googleAdsClientSecret`, `metaAdsAppSecret`) remain.
- [functions/src/securityLogger.ts](../functions/src/securityLogger.ts) — KEPT the `RECAPTCHA_SUCCESS` / `RECAPTCHA_FAILED` enum values with a `@deprecated 2026-05-17` comment. Historical `securityLogs/{id}` entries reference these types; admin `SecurityLogsPage` relies on the enum being exhaustive. No producer remains.
- `axios` (in `functions/package.json`) **not removed** — verified `googleAdsOAuth.ts`, `metaAdsOAuth.ts`, `suitpayPayment.ts`, `googleAdsOAuthV2.ts` all import it.

**Hygiene fix surfaced en route (commit `438449e`):**

- [functions/.gitignore](../functions/.gitignore) had an un-anchored `config/` rule that recursively ignored `functions/src/config/` — making the entire `defineSecret` manifest untracked. Removing the rule and force-adding `functions/src/config/index.ts` brings the canonical secrets manifest into version control for the first time. Public config only — secret VALUES live in Google Secret Manager; the file only references their names via `defineSecret`.

**Deploys + secret cleanup (both environments executed in the same session):**

- **`adsmart-web-dev`** — `firebase deploy --only functions` aborted with the expected non-interactive warning ("functions found in your project but do not exist in your local source code: verifyRecaptcha"). `firebase functions:delete verifyRecaptcha --region us-central1 --force` succeeded. `firebase functions:secrets:destroy RECAPTCHA_SECRET_KEY --force` destroyed version 1 and reported "No active secret versions left. Destroying secret RECAPTCHA_SECRET_KEY". `firebase functions:list` confirms `verifyRecaptcha` no longer present.
- **`adsmart-web`** — same sequence. `functions:delete` succeeded. The follow-up `firebase deploy --only functions` updated all 19 functions successfully **except `handleGoogleAdsCallbackWithSelection`**, which is a pre-existing OAuth callback configuration issue unrelated to reCAPTCHA — its previous revision remains active. `RECAPTCHA_SECRET_KEY@2` was destroyed (no other accessible versions; `firebase functions:secrets:access` confirms `DESTROYED state`). The handleGoogleAdsCallbackWithSelection deploy failure is tracked separately and does not block the reCAPTCHA work.

**Verification:**

- `bun run typecheck` clean across the monorepo.
- `bun run test` 61/61 web tests pass (no reCAPTCHA-specific tests existed).
- `bunx biome check` exits 0 — 6 pre-existing `useButtonType`/`noSvgWithoutTitle` warnings on social-login buttons, zero new warnings, zero errors.
- **Dev end-to-end smoke test (Chrome DevTools MCP):** login page renders without the reCAPTCHA iframe, console is empty, no requests to `google.com/recaptcha` / `gstatic.com/recaptcha`. Manual sign-in with admin email/password succeeded. `/admin/dashboard` rendered all three cards (Receita gerada / Usuários / Top integrações), the DateRangeFilter showed the default 30-day range, sparklines drew via recharts, and `getDashboardMetrics` returned HTTP 200 (4 calls observed — React StrictMode double-invoke + filter callback). Side effect: this validation unblocked Subprojeto 2 Task 18 Step 3, which had been blocked at "smoke test" since 2026-04-27 — the dashboard was likely fine after the index propagation but the reCAPTCHA login error prevented us from reaching it.
- **Prod end-to-end smoke test:** pending the prod hosting deploy (frontend bundle without the reCAPTCHA widget is not yet published). The callable side has been verified live via the dev test pattern; once hosting deploys, the login flow at `https://adsmart.app/login` will mirror dev.

---

## [2026-05-02] — Docs sweep: Subprojeto 2 surface graduated to "shipped" in conventions/docs

Closes the docs-sweep follow-up flagged by the [2026-05-01] Subprojeto 2 Task 18 entry. The dashboard callable + UI surface are now reflected in the conventions docs and per-feature contracts; no code change.

- **[AGENTS.md](../AGENTS.md):** the "Add an admin sub-page" row in the read-first map now points at `AdminLayout.tsx` (tab list) and notes the `React.lazy` pattern from `AdminDashboardPage.tsx` for heavy pages (charts, etc.). New row "Add an admin metrics callable" points at `getDashboardMetrics.ts` as the canonical example (admin gate, Zod input from `@adsmart/shared`, `Promise.allSettled` over labelled reads, BRT-anchored day bucketing).
- **[docs/QA-CHECKLIST.md](QA-CHECKLIST.md):** admin panel section bumped from 3 tabs to 4 tabs (Dashboard / Logs / Prices / Wallet) with `/admin` → `/admin/dashboard` as the new default redirect (spec R9). Added a dedicated "Dashboard tab" subsection with 11 manual QA items covering preset buttons, custom-range dialog, > 365d guard (client + server), card content, sparkline behavior, error-banner retry path, and the console-clean assertion (`error|fail|dashboard|Q[1-7]|FAILED_PRECONDITION|HttpsError|internal`). The pre-existing Security/Prices/Wallet items are preserved verbatim, just regrouped under per-tab headings.
- **[docs/API-CONTRACTS.md](API-CONTRACTS.md):** new `getDashboardMetrics` entry added after `getSecurityStats`. Documents the `onCall({ memory: '512MiB' })` config, admin gate, Zod schemas via `@adsmart/shared`, the `Promise.allSettled` orchestration over Q1–Q7, day-bucketing TZ, the `realCents = max(0, totalCents - grantedCents)` derivation, full input/output shapes, error codes (including the labelled `Dashboard query failures: Q<n>` message), and the required composite indexes / field overrides shipped in [firestore.indexes.json](../firestore.indexes.json).
- **[docs/DEPLOYMENT.md](DEPLOYMENT.md):** "Auth blocking triggers (Identity Platform)" section corrected — three references to the legacy `bootstrapUserWallet` name updated to `bootstrapUser` (renamed in the 2026-04-26 ADR-010 revision when the trigger was extended to seed both `users/{uid}` and `users/{uid}/wallet/current` in a single batched write). The link from `bootstrapUserWallet` to ADR-010's older anchor is replaced with the current anchor (`adr-010-per-user-state-bootstrap-moved-to-server-side-auth-blocking-trigger`). Added a backstop sentence noting that both projects had Identity Platform enabled and the trigger deployed during the 2026-04-26 reconciliation.
- **[docs/ERROR-HANDLING.md](ERROR-HANDLING.md):** new subsection "Multi-read callables: labelled `Promise.allSettled` over `Promise.all`" added after the `instanceof HttpsError` re-throw pattern. Promotes the Subprojeto 2 Task 18 instrumentation (`fb2595e`) from incident-specific to a documented project convention for any callable orchestrating 3+ reads, with `getDashboardMetrics` as the canonical example.

What was deliberately NOT changed:

- **[docs/Decisions.md](Decisions.md):** ADR-010 already reads "Per-user state bootstrap" and the 2026-04-26 revision note already covers the rename. No new ADR for the labelled-allSettled pattern — it's a small convention, not an architectural decision; ERROR-HANDLING.md is the right home.
- **[docs/REFACTOR-PLAN.md](REFACTOR-PLAN.md):** Phases A–E already marked Completed at the header; no Subprojeto 2 content belongs there.
- **[docs/DATA-MODEL.md](DATA-MODEL.md):** dashboard reads from existing collections only; no new collection or shape was introduced. Field-level docs are unchanged.
- **Dead-code cleanup** (top-level `campaigns/{id}` + `reportTemplates/{id}` rules + backupScheduler config). Still pending production-data verification via `gcloud firestore` per the post-Phase-D follow-up. Out of scope for this sweep.

Verification: `bun run typecheck` not required (markdown-only). All updated docs render cleanly under the existing markdown conventions; cross-links resolve. Working tree was clean before the sweep; only docs files plus this CHANGES entry are modified.

---

### 2026-05-01 — feat(claude): Firebase Conventions Pack

Added enforcement tooling that moves AdSmart's Firebase conventions from passive docs to active tooling:

- 4 slash commands in `.claude/commands/` (firestore-rules-test, firestore-new-query, functions-new-callable, firebase-deploy)
- 3 agents in `.claude/agents/` (firestore-rules-reviewer, functions-security-reviewer, firestore-query-reviewer)
- 6 hooks in `.claude/settings.json` (3 PreToolUse blocks, 2 PostToolUse warns, 1 UserPromptSubmit inject)
- 7 Cursor rules in `.cursor/rules/` mirroring the same conventions
- Helper scripts in `scripts/firebase/` (test-rules.sh, safe-deploy.sh, 3 PreToolUse helpers, 1 UserPromptSubmit helper, context-snippet.txt)

Patterns validated against Firebase Functions v2 SDK + Firestore Security Rules + index docs (Context7) AND against actual project code (`reserveUserDocument.ts`, `getDashboardMetrics.ts`, `bootstrapUser.ts`, `config/index.ts`).

Spec: [docs/superpowers/archive/specs/2026-05-01-firebase-conventions-design.md](superpowers/archive/specs/2026-05-01-firebase-conventions-design.md).
Plan: [docs/superpowers/archive/plans/2026-05-01-firebase-conventions-pack-plan.md](superpowers/archive/plans/2026-05-01-firebase-conventions-pack-plan.md).

---

## [2026-05-01] — Subprojeto 2 Task 18 closed: `getDashboardMetrics` 500 INTERNAL resolved (dev + prod deployed)

**Status:** Resolves the "Task 18 Step 3 — outstanding" blocker from the [2026-04-26] WIP entry below. The admin dashboard callable now returns 200 consistently. Function and indexes deployed to **both** `adsmart-web-dev` and `adsmart-web`. UI smoke green in dev (Cowork agent, 5/5 calls 200). UI smoke in prod is **deferred** until the next hosting deploy (see "Prod UI smoke deferred" below — the served prod bundle predates the dashboard route).

**Root cause confirmed**

Two-pronged: (1) `Promise.all` over the 7 reads in [functions/src/getDashboardMetrics.ts](../functions/src/getDashboardMetrics.ts) collapsed all rejections into a single opaque `INTERNAL` — making it impossible to know *which* of Q1–Q7 was failing from Cloud Logging (`details:''` on most rows). (2) The collectionGroup query `adAccounts.where('isActive','==',true)` (Q7) lacked a single-field exemption for `isActive` covering both COLLECTION and COLLECTION_GROUP scopes; the four prior Task 18 deploys (`064476f`, `936c9d1`, `04c3b37`, plus the initial 5-entry deploy) added composite orderings for `transactions` aggregates but missed this one. The instrumentation patch surfaced the real culprit on the next dev smoke.

**Commits this session (on `develop`)**

- `fb2595e` `feat(getDashboardMetrics): label all 7 reads via Promise.allSettled to surface per-query FAILED_PRECONDITION` — replaces `Promise.all` with `Promise.allSettled` over labelled queries Q1_allCreditsTotal_agg, Q2_grantedTotal_agg, Q3_txSnap, Q4_usersInRangeSnap, Q5_totalUsers_agg, Q6_activeTxSnap, Q7_adAccountsSnap. On any rejection, logs `[dashboard:fail:Q<n>]` with `error.code`/`message`/`details`/`stackHead` and throws `HttpsError('internal', 'Dashboard query failures: Q<n>[, Q<m>...]')` so the client message names the failing label(s) directly. Post-processing (revenue/users/integrations/sparklines) reorganized to consume the fulfilled tuple in the same order.
- `6bf62ec` `fix(firestore): add adAccounts.isActive fieldOverride for COLLECTION + COLLECTION_GROUP scopes` — single field-override entry covering ASC/DESC at COLLECTION scope and ASC at COLLECTION_GROUP. Resolves Q7's missing-index FAILED_PRECONDITION.

**Validation evidence**

- `cd functions && bun run typecheck` clean.
- `cd functions && bunx vitest run test/getDashboardMetrics.test.ts` 6/6 green.
- `cd functions && bun run build` produces a 0.78 MB bundle in `functions/deploy/`.
- Dev deploy (`adsmart-web-dev`): both `firestore:indexes` and `functions:getDashboardMetrics` succeeded; `Successful update operation.` for the function.
- Cowork dev smoke at `localhost:5173/admin/dashboard` (admin-logged): **5/5 calls 200** across ranges (load, 30d preset, 7d preset, 7d custom, 365d preset), durations 535–586 ms; response shape matches `GetDashboardMetricsOutputSchema` (revenue.realCents/creditsCents/sparkline, users.newCount/activeCount/totalCount/sparkline, integrations.byPlatform, range.days, generatedAt); console clean of `error|fail|dashboard|Q[1-7]|FAILED_PRECONDITION|HttpsError|internal` (only react-router future-flag warnings); custom-range UI works; `> 365` days client guard surfaces "Período não pode exceder 365 dias" inline in the modal AND the server-side guard in [`GetDashboardMetricsInputSchema.refine(...days <= MAX_RANGE_DAYS)`](../packages/shared/src/schemas/dashboardMetrics.ts#L14) is intact (defense-in-depth).
- Prod deploy (`adsmart-web`): both `firestore:indexes` and `functions:getDashboardMetrics` succeeded; **`Successful create operation.`** for the function (it had never existed in prod before — first time landed). Index propagation observed for ~90 s before declaring done.

**Prod UI smoke deferred**

The hosting bundle currently served at `adsmart-web.web.app` / `adsmart-web.firebaseapp.com` is `bc11f3` from **2025-08-03**. `origin/main` is at `f63daec` "limpeza" from `2026-03-03`. `develop` is **169 commits ahead of `main`**, and the entire admin dashboard refactor (Subprojeto 1+2) lives on `develop`. The `/admin/dashboard` route does not exist in the served bundle, so a UI smoke against either of the prod default URLs would 404. The custom domain `adsmart.app` was unmapped while site work is ongoing. The function and indexes ARE in prod and ready; the UI smoke will happen naturally when `develop` is merged to `main` and CI redeploys hosting (per [docs/DEPLOYMENT.md](DEPLOYMENT.md)). Until then, prod readiness is implied transitively by the dev smoke (same compiled bundle in `functions/deploy/`, same `firestore.indexes.json`).

**What is NOT shipped this session**

- `Promise.allSettled` instrumentation revert. The original plan called for a dedicated `chore(getDashboardMetrics): revert to Promise.all after Q-failures resolved` commit on Task 19. Holding off — the labelled-error pattern is a strict improvement over the silent-collapse anti-pattern of `Promise.all`, and the cost is ~60 lines of bookkeeping. Recommend keeping it. If the user still wants the revert, it lands in a follow-up commit.
- Frontend changes. UI was already complete on `develop` (Tasks 1–17). Only the server-side reads were re-shaped.
- Push to `origin/develop`. The two commits + this CHANGES.md update are local; user-controlled push.

**Cross-references**

- Live blocker entry that this resolves: `[2026-04-26] — Admin dashboard server + foundations landed (Subprojeto 2 — WIP)`, "Task 18 Step 3 — outstanding".
- Adjacent known issue not addressed: `[2026-05-01] — Known issue: verifyRecaptcha returns 500 on fresh login in dev` (out of scope; pre-existing).

---

## [2026-05-01] — Known issue: `verifyRecaptcha` returns 500 on fresh login in dev (out of scope, deferred)

**Status:** Discovered while running the Subprojeto 2 Task 18 dashboard smoke test in a profile-zerado Chrome (no persisted Firebase session). Pre-existing — not introduced by any commit in this session. Tracked here so it gets attacked separately. **No code change shipped for this bug.**

**Symptom**

- Login form (password flow) on `localhost:5173/login` against `adsmart-web-dev`.
- UI banner: "Falha na verificação de segurança".
- Network: `POST .../verifyRecaptcha` → `500 INTERNAL`.
- Console: `FirebaseError: Erro ao verificar ReCAPTCHA` originating at [src/contexts/AuthContext.tsx:93](../src/contexts/AuthContext.tsx#L93).
- Reproducible only on a **fresh** login (no Firebase session cookie). Existing logged-in browsers never hit `verifyRecaptcha` — their session token is reused — so the bug is silent in normal day-to-day use of dev.

**Call chain**

```
LoginPage.handleSubmit               src/pages/LoginPage.tsx:66
  → AuthContext.signInWithEmail      src/contexts/AuthContext.tsx:113
    → AuthContext.verifyRecaptchaToken  src/contexts/AuthContext.tsx:87
      → httpsCallable('verifyRecaptcha')  ← 500 here
        → functions/src/recaptcha.ts:16  (server)
```

Server flow: validate token → `checkRateLimit('anonymous','recaptcha_verify',10,5)` (writes `rateLimits/anonymous_recaptcha_verify` via Admin SDK) → `axios.post('https://www.google.com/recaptcha/api/siteverify', { secret: recaptchaSecretKey.value(), response: token })` → if `success===false` throws `failed-precondition` → `securityLogger.logEvent(RECAPTCHA_SUCCESS, ...)` → return.

**Why the client sees a generic message**

The catch-all in [functions/src/recaptcha.ts:64-84](../functions/src/recaptcha.ts#L64-L84) wraps every non-rate-limit error as `HttpsError('internal', 'Erro ao verificar ReCAPTCHA')`. Same anti-pattern as the dashboard's pre-`fb2595e` `Promise.all` catch-all — silently collapses the real cause. Server `console.error('Erro ao verificar ReCAPTCHA:', error)` carries the truth but it's only visible in Cloud Logging.

**Hypotheses ranked**

1. **(most likely) `RECAPTCHA_SECRET_KEY` secret missing or invalid in `adsmart-web-dev`** — `recaptchaSecretKey.value()` returns wrong/empty value, Google API replies `{success:false, "error-codes":["missing-input-secret"|"invalid-input-secret"]}`, `failed-precondition` is rethrown as `internal`. Defined via `defineSecret` in [functions/src/config/index.ts:23](../functions/src/config/index.ts#L23). The function has been redeployed several times in dev recently (5 rounds during Task 18) — secret must be versioned in Secret Manager and explicitly bound to `verifyRecaptcha`.
2. **`checkRateLimit` Firestore op fails** on `rateLimits/anonymous_recaptcha_verify` (every anonymous login fans into the same doc — contention point).
3. **`axios.post` to `google.com/recaptcha/api/siteverify` times out / network errors** on cold start.
4. **`securityLogger.logEvent(RECAPTCHA_FAILED, ...)` throws inside the catch** — least likely (the logger has internal try/catch at [functions/src/securityLogger.ts:111-115](../functions/src/securityLogger.ts#L111-L115)), and even if it threw, the symptom would be unchanged.

**To resolve (when picked up)**

1. Confirm hypothesis #1: `gcloud secrets versions list RECAPTCHA_SECRET_KEY --project=adsmart-web-dev` (or Firebase Console → Functions → `verifyRecaptcha` → Secrets tab). If missing/empty: `firebase functions:secrets:set RECAPTCHA_SECRET_KEY --project adsmart-web-dev`, then redeploy `verifyRecaptcha`.
2. Repeat the secret check on `adsmart-web` (prod) defensively — no end-user has reported broken login, so prod is probably fine, but worth a 1-min audit.
3. Pull `bunx firebase-tools functions:log --only verifyRecaptcha --project adsmart-web-dev` to read the real `console.error` and confirm hypothesis before changing anything. If the log says `missing-input-secret` / `invalid-input-secret` → hypothesis #1 confirmed. If it says `ECONNRESET` / `ETIMEDOUT` → hypothesis #3. If it's a Firestore error on `rateLimits` → hypothesis #2.
4. **Add labelled-catch instrumentation** to `recaptcha.ts:64-84` in the same shape as the dashboard's `[dashboard:fail:Q<n>]` pattern (commit `fb2595e`): log `error.code` + `error.message` distinctly before re-throwing as `internal`. Same hygiene improvement — never lose visibility on opaque server errors again.

**Out of scope for this session**

This session is Subprojeto 2 Task 18 — dashboard fix only. The `verifyRecaptcha` bug pre-existed (commits `fb2595e` and `6bf62ec` from this session do not touch `recaptcha.ts`, `rateLimiter.ts`, `securityLogger.ts`, `AuthContext.tsx`, `LoginPage.tsx`, nor any Secret Manager binding).

---

## Older entries

For changes prior to 2026-04-26, see [docs/changelog/2026-Q1.md](changelog/2026-Q1.md).
