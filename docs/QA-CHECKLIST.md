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

## Authentication

- [ ] Sign in with Google works
- [ ] Sign in with Facebook works
- [ ] Sign in with email/password works (no reCAPTCHA — removed 2026-05-17, see [Decisions.md ADR-013](Decisions.md#adr-013-drop-google-recaptcha-from-authentication))
- [ ] `useRateLimit` blocks after 5 failed attempts in a 15-minute window
- [ ] After sign-out, all protected routes redirect to `/login`
- [ ] Admin user (`agency.elovisiondigital@gmail.com`) sees admin panel at `/admin`
- [ ] Non-admin user is redirected from `/admin` to `/dashboard`

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
- [ ] Report success page shows Looker Studio link

## Payments (SuitPay — deprecated but must not break)

- [ ] PIX QR code modal opens
- [ ] `checkPaymentStatus` returns without 500 error

## Admin panel

Routes (post-Subprojeto 2): `/admin` → `/admin/dashboard` (default redirect), `/admin/security`, `/admin/prices`, `/admin/wallet`. Single `AdminRoute` guard at the parent. The `AdminDashboardPage` is `React.lazy`-loaded so recharts + d3 transitive deps don't bloat first paint of the rest of the app.

- [ ] `/admin` redirects to `/admin/dashboard`
- [ ] Sub-nav has four tabs in order: Dashboard, Logs de Segurança, Configuração de Preços, Gestão de Saldo
- [ ] Active tab matches the URL (clicking tabs updates URL; pasting a sub-route URL highlights the right tab)
- [ ] Refreshing on `/admin/security`, `/admin/prices`, or `/admin/wallet` stays on that route (does not redirect to `/admin/dashboard`)
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

### Security tab

- [ ] Loads stats from `getSecurityStats` without console errors

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
