# Integrations

Index of every third-party service AdSmart talks to, with the dedicated doc, the entry-point code, and the status. New integrations should be added as a row here AND get a dedicated doc when they cross any of: OAuth, secrets, billable usage, regulatory scope.

## Table

| Integration | Purpose | Status | Dedicated doc | Entry point |
|---|---|---|---|---|
| **Firebase Auth** | User sign-in, custom admin claim | Active | [SECURITY.md](SECURITY.md) | `src/contexts/AuthContext.tsx` |
| **Firebase Firestore** | Single source of truth (users, wallet, transactions, rateLimits) | Active | [DATA-MODEL.md](DATA-MODEL.md), [SECURITY.md](SECURITY.md) | `src/services/firebase.ts`, `firestore.rules` |
| **Firebase Cloud Functions (v2, Node 22)** | Server-side logic, OAuth, wallet mutations | Active | [API-CONTRACTS.md](API-CONTRACTS.md), [DEPLOYMENT.md](DEPLOYMENT.md) | `functions/src/index.ts` |
| **Firebase Hosting** | Static SPA delivery, security headers | Active | [DEPLOYMENT.md](DEPLOYMENT.md) | `firebase.json` |
| **Firebase Secret Manager** | Backend secret storage (`defineSecret` pattern) | Active | [SECURITY.md](SECURITY.md), [ENVIRONMENT.md](ENVIRONMENT.md) | `functions/src/config/index.ts` |
| **Google Ads API (OAuth + Reporting)** | Connect ad account, fetch campaign/performance data for in-app reports (ADR-022) | Active | [OAUTH.md](OAUTH.md) | `functions/src/googleAdsOAuthV2.ts`, `src/services/oauthServices.ts` |
| **Meta Ads API (OAuth + Reporting)** | Connect ad account, fetch campaign/performance data for in-app reports (ADR-022) | Active | [OAUTH.md](OAUTH.md) | `functions/src/metaAdsOAuth.ts` |
| ~~**Looker Studio**~~ | Embedded report dashboards — **Removed** (Fase 0.5 cleanup, 2026-05-19); reports render in-app per **ADR-022** (Fase 3.5) | Removed | [Decisions.md § ADR-022](Decisions.md) | — |
| **Google Tag Manager** | Analytics + marketing pixels | Active | — | `src/lib/gtm.ts` |
| **SuitPay** | Payment provider (PIX) | **Removed** (ADR-021, 2026-05-18) — do not restore | [PAYMENTS.md](PAYMENTS.md) | — |
| **Stripe** | Payment provider (replacement for SuitPay, FUTURE §8) | Planned | [PAYMENTS.md](PAYMENTS.md), [research/08-stripe-future.md](research/08-stripe-future.md) | TBD |
| **GitHub Actions** | CI + auto-deploy | Active | [DEPLOYMENT.md](DEPLOYMENT.md), [ENVIRONMENT.md](ENVIRONMENT.md) | `.github/workflows/ci.yml`, `.github/workflows/deploy.yml` |

## Adding a new integration

1. Add a row to the table above.
2. If the integration involves any of the following, create or extend a dedicated doc:
   - **OAuth** → extend [OAUTH.md](OAUTH.md) with the new provider.
   - **New backend secret** → register via `defineSecret` in `functions/src/config/index.ts` and document in [SECURITY.md](SECURITY.md) and [ENVIRONMENT.md](ENVIRONMENT.md).
   - **New billable usage / quotas** → document quotas, free tier, alerting thresholds in the dedicated doc.
   - **Regulatory scope** (PII, payments, tax) → flag in the dedicated doc and link from [SECURITY.md](SECURITY.md).
3. If the integration introduces a new env var or GitHub secret, update [ENVIRONMENT.md](ENVIRONMENT.md).
4. Add a `## [YYYY-MM-DD]` entry to [CHANGES.md](CHANGES.md) noting the integration was added.

## Authentication overview

| Provider | Auth method | Token storage | Refresh strategy |
|---|---|---|---|
| Google Ads | OAuth 2.0 | Firestore `users/{uid}/oauth/googleAds` (refresh token only; access token re-fetched per call) | On 401 from Ads API, refresh via stored refresh_token |
| Meta Ads | OAuth 2.0 (long-lived user token) | Firestore `users/{uid}/oauth/metaAds` | Long-lived tokens (~60d); user re-auths on expiry |
| Firebase Auth | Email/password (no reCAPTCHA, removed 2026-05-17 — `useRateLimit` 5/15min + Firebase Auth heuristics cover abuse) | Firebase SDK manages session; Auth state via `AuthContext` | Auto-refresh by Firebase SDK |

See [OAUTH.md](OAUTH.md) for the detailed flow per provider, including state validation, error codes, and rate-limit policy.

## Secrets convention

All backend secrets MUST go through `defineSecret` (`firebase-functions/v2`) and be consolidated in `functions/src/config/index.ts`. Never read `process.env.XXX_SECRET` directly. See [SECURITY.md](SECURITY.md) for the rationale.

## Cross-references

- [SECURITY.md](SECURITY.md) — secrets, rules, admin guard.
- [ENVIRONMENT.md](ENVIRONMENT.md) — env vars per environment + GitHub Actions secrets.
- [API-CONTRACTS.md](API-CONTRACTS.md) — function-level contracts for OAuth callables.
- [PAYMENTS.md](PAYMENTS.md) — payment-specific integration detail.
