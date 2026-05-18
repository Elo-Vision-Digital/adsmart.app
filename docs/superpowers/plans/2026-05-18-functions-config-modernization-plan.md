# Functions Config Modernization — Plan

**Spec:** [2026-05-18-functions-config-modernization-design.md](../specs/2026-05-18-functions-config-modernization-design.md)
**Status:** Ready to execute
**Estimated effort:** ~45 min total

---

## Task A — `defineString` declarations in `config/index.ts`

**File:** `functions/src/config/index.ts`

- [ ] Import `defineString` alongside the existing `defineSecret` import.
- [ ] Add 6 `defineString` exports: `googleAdsClientId`, `googleAdsRedirectUri`, `googleAdsRedirectUriDev`, `metaAdsAppId`, `metaAdsRedirectUri`, `metaAdsRedirectUriDev`. Each with the literal current default (preserves behavior when no env override).
- [ ] Rewrite `config.googleAds.clientId` and friends to call `.value()` on the new exports. Keep `scope` / `authUrl` / `tokenUrl` / `apiVersion` as plain literals.

**Validation:**
- `cd functions && bun run typecheck` → clean.
- `cd functions && bun run build` → clean.

---

## Task B — Replace fallbacks in OAuth source files

**Files:**
- `functions/src/googleAdsOAuth.ts`
- `functions/src/googleAdsOAuthV2.ts`
- `functions/src/metaAdsOAuth.ts`
- `functions/src/metaAdsOAuthV2.ts`

For each:

- [ ] Delete the local `GOOGLE_ADS_OAUTH_CONFIG` / `META_ADS_OAUTH_CONFIG` block (or equivalent).
- [ ] Import the relevant `defineString` exports from `./config`.
- [ ] Replace each `process.env.GOOGLE_ADS_CLIENT_ID || '<literal>'` (and Meta equivalents, and the redirect URIs) with the imported param.
- [ ] In `onCall` options, do **not** add `defineString` params to `secrets:[...]`. Params are read at runtime via `.value()`; only `defineSecret` needs the binding.
- [ ] Preserve the testing-flag reads: `process.env.GOOGLE_ADS_TEST_MODE` stays as-is (Cloud Run runtime flag, not a config value).

**Validation:**
- `cd functions && bun run typecheck` → clean.
- `cd functions && bun run build` → clean.

---

## Task C — `prepare-deploy.mjs` refactor + tests

**Files:**
- `functions/scripts/prepare-deploy.mjs`
- `functions/scripts/prepare-deploy.test.mjs` (new)

- [ ] Extract two pure functions: `extractSecretNames(configSource: string): string[]` and `filterEnv(envContent: string, secretNames: string[]): string`.
- [ ] Keep the `main()` flow that reads files / writes output, but compose it from the pure functions.
- [ ] Export both pure functions (named exports) so the test file can import them.
- [ ] Write the three Vitest cases listed in the spec.
- [ ] Confirm Vitest picks up `scripts/*.test.mjs` — if not, adjust `vitest.config.ts` `include` or relocate the test file. Validate by running `cd functions && bun run test`.

**Validation:**
- `cd functions && bun run test` → all green, 3 new tests visible.
- `node functions/scripts/prepare-deploy.mjs` (or equivalent invocation) still produces a valid `functions/deploy/.env` from a real `functions/.env`.

---

## Task D — Convention updates

These are doc-only commits, no code changes. Done BEFORE Tasks A–C so the executing agent has the new rules in context.

- [x] Spec written (this file's sibling).
- [x] Plan written (this file).
- [ ] [AGENTS.md](../../../AGENTS.md) — Add `defineString` to the Cloud Functions v2 baseline (alongside `defineSecret`). Update "what NOT to do" to call out raw `process.env` reads for app config (outside the Cloud Run built-in allowlist).
- [ ] [CLAUDE.md](../../../CLAUDE.md) — Add a one-paragraph cross-ref in the "Cloud Function v2 baseline" section. Don't duplicate AGENTS.md; just point to it.
- [ ] [.claude/agents/functions-security-reviewer.md](../../../.claude/agents/functions-security-reviewer.md) — Reverse the "`process.env` for non-secret config is OK and EXPECTED" line. New rule: enumerate the Cloud Run built-in allowlist; require `defineString` / `defineSecret` for everything else.
- [ ] [docs/OAUTH.md](../../../docs/OAUTH.md) — Replace the `process.env` reference for `GOOGLE_ADS_CLIENT_ID` with the `defineString` pattern.
- [ ] [.cursor/rules/functions-config.mdc](../../../.cursor/rules/) (new) — Mirror the rule for Cursor IDE users.
- [ ] [docs/CHANGES.md](../../../docs/CHANGES.md) — Dated entry summarizing the change.

---

## Task E — Validation gate before commit

Run from repo root:

- [ ] `bun run typecheck` (web)
- [ ] `bun run test --run` (web)
- [ ] `cd functions && bun run typecheck`
- [ ] `cd functions && bun run build`
- [ ] `cd functions && bun run test` (must include the 3 new prepare-deploy tests)
- [ ] `cd packages/shared && bun run test` (regression check)

All green ⇒ proceed to commit.

---

## Commit plan

Group into three logical commits:

1. **`docs(conventions): defineString for non-secret config in Functions v2`** — Task D files (AGENTS / CLAUDE / agent / OAUTH / cursor / CHANGES + spec + plan).
2. **`refactor(functions): non-secret OAuth config via defineString`** — Tasks A + B.
3. **`test(functions): prepare-deploy filter regression suite`** — Task C.

Commit messages should reference the spec path. Three small commits beats one mega-commit for review + revertability.

---

## Post-execution

- [ ] Validate Fase 2 gate (push + prod deploy) is now ready — confirm 4 prod secrets still ENABLED via `firebase functions:secrets:access ... --project adsmart-web` if more than 24h passed since last check.
- [ ] If user authorizes Fase 2: push develop → origin/develop, then run the documented `functions:delete` + `firebase deploy --project adsmart-web` sequence.
- [ ] Update [docs/superpowers/notes/2026-05-18-auth-hardening-handoff.md](../notes/2026-05-18-auth-hardening-handoff.md) only if anything in the harness section overlaps with new conventions (it shouldn't; that work is ortogonal).

---

## Out of scope (do NOT do during this plan)

- Adding `.parse()` to internal Firestore writes (overengineering — see spec Research findings).
- Broadening `check-no-process-env-secret.sh` hook (false-positive risk — see spec Part D).
- Rotating `GOOGLE_ADS_DEVELOPER_TOKEN` (user deferred).
- Pushing or deploying anything.
