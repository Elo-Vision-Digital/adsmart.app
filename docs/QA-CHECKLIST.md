# QA Checklist — Pre-production deploy

Run this checklist before every production deploy. Check each item manually unless automated.

## Build and CI

- [ ] `bun run build` exits 0 (TypeScript + Vite)
- [ ] `cd functions && bun run build` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0 (Biome — no errors, only warnings acceptable)
- [ ] `bun run test` — all web tests pass
- [ ] `cd functions && bun run test` — all functions tests pass (emulators required)
- [ ] GitHub Actions CI is green on the deploy branch

## Authentication (post-ADR-020)

### Sign-in / sign-up

- [ ] Sign in with Google works — popup opens, `prompt: 'select_account'` forces account picker even with one logged-in Google account, redirect to `/dashboard` on success
- [ ] Sign in with Facebook works — popup opens, requests `email` + `public_profile` scopes, `users/{uid}.email` is populated after first signup (no `email: ''`)
- [ ] Sign in with email/password works (no reCAPTCHA — removed 2026-05-17, see [Decisions.md ADR-013](Decisions.md#adr-013-drop-google-recaptcha-from-authentication))
- [ ] Signup enforces shared password policy: 8 chars min + uppercase + lowercase + number + special. Try `weak` → expect 4 separate rules listed in pt-BR.
- [ ] Sign-up with already-used email shows "Já existe uma conta com este email" (loginPage.error.emailInUse)
- [ ] Sign-in with wrong password shows the generic "Credenciais inválidas" message (collapsed with `user-not-found` and `invalid-credential` — privacy)
- [ ] `useRateLimit` blocks after 5 failed attempts in a 15-minute window (client-side guard — Firebase Auth has its own server throttle as defense-in-depth)
- [ ] After sign-out, all protected routes redirect to `/login` (via `<Navigate replace>` — no `/login` accumulating in history)

### Route guards + loading

- [ ] On cold load, route guards (`PrivateRoute`, `AdminRoute`) render `<AuthLoadingFallback />` (centered spinner with `aria-label="Carregando"`) until `onAuthStateChanged` resolves. No white screen flash, no flicker redirect.
- [ ] Admin user (`agency.elovisiondigital@gmail.com` OR any user with custom claim `admin: true`) sees admin panel at `/admin`
- [ ] Non-admin user is redirected from `/admin` to `/dashboard`
- [ ] After `setCustomUserClaims(uid, { admin: true })`, the next sign-in picks up admin without requiring a manual sign-out/sign-in cycle (force-refresh via `AuthContext.refreshAuthState`)

### Forgot password (`/forgot-password`)

- [ ] Page renders with title "Esqueceu sua senha?"
- [ ] Submitting a valid email shows "Email enviado. Se sua conta existir, você receberá o link em breve."
- [ ] Submitting a NON-EXISTENT email ALSO shows the same success message (privacy collapse — no enumeration)
- [ ] Rate limit kicks in after 5 submissions in 15 min
- [ ] "Voltar ao login" link works

### Email verification

- [ ] `EmailVerificationBanner` (yellow strip on top of `<main>`) appears when `hasPasswordProvider && !user.emailVerified`
- [ ] Banner has "Reenviar" button → click triggers `sendEmailVerification`; success message replaces the banner text
- [ ] Banner does NOT appear for OAuth-only users (Google / Facebook without password provider)
- [ ] After clicking the verification link in the email AND reloading the app, the banner disappears

### Password change (`/settings`)

- [ ] Password field placeholder shows "Mín. 8 chars + maiúscula, número e especial" (not "Mínimo 6 caracteres" — was a stale i18n key fixed in commit `f0fc264`)
- [ ] Trying to set a weak new password (e.g. `weak`) shows the policy violations from the shared `validatePassword` — not "Erro ao processar solicitação"
- [ ] Setting a strong new password with the correct current password succeeds; `auth/wrong-password` shows "Credenciais inválidas" (privacy-collapsed message, matching LoginPage)

### Account deletion (`/privacy/delete-data`)

- [ ] "Excluir minha conta permanentemente" button is **disabled** until the user types their own email exactly (case-insensitive)
- [ ] On click: backend cascade-deletes 5 subcollections + `userDocuments/{normalizedDocId}` if present + Auth user; client signs out and redirects to `/login`
- [ ] Cloud Logging shows a `securityLogs/{id}` entry with `eventType: USER_DELETION`, `severity: INFO`, and `subcollectionCounts`
- [ ] Rate limit: a second `deleteUserData` call within 1h is rejected with `HttpsError('resource-exhausted')`

## Dashboard

- [ ] Wallet balance displays correctly (R$ format)
- [ ] Ad accounts list loads (Google Ads and Meta Ads)
- [ ] Empty state shown if no accounts connected

## OAuth connections

- [ ] Google Ads OAuth: "Connect" opens Google consent screen
- [ ] Google Ads OAuth: callback page processes without error
- [ ] Google Ads OAuth: account selection modal appears
- [ ] Google Ads OAuth: selecting and confirming accounts saves them
- [ ] Meta Ads OAuth: same flow as Google Ads
- [ ] OAuth error cases: expired state shows appropriate error message

## Reports

- [ ] Report templates load on `/templates`
- [ ] Generating a report deducts balance
- [ ] Report success page shows status + placeholder for in-app render (full visualization ships in Fase 3.9 REF-9 per ADR-022)

## Payments (SuitPay — deprecated but must not break)

- [ ] PIX QR code modal opens
- [ ] `checkPaymentStatus` returns without 500 error

## Admin panel

Routes (post-Subprojeto 2 + ADR-014 Security Logs removal): `/admin` → `/admin/dashboard` (default redirect), `/admin/prices`, `/admin/wallet`. Single `AdminRoute` guard at the parent. The `AdminDashboardPage` is `React.lazy`-loaded so recharts + d3 transitive deps don't bloat first paint of the rest of the app.

- [ ] `/admin` redirects to `/admin/dashboard`
- [ ] Sub-nav has three tabs in order: Dashboard, Configuração de Preços, Gestão de Saldo
- [ ] Active tab matches the URL (clicking tabs updates URL; pasting a sub-route URL highlights the right tab)
- [ ] Refreshing on `/admin/prices` or `/admin/wallet` stays on that route (does not redirect to `/admin/dashboard`)
- [ ] Navigating to `/admin/security` (legacy URL) resolves to `/admin/dashboard` via the admin block's `<Route path="*" element={<Navigate to="dashboard" replace />}>` catch-all — no 404, no white screen, no "No routes matched" console warning
- [ ] Non-admin cannot access any `/admin/*` route (each redirects to `/dashboard`)
- [ ] Switching language re-renders the admin panel labels (no raw `admin.*` keys visible)

### Dashboard tab (`/admin/dashboard`)

- [ ] Page loads with default range `30d` (from `getDateRangeFromPreset('30d')`)
- [ ] Three cards render in a 1/2/3-col responsive grid: Receita, Usuários, Integrações
- [ ] Skeleton (`DashboardSkeleton`) shows briefly on first mount (no layout shift when data arrives)
- [ ] Preset buttons (`today | 7d | 30d | 60d | 90d | 180d | 365d`) trigger refetch and render new totals
- [ ] Custom range dialog: opening, picking a 2-sided range, confirming triggers a refetch
- [ ] Range > 365 days surfaces "Período não pode exceder 365 dias" inline (client-side guard) AND server rejects with `invalid-argument` (defense-in-depth via `GetDashboardMetricsInputSchema.refine`)
- [ ] Revenue card: `realCents` + `creditsCents` formatted as `R$ X,XX` (Intl.NumberFormat pt-BR); sparkline plots only `realCents` over day buckets
- [ ] Users card: `newCount` / `activeCount` / `totalCount` integers; sparkline plots `newCount`
- [ ] Integrations card: vertical list `{platform → distinctUserCount}` with horizontal bars; empty-state copy when `byPlatform.length === 0`
- [ ] Force-error path (e.g., disconnect network mid-fetch): red-bordered banner with retry button; clicking retry re-invokes the callable
- [ ] Console clean of `error|fail|dashboard|Q[1-7]|FAILED_PRECONDITION|HttpsError|internal` while the dashboard is open

### Prices tab

- [ ] Loads from `getProductPrices` and shows the 4 default products
- [ ] Saving prices calls `updateProductPrices` and shows the success message

### Wallet tab

- [ ] Admin can add credits to a user by email
- [ ] Amount validation: > 0, ≤ R$ 1.000
- [ ] Reason validation: ≥ 10 characters

## Settings

- [ ] Language switcher cycles through pt / en / es
- [ ] Theme toggle switches dark/light
- [ ] Account deletion request works (or shows appropriate state)

## Security headers (use browser DevTools → Network → response headers)

- [ ] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- [ ] `Content-Security-Policy` header present and contains `default-src 'self'`
- [ ] `Cross-Origin-Opener-Policy: same-origin`
- [ ] `Cross-Origin-Resource-Policy: same-origin`
- [ ] No `X-XSS-Protection` header

## Performance (optional but recommended)

- [ ] Lighthouse performance score ≥ 80 on `/` (cold load)
- [ ] No 404s for static assets in Network tab
- [ ] No console errors on any authenticated page

## i18n

- [ ] All visible UI text appears in Portuguese when language = `pt`
- [ ] Switching to English changes visible text
- [ ] No raw translation keys (e.g., `nav.dashboard`) appear in the UI
