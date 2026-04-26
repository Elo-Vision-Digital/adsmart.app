# Deployment

## Auto-deploy (CI/CD)

Pushes to `develop` and `main` trigger automatic deploys via `.github/workflows/deploy.yml`:

| Branch | Firebase project | URL |
|---|---|---|
| `develop` | `adsmart-web-dev` | `https://adsmart-web-dev.web.app` |
| `main` | `adsmart-web` | `https://adsmart.app` |

**Deploy flow:**
1. `bun install --frozen-lockfile`
2. `turbo run build` → builds web (`dist/`) and functions (`functions/lib/`) with caching
3. `firebase deploy --only hosting,functions --project <target>`

**Prerequisites (one-time):**
- `FIREBASE_TOKEN` GitHub secret set (see `docs/ENVIRONMENT.md`)
- All Firebase Secret Manager secrets provisioned in the target project
- `adsmart-web-dev` project created and configured (see `docs/ENVIRONMENT.md`)

**Manual deploy from local machine:**
```bash
# Deploy to dev
bun run build:all
bunx firebase-tools deploy --only hosting,functions --project adsmart-web-dev

# Deploy to production (prefer letting CI handle this)
bun run build:all
bunx firebase-tools deploy --only hosting,functions --project adsmart-web
```

---

## Overview

AdSmart deploys to Firebase. There are two deployable targets:
- **Hosting** — the React SPA (`dist/`)
- **Functions** — Cloud Functions (`functions/lib/`)

## Production deploy checklist

Before deploying, verify:

- [ ] `bun run build` succeeds (TypeScript + Vite)
- [ ] `cd functions && bun run build` succeeds
- [ ] All secrets set in Secret Manager (`googleAdsClientSecret`, `metaAdsAppSecret`, `recaptchaSecretKey`)
- [ ] `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `META_ADS_APP_ID` configured in functions environment
- [ ] OAuth redirect URIs updated in Google Cloud Console and Meta App Dashboard if domain changed
- [ ] reCAPTCHA domain allowlist includes `adsmart.app`
- [ ] `bun run test` passes (web)
- [ ] `cd functions && bun run test` passes

## Deploy commands

```bash
# Deploy everything
firebase deploy

# Deploy hosting only
firebase deploy --only hosting

# Deploy functions only
firebase deploy --only functions

# Deploy Firestore rules only
firebase deploy --only firestore:rules
```

## Firebase Hosting

Configuration in `firebase.json`:
- Public dir: `dist/`
- SPA rewrite: all routes → `/index.html`
- Security headers on all files: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS`, `COOP`, `CORP`, `CSP`
- Cache-Control: `public, max-age=31536000, immutable` for all static assets (`*.js`, `*.css`, `*.json`)

After `vite build`, deploy with:
```bash
firebase deploy --only hosting
```

## Cloud Functions

Region: `us-central1`. All functions use Firebase Functions v2 (`firebase-functions/v2/https`).

Functions are deployed as a **bundled artifact** under `functions/deploy/` rather than the raw `functions/` source tree. The bundle inlines `@adsmart/shared` so Cloud Build's `npm install` never sees the workspace protocol. See [ADR-011](Decisions.md#adr-011-functions-deploy-via-bundled-functionsdeploy-directory) for the full rationale.

Build before deploy:
```bash
cd functions
bun run build
# Runs three steps in sequence:
#   tsc                            -> functions/lib/*.js
#   bun build (CJS, externals)     -> functions/lib/bundle.js
#   prepare-deploy.mjs             -> functions/deploy/{index.js,package.json}
```

Deploy:
```bash
firebase deploy --only functions --project <target>
# or from functions/ directory:
bun run deploy
```

`firebase.json.functions` declares `source: "functions/deploy"` and `predeploy: ["bunx turbo run build --filter=@adsmart/functions..."]`, so the predeploy step rebuilds `@adsmart/shared` (CJS dist) and the functions bundle in topological order.

### Adding a new function

