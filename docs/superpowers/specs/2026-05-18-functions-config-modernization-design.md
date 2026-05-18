# Functions Config Modernization — Design

**Date:** 2026-05-18
**Status:** Approved (pre-execution)
**Related ADRs:** ADR-016, ADR-017, ADR-019, ADR-021
**Author:** AI-assisted audit session

---

## Context

After Sprints 1–3 + ADR-021 (SuitPay removal), an audit surfaced two residual gaps:

1. **OAuth non-secret config still flows through raw `process.env`** with hardcoded fallbacks in source. Four files duplicate the same `clientId` / `redirectUri` defaults:
   - [functions/src/googleAdsOAuth.ts](../../../functions/src/googleAdsOAuth.ts) (lines 27-29)
   - [functions/src/googleAdsOAuthV2.ts](../../../functions/src/googleAdsOAuthV2.ts) (lines 668-670, 596, 441)
   - [functions/src/metaAdsOAuth.ts](../../../functions/src/metaAdsOAuth.ts) (lines 24-26)
   - [functions/src/metaAdsOAuthV2.ts](../../../functions/src/metaAdsOAuthV2.ts)

   `functions/src/config/index.ts` already exposes these via `process.env || '<fallback>'`, but the four files re-declare local fallbacks anyway. The duplication is the bug; the `process.env` pattern itself is the deeper smell.

2. **`functions/scripts/prepare-deploy.mjs` filters secret-shadow keys with no test coverage.** The hardening shipped in ADR-021 (commit `c67c600`) protects against re-introducing the Cloud Run env-overlap trap, but a future edit to the filter regex would silently break the protection — the next deploy is the only signal.

## Research findings (2026-05-18)

Validated against Context7 (`/firebase/firebase-tools`) + Firebase docs:

- **Functions SDK 6.0.0+** deprecates `functions.config()`. The replacement is the parameterized config system in `firebase-functions/params`.
- **`defineString(name, { default })`** is the canonical pattern for non-sensitive runtime values (OAuth client IDs, redirect URIs, public API endpoints). `defineSecret(name)` is the canonical pattern for sensitive ones (already used here).
- **Why this matters even without rotation:**
  - CLI blocks deployment if a parameter has no value (typed contract enforced at deploy time).
  - Values flow through Cloud Run metadata, not the OS env, so they survive a function being redeployed without source code changes.
  - Replaces three drift surfaces (functions/.env, source fallback, Cloud Run env) with one source of truth (the `defineString` declaration).
- **`process.env` for non-secret config is still technically valid** in Functions v2 — but reading directly from it (instead of going through params) means there is no contract, no default enforcement, and no telemetry. Firebase docs steer all new code through params.

For Zod runtime validation of internal Firestore writes (briefly considered as a separate task), Context7 was unambiguous: *"Zod is commonly used as runtime validation middleware **at system boundaries**"*. Internal writes by code we control are not boundaries; `z.infer` types already give compile-time safety. Dropped from scope.

## Goals

1. Replace four hardcoded OAuth fallbacks with a single `defineString` declaration per parameter in `functions/src/config/index.ts`.
2. Make `prepare-deploy.mjs` testable + add three regression tests.
3. Update agent / hook / docs / conventions so the new pattern is enforced going forward.

## Non-goals

- Do not migrate `GCLOUD_PROJECT`, `FUNCTION_REGION`, `NODE_ENV`, `FUNCTION_TARGET`. Those are Cloud Run built-ins; `process.env` is the documented access path.
- Do not introduce Zod validation on internal write paths. See Research findings above.
- Do not rotate `GOOGLE_ADS_DEVELOPER_TOKEN`. Repo is private; user explicitly deferred.

## Approach

### Part A — `defineString` migration

In [functions/src/config/index.ts](../../../functions/src/config/index.ts):

```typescript
import { defineString } from 'firebase-functions/params'

// Non-secret OAuth config (param-validated at deploy time, single source of truth)
export const googleAdsClientId = defineString('GOOGLE_ADS_CLIENT_ID', {
  default: '422483165860-npdsq44121mh4chg2gers6qade02bo5l.apps.googleusercontent.com',
})
export const googleAdsRedirectUri = defineString('GOOGLE_ADS_REDIRECT_URI', {
  default: 'https://adsmart.app/auth/google-ads/callback',
})
export const googleAdsRedirectUriDev = defineString('GOOGLE_ADS_REDIRECT_URI_DEV', {
  default: 'http://localhost:5173/auth/google-ads/callback',
})
export const metaAdsAppId = defineString('META_ADS_APP_ID', {
  default: '4052927898253765',
})
export const metaAdsRedirectUri = defineString('META_ADS_REDIRECT_URI', {
  default: 'https://adsmart.app/auth/meta-ads/callback',
})
export const metaAdsRedirectUriDev = defineString('META_ADS_REDIRECT_URI_DEV', {
  default: 'http://localhost:5173/auth/meta-ads/callback',
})
```

The existing `config.googleAds` / `config.metaAds` objects in `config/index.ts` switch from `process.env.X || '<literal>'` to `defineString(...).value()`. The four OAuth source files drop their local config blocks and import from `./config`.

