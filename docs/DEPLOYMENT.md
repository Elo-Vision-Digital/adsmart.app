# Deployment

## Overview

AdSmart deploys to Firebase. There are two deployable targets:
- **Hosting** — the React SPA (`dist/`)
- **Functions** — Cloud Functions (`functions/lib/`)

## Production deploy checklist

Before deploying, verify:

- [ ] `npm run build` succeeds (TypeScript + Vite)
- [ ] `cd functions && npm run build` succeeds
- [ ] All secrets set in Secret Manager (`googleAdsClientSecret`, `metaAdsAppSecret`, `recaptchaSecretKey`)
- [ ] `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `META_ADS_APP_ID` configured in functions environment
- [ ] OAuth redirect URIs updated in Google Cloud Console and Meta App Dashboard if domain changed
- [ ] reCAPTCHA domain allowlist includes `adsmart.app`
- [ ] `npm test` passes (web)
- [ ] `cd functions && npm test` passes

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
npm run build  # outputs to functions/lib/
```

Deploy:
```bash
firebase deploy --only functions
# or from functions/ directory:
npm run deploy
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

Triggers: push or PR to `main` or `migrate`.

Jobs:
- **Frontend**: `npm ci` → Biome lint → `tsc --noEmit` → `vite build`
- **Functions**: `npm ci` → ESLint (non-blocking, `continue-on-error: true`) → `tsc`

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
cd functions && npm run build
firebase deploy --only functions
```
