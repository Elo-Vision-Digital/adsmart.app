# Environment

## Frontend env vars (VITE_*)

Defined in `.env` (not committed). Template in `.env.example`.

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain (`projectId.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Web app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | Google Analytics measurement ID (GTM-PDHQTJP8 is the GTM container) |
| `VITE_FIREBASE_FUNCTIONS_URL` | No | Override for functions URL (default: `https://us-central1-{projectId}.cloudfunctions.net`) |
| `VITE_USE_FIREBASE_EMULATOR` | No | Set to `"true"` to connect to local emulators. Only active in `DEV` mode on `localhost`. |
| `VITE_RECAPTCHA_SITE_KEY` | Yes | reCAPTCHA v3 site key (public) |

All values come from Firebase Console → Project settings → Your apps → Web app config.

## Backend env vars (functions runtime)

These are plain environment variables accessible as `process.env.XXX` in functions.

| Variable | Set via | Description |
|---|---|---|
| `GOOGLE_ADS_CLIENT_ID` | `.env` / Firebase Functions config | Google OAuth client ID |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | `.env` / Firebase Functions config | Google Ads API developer token |
| `META_ADS_APP_ID` | `.env` / Firebase Functions config | Meta App ID (public part) |
| `GOOGLE_ADS_TEST_MODE` | Local only | Set to `"true"` to return mock Google Ads accounts |

## Secrets (Secret Manager via defineSecret)

Secrets are managed by Firebase Secret Manager. They are **not** in `.env`.

| Secret name | `defineSecret` handle | Used in |
|---|---|---|
| `googleAdsClientSecret` | `googleAdsClientSecret` | `googleAdsOAuth.ts`, `googleAdsOAuthV2.ts` |
| `metaAdsAppSecret` | `metaAdsAppSecret` | `metaAdsOAuth.ts`, `metaAdsOAuthV2.ts` |
| `recaptchaSecretKey` | `recaptchaSecretKey` | `recaptcha.ts` |

To set/rotate a secret:
```bash
firebase functions:secrets:set googleAdsClientSecret
# prompted for value
```

Functions declare which secrets they use in the `onCall` options:
```typescript
onCall({ secrets: [googleAdsClientSecret] }, async (request) => { ... })
```

The secret value is read at runtime via `.value()`:
```typescript
const secret = googleAdsClientSecret.value()
```

**Never** read secrets via `process.env.XXX_SECRET` in functions.

## Emulators

Run all emulators locally with:
```bash
firebase emulators:start
```

| Emulator | Port |
|---|---|
| Firebase Auth | 9099 |
| Cloud Functions | 5001 |
| Firestore | 8080 |
| Firebase Hosting | 5002 |
| Emulator UI | 4000 |

The frontend auto-connects to emulators when all three conditions are true:
1. `import.meta.env.DEV` is true (Vite dev server)
2. `window.location.hostname === 'localhost'`
3. `VITE_USE_FIREBASE_EMULATOR === 'true'`

Functions tests (`functions/test/`) always connect to the emulators via `@firebase/rules-unit-testing` (Firestore) and direct Admin SDK (Auth). Set the `FIRESTORE_EMULATOR_HOST` env var or use the test helpers in `functions/test/helpers/firestore.ts`.

## Environments

| Name | Firebase project | Frontend URL |
|---|---|---|
| Production | `adsmart-web` | `https://adsmart.app` |
| Development | Local emulators | `http://localhost:5173` |

There is no staging environment currently. All testing is done locally with emulators.

## Deployment prerequisites

Before deploying to production:

1. All secrets set in Secret Manager (see above).
2. `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `META_ADS_APP_ID` set as Firebase Functions configuration or runtime env.
3. OAuth redirect URIs registered for production domain.
4. reCAPTCHA domain allowlist includes `adsmart.app`.

See `docs/DEPLOYMENT.md` for the full deploy checklist.