`config.googleAds.scope`, `authUrl`, `tokenUrl`, `apiVersion` stay as plain object literals — they are not env-overridable values, just shared constants.

### Part B — `prepare-deploy.mjs` testability

Refactor the script so the filter logic is a pure function:

```javascript
// functions/scripts/prepare-deploy.mjs
export function extractSecretNames(configSource) { /* ... */ }
export function filterEnv(envContent, secretNames) { /* ... */ }

// main() reads files, calls the pure functions, writes output
```

Co-located test file `functions/scripts/prepare-deploy.test.mjs`:
- Case 1: `extractSecretNames` finds all `defineSecret('NAME')` calls (including formatting variants: single quotes, double quotes, with/without whitespace).
- Case 2: `filterEnv` strips matching keys and preserves non-matching keys.
- Case 3: integration — given a synthetic config + .env, the output `.env` is what we expect.

Vitest is already in `functions/package.json`. Add the test file and a `bun run test` invocation discovers it via the existing Vitest config.

### Part C — Convention enforcement

| Surface | Change |
|---|---|
| [.claude/agents/functions-security-reviewer.md](../../../.claude/agents/functions-security-reviewer.md) | Reverse the explicit "`process.env` for non-secret config is OK and EXPECTED" line. New rule: `process.env` reads in `functions/src/` are limited to Cloud Run built-ins (`GCLOUD_PROJECT`, `FUNCTION_REGION`, `NODE_ENV`, `FUNCTION_TARGET`, plus testing flags like `GOOGLE_ADS_TEST_MODE`). Everything else uses `defineString` / `defineSecret`. |
| [AGENTS.md](../../../AGENTS.md) | Add `defineString` to the Functions v2 callable baseline. Update "what NOT to do" with the new pattern. |
| [CLAUDE.md](../../../CLAUDE.md) | Cross-reference from the Cloud Function v2 baseline section. |
| [docs/OAUTH.md](../../../docs/OAUTH.md) | Replace "env var in `.env` and as `process.env` in functions" with the `defineString` pattern. |
| [.cursor/rules/](../../../.cursor/rules/) | Add `functions-config.mdc` mirroring the rule for Cursor IDE. |
| [docs/CHANGES.md](../../../docs/CHANGES.md) | New entry: 2026-05-18 functions config modernization (post-ADR-021 audit). |

### Part D — Hook coverage (deferred — explicit non-goal)

We do **not** add a PreToolUse hook to block `process.env.GOOGLE_ADS_*` writes. Rationale:

- The existing `check-no-process-env-secret.sh` hook is intentionally narrow (only `_SECRET` suffix) because `_KEY`/`_TOKEN`/`_ID` suffixes are legitimate for public values across the project (FIREBASE_API_KEY, RECAPTCHA_SITE_KEY, etc).
- Broadening it would create false positives for `process.env.GCLOUD_PROJECT` and similar built-ins.
- The agent review path (`functions-security-reviewer`) plus the documented convention is sufficient for a 1-developer repo.

Revisit if drift recurs.

## Out of scope

- New schemas, new callables, new collections.
- Auth flow harness (separate handoff in [docs/superpowers/notes/2026-05-18-auth-hardening-handoff.md](../notes/2026-05-18-auth-hardening-handoff.md)).
- Production deploy. Pre-requisites already confirmed; awaits explicit operator authorization in a separate step.

## Acceptance criteria

- [ ] Zero hardcoded OAuth client ID / redirect URI literals in `functions/src/google*`, `functions/src/meta*` (the literals live only as `default` in `defineString` in `config/index.ts`).
- [ ] `bun run typecheck` + `bun run build` clean in `functions/` and at root.
- [ ] `bun run test` in `functions/` includes 3 new tests for `prepare-deploy` filter logic; all pass.
- [ ] `functions-security-reviewer` agent flags any new `process.env.X` read outside the documented Cloud Run built-in allowlist.
- [ ] `docs/OAUTH.md` no longer references `process.env` for client IDs.
- [ ] `docs/CHANGES.md` has a dated entry summarizing the change.

## Risks

| Risk | Mitigation |
|---|---|
| Cloud Run picks up a stale `defineString` default after redeploy | `prepare-deploy.mjs` filter already strips secret-shadow keys from `functions/.env`. New defaults inline in source. |
| Deploy fails because a `defineString` param has no value and no default | All 6 declarations have `default:` set. CLI prompt only fires for missing+no-default. |
| Tests for `.mjs` script don't get discovered by Vitest | If Vitest config doesn't pick up `scripts/`, move to `scripts/__tests__/` or rename to `.test.ts`. Validated before commit. |
| Agent rule change creates false-positive churn on next review pass | Allowlist is explicit; Cloud Run built-ins enumerated. |

## References

- Context7 `/firebase/firebase-tools` queried 2026-05-18: confirms `defineString` is the recommended path for non-sensitive params in Functions v2.
- [Firebase docs — Configure your environment](https://firebase.google.com/docs/functions/config-env): canonical reference.
- [Vitest in-source testing](https://vitest.dev/guide/in-source): pattern for small utility tests.
- ADR-021 (this codebase): origin of `prepare-deploy.mjs` hardening that this design tests.
