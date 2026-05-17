# OAuth Integration

Google Ads V2 and Meta Ads V2 use a two-step account-selection flow. V1 functions are deprecated.

## Google Ads V2 flow

### Prerequisites

- `GOOGLE_ADS_CLIENT_ID` (env var in `.env` and as `process.env` in functions)
- `googleAdsClientSecret` (Secret Manager via `defineSecret`)
- `GOOGLE_ADS_DEVELOPER_TOKEN` (env var in functions)
- OAuth redirect URIs registered in Google Cloud Console:
  - Production: `https://adsmart.app/auth/google-ads/callback`
  - Development: `http://localhost:5173/auth/google-ads/callback`

### Step-by-step

1. **Client** calls `getGoogleAdsAuthUrl` (V1 — still used for URL generation) or builds the auth URL manually with scopes:
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/adwords`

2. **Function** (`getGoogleAdsAuthUrl`) generates a `state` UUID, stores it in `oauth_states/{state}` with a 10-minute expiry and `isLocalEnv` flag, returns the Google OAuth URL to the client.

3. **User** approves on Google's consent screen. Google redirects to `/auth/google-ads/callback?code=...&state=...`.

4. **Client** (`OAuthCallbackPage`) reads the code and state from the URL, calls `handleGoogleAdsCallbackWithSelection({ code, state })`.

5. **Function** (`handleGoogleAdsCallbackWithSelection`):
   - Validates state exists in `oauth_states` and belongs to the calling user (CSRF check).
   - Validates state has not expired.
   - Deletes the used state document.
   - Determines redirect URI from `stateData.isLocalEnv` (not from the runtime environment, to match what was registered during URL generation).
   - POSTs to `https://oauth2.googleapis.com/token` to exchange code for tokens.
   - GETs `https://www.googleapis.com/oauth2/v2/userinfo` for display info.
   - Calls Google Ads API v17 `customers:listAccessibleCustomers` → filters out test and manager accounts.
   - Stores access + refresh tokens in `temporary_oauth_tokens/{id}` (30-min TTL).
   - Returns account list + `temporaryToken` to client.

6. **Client** shows account selection UI. User selects one or more accounts. Client calls `confirmGoogleAdsAccountSelection({ temporaryToken, selectedAccountIds })`.

7. **Function** (`confirmGoogleAdsAccountSelection`):
   - Validates temporary token belongs to caller and is not expired.
   - Fetches full account details from Google Ads API for each selected account.
   - Base64-encodes tokens (⚠ not real encryption — TODO for a future phase).
   - Batch-writes to Firestore:
     - `users/{uid}/oauth_tokens/google_ads` — encoded tokens
     - `users/{uid}/adAccounts/google_ads_{customerId}` — one doc per account
   - Deletes `temporary_oauth_tokens/{id}`.
   - Returns `{ success: true, accountsConnected: N }`.

### Error handling

`handleGoogleAdsCallbackWithSelection` preserves semantic `HttpsError` codes thrown inside the try block (CSRF check, expiry, etc.) by re-throwing `instanceof HttpsError` before the generic error logger. This ensures the client can distinguish CSRF failures (`invalid-argument`, `permission-denied`, `deadline-exceeded`) from true server errors (`internal`).

### Token storage note

Tokens are stored base64-encoded, not encrypted. A real encryption step using `crypto` is stubbed in `encryptTokens()` in `googleAdsOAuthV2.ts`. This is a known gap to address before Phase 2.

---

## Meta Ads V2 flow

### Prerequisites

- `META_ADS_APP_ID` (env var)
- `metaAdsAppSecret` (Secret Manager via `defineSecret`)
- OAuth redirect URIs in Meta App Dashboard:
  - Production: `https://adsmart.app/auth/meta-ads/callback`
  - Development: `http://localhost:5173/auth/meta-ads/callback`

### Step-by-step

Mirrors the Google Ads V2 flow with these differences:

- Meta uses a short-lived token → long-lived token exchange (no refresh token; Meta tokens last ~60 days).
- Step 5 calls `https://graph.facebook.com/v19.0/oauth/access_token` for token exchange, then `https://graph.facebook.com/v18.0/me/adaccounts` to list Business ad accounts.
- `temporary_oauth_tokens` for Meta stores `tokenType` and no `refreshToken`.
- Step 7 stores `users/{uid}/oauth_tokens/meta_ads` and `users/{uid}/adAccounts/meta_ads_{accountId}`.

### CSRF state

Same pattern as Google: `oauth_states/{stateId}` with `userId`, `expiresAt` (10 min), `isLocalEnv`.

---

## V1 functions (deprecated)

`googleAdsOAuth.ts` and `metaAdsOAuth.ts` export:
- `getGoogleAdsAuthUrl` / `getMetaAdsAuthUrl` — still called by the client to generate the auth URL
- `getGoogleAdsCampaigns` / `getMetaAdsCampaigns` — campaign list helpers
- `handleGoogleAdsCallback_DEPRECATED` / `handleMetaAdsCallback_DEPRECATED` — NOT exported (commented out in `index.ts`)

The V1 callback handlers are intentionally not exported. The auth URL generators are kept because they still perform the `oauth_states` creation step that V2 depends on.

---

## Client-side OAuth service

`src/services/oauthServices.ts` wraps the callable function calls. Use these wrappers rather than calling `httpsCallable` directly in components.
