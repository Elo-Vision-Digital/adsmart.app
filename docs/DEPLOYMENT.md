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

Build before deploy:
```bash
cd functions
bun run build  # outputs to functions/lib/
```

Deploy:
```bash
firebase deploy --only functions
# or from functions/ directory:
bun run deploy
```

### Adding a new function

1. Create `functions/src/myFunction.ts`.
2. Export the function from `functions/src/index.ts`.
3. If the function uses secrets, declare them: `onCall({ secrets: [mySecret] }, ...)`.
4. If the secret is new, create it: `firebase functions:secrets:set mySecret`.
5. Add the secret handle to `functions/src/config/index.ts`.

## Firestore rules

Rules file: `firestore.rules`. Indexes: `firestore.indexes.json`.

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

Test rules locally before deploying — see `docs/TESTING.md`.

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