1. Create `functions/src/myFunction.ts`.
2. Export the function from `functions/src/index.ts` (the bundler discovers exports there).
3. If the function uses secrets, declare them: `onCall({ secrets: [mySecret] }, ...)`.
4. If the secret is new, create it: `firebase functions:secrets:set mySecret --project <target>`.
5. Add the secret handle to `functions/src/config/index.ts`.
6. **If the function should be callable anonymously** (e.g. a public price catalog), pass `invoker: 'public'` in the `onCall` options. v2 callables default to private invoker; without this, anonymous browser calls return `403 Forbidden`. See [ADR-011](Decisions.md#adr-011-functions-deploy-via-bundled-functionsdeploy-directory) — note the one-time `gcloud run services add-iam-policy-binding` required after the first successful deploy of each public callable on a new project.

### Public callable IAM grant (one-time, per project per public function)

Firebase CLI 14.x does not always propagate the `invoker: 'public'` option on `onCall` updates. After the first deploy of any new public v2 callable on a project, run once:

```bash
gcloud run services add-iam-policy-binding <function-name-lowercased> \
  --region=us-central1 \
  --member='allUsers' \
  --role='roles/run.invoker' \
  --project=<firebase-project-id>
```

The binding is permanent — subsequent redeploys preserve it. Repeat per project (`adsmart-web-dev`, `adsmart-web`).

## Reconciling dev environment drift

`adsmart-web-dev` is treated as ephemeral and CI auto-deploy only fires on push to `develop`. Long stretches of feature-branch work mean the dev project's deployed surface (Cloud Functions, Firestore indexes, `productPrices` collection) can lag the source tree. When the admin panel or any post-auth flow shows console errors on dev, the prime suspect is **drift**, not real CORS/code bugs.

### 1. Diagnose

```bash
# List currently deployed callables — compare against exports in functions/src/index.ts
bunx firebase-tools functions:list --project adsmart-web-dev

# Probe a specific failing endpoint — 404 from this URL means the function is undeployed.
# Cloud Functions returns plain HTML 404 with no Access-Control-Allow-Origin header,
# which Chrome surfaces misleadingly as a CORS error in DevTools.
curl -i -X POST "https://us-central1-adsmart-web-dev.cloudfunctions.net/<name>" \
  -H "Content-Type: application/json" -d '{"data":{}}'
```

A `404` confirms drift; `401`/`403` mean the function exists and is rejecting unauthenticated calls (expected and correct).

### 2. Reconcile

```bash
# Build the bundled deploy artifact (required by ADR-011 pipeline)
cd functions && bun run build

# Deploy rules + indexes first (index builds are async — give them a head start)
bunx firebase-tools deploy --only firestore:rules,firestore:indexes --project adsmart-web-dev

# Deploy all functions
bunx firebase-tools deploy --only functions --project adsmart-web-dev
```

If the deploy step fails with `Secret environment variable overlaps non secret environment variable: <NAME>`, the cause is a leftover line in `functions/.env` that duplicates a `defineSecret(<NAME>)` declaration in [functions/src/config/index.ts](../functions/src/config/index.ts). Remove the line from `.env`, rebuild, and redeploy only the failing functions: `bunx firebase-tools deploy --only "functions:<name1>,functions:<name2>" --project adsmart-web-dev`. See the 2026-04-26 entry in [CHANGES.md](CHANGES.md) for the original incident.

If the deploy reports `Task index 0 failed: timed out after 1500000ms` for one or more functions, **verify before retrying**: the polling timeout often fires after the Cloud Run service has actually been created. `bunx firebase-tools functions:list --project adsmart-web-dev` is authoritative.

### 3. Seed `productPrices` (one-time per project)

The admin "Configuração de Preços" tab queries the `productPrices` collection. On a fresh project the collection is empty and the tab renders nothing. Two options to seed:

- **Via the deployed callable** (requires admin auth): from the admin panel, call `initializeDefaultPrices` (no UI button today; can be invoked from the browser DevTools console with `firebase.functions().httpsCallable('initializeDefaultPrices')()`).
- **Via the Firebase MCP plugin or Admin SDK**: write the four documents (`google_lancamento`, `meta_lancamento`, `google_negocio_local`, `meta_negocio_local`) directly to `productPrices/{id}` using the schema in [priceManager.ts](../functions/src/priceManager.ts). Use this path when bootstrapping a brand-new project before any admin user has been created.

### 4. Sanity-check production parity

```bash
diff <(bunx firebase-tools functions:list --project adsmart-web-dev | sort) \
     <(bunx firebase-tools functions:list --project adsmart-web | sort)
```

Drift in either direction is a smell. Production drift is rarer (CI deploys on `main`) but happens when a function is renamed or removed without cleaning up the orphan — see ADR-010's renamed `bootstrapUserWallet → bootstrapUser` for an example pattern.

## Firestore rules and indexes

Rules file: `firestore.rules`. Indexes: `firestore.indexes.json`.

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

Index builds are **asynchronous** on Firebase's side — even after `firebase deploy --only firestore:indexes` returns, queries that depend on a brand-new index keep failing for ~1–3 minutes (longer for large collections) until the build completes. Confirm in Firebase Console → Firestore → Indexes that the new index status is `Enabled` before declaring the fix landed. Any change to a query's filter/orderBy combination can require a new composite index — adding the index to `firestore.indexes.json` and deploying it is part of the same change set as the query.

Test rules locally before deploying — see `docs/TESTING.md`.

## Auth blocking triggers (Identity Platform)

Functions that use `firebase-functions/v2/identity` (e.g. `bootstrapUserWallet` — see [ADR-010](Decisions.md#adr-010-wallet-bootstrap-moved-to-server-side-auth-blocking-trigger)) require Identity Platform to be enabled on the target Firebase project. The CLI deploy refuses the trigger otherwise.

One-time enablement per project (dev and prod):
1. Firebase Console → Authentication → Settings → "User actions" tab.
2. Enable Identity Platform (Google may surface a billing-tier upgrade prompt; blocking functions are included on Blaze).
3. Re-run `firebase deploy --only functions:bootstrapUserWallet --project <target>`.

Blocking triggers run **synchronously** on every signup — they add latency to the auth flow. Keep them small (a single Admin SDK write is the upper bound for `bootstrapUserWallet`).

## GitHub Actions CI

File: `.github/workflows/ci.yml`

Triggers: push to `main`, `develop`, or `migrate`; PR to `main` or `develop`.

Jobs:
- **Frontend**: `bun install --frozen-lockfile` → Biome lint → `bun run typecheck` → `bun run build`
- **Functions**: `bun install --frozen-lockfile` → ESLint (non-blocking, `continue-on-error: true`) → `bun run build`

Tests are not in CI yet (to be added in Phase 2).

The functions lint step is non-blocking because ESLint 8 with the legacy `eslint-config-google` generates thousands of pre-existing style violations. Phase 2 will migrate to ESLint 9 flat config and enforce lint in CI.

## Environment secrets in CI

GitHub Actions does not need production secrets to run (lint + typecheck + build only). If tests are added to CI, Firebase emulator setup will be required (see `docs/TESTING.md`).

## Rollback

Firebase Hosting supports instant rollback to a previous release:
```bash
firebase hosting:releases:list
firebase hosting:rollback
```

For function rollbacks, redeploy the previous git tag:
```bash
git checkout <previous-tag>
cd functions && bun run build
firebase deploy --only functions
```
