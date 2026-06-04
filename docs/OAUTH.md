# OAuth Integration

AdSmart uses a two-step account-selection flow for both Google Ads and Meta Ads. 
The OAuth token payloads are encrypted at rest using AES-256-GCM.

## Google Ads Flow

### Prerequisites

- `googleAdsClientId` — `defineString` in `functions/src/config/index.ts` (consumed via `.value()`; non-secret, has a baked-in default for the project's OAuth app).
- `googleAdsClientSecret` — `defineSecret` in `functions/src/config/index.ts`.
- `googleAdsDeveloperToken` — `defineSecret`.
- `encryptionKey` — `defineSecret`, bound on every callable that writes/reads OAuth tokens (ADR-019).
- OAuth redirect URIs (`googleAdsRedirectUri`, `googleAdsRedirectUriDev`) — also `defineString`. Registered in Google Cloud Console:
  - Production: `https://adsmart.app/auth/google-ads/callback`
  - Development: `http://localhost:5173/auth/google-ads/callback`

### Step-by-step

1. **Client** calls `getGoogleAdsAuthUrl` which returns the Google OAuth URL with scopes:
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/adwords`

2. **Function** (`getGoogleAdsAuthUrl`) generates a `state` UUID, stores it in `oauth_states/{state}` with a 10-minute expiry and `isLocalEnv` flag, and returns the URL.

3. **User** approves on Google's consent screen. Google redirects to `/auth/google-ads/callback?code=...&state=...`.

4. **Client** (`OAuthCallbackPage`) reads the code and state, and calls `handleGoogleAdsCallback({ code, state })`.

5. **Function** (`handleGoogleAdsCallback`):
   - Validates state exists in `oauth_states` and belongs to the calling user (CSRF check).
   - Deletes the used state document.
   - Determines redirect URI from `stateData.isLocalEnv`.
   - POSTs to `https://oauth2.googleapis.com/token` to exchange code for tokens.
   - Calls Google Ads API `customers:listAccessibleCustomers` → filters out test and manager accounts.
   - Stores access + refresh tokens in `temporary_oauth_tokens/{id}` (30-min TTL).
   - Returns account list + `temporaryToken` to client.

6. **Client** shows account selection UI. User selects accounts and calls `confirmGoogleAdsAccountSelection({ temporaryToken, selectedAccountIds })`.

7. **Function** (`confirmGoogleAdsAccountSelection`):
   - Validates temporary token belongs to caller and is not expired.
   - Fetches full account details.
   - Encrypts access + refresh tokens with `encryptString` from `functions/src/lib/oauthCrypto.ts`.
   - Batch-writes to Firestore:
     - `users/{uid}/oauth_tokens/google_ads`
     - `users/{uid}/adAccounts/google_ads_{customerId}`
   - Deletes `temporary_oauth_tokens/{id}`.
   - Returns `{ success: true, accountsConnected: N }`.

### Error handling

`handleGoogleAdsCallback` preserves semantic `HttpsError` codes thrown inside the try block (CSRF check, expiry, etc.) by re-throwing `instanceof HttpsError` before the generic error logger. This ensures the client can distinguish CSRF failures (`invalid-argument`, `permission-denied`, `deadline-exceeded`) from true server errors (`internal`).

### Token storage

Tokens at rest are encrypted with AES-256-GCM via `functions/src/lib/oauthCrypto.ts` (ADR-019). The envelope is `{ v: 1, iv, tag, ct }`. Key derivation uses `scryptSync` with the `ENCRYPTION_KEY` secret.

---

## Meta Ads Flow

### Prerequisites

- `metaAdsAppId` — `defineString` in `functions/src/config/index.ts`.
- `metaAdsAppSecret` — `defineSecret`.
- `encryptionKey` — `defineSecret`.
- `metaAdsRedirectUri` / `metaAdsRedirectUriDev` — `defineString`. Registered in Meta App Dashboard:
  - Production: `https://adsmart.app/auth/meta-ads/callback`
  - Development: `https://adsmart-web-dev.web.app/auth/meta-ads/callback` (Meta's Enforce HTTPS and Strict Mode rules reject `http://localhost`, so the Firebase Hosting URL must be used for dev)

### Step-by-step

Mirrors the Google Ads flow with these differences:

- Meta uses a short-lived token → long-lived token exchange (no refresh token; Meta tokens last ~60 days).
- Step 5 calls `https://graph.facebook.com/v19.0/oauth/access_token` for token exchange, then `https://graph.facebook.com/v18.0/me/adaccounts` to list Business ad accounts.
- `temporary_oauth_tokens` for Meta stores `tokenType` and no `refreshToken`.
- Step 7 stores `users/{uid}/oauth_tokens/meta_ads` and `users/{uid}/adAccounts/meta_ads_{accountId}`.

### CSRF state

Same pattern as Google: `oauth_states/{stateId}` with `userId`, `expiresAt` (10 min), `isLocalEnv`.

---

## Client-side OAuth service

`src/services/oauthServices.ts` wraps the callable function calls. Use these wrappers rather than calling `httpsCallable` directly in components.
