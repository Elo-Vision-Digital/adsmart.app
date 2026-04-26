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
- [ ] Sign in with email/password works
- [ ] reCAPTCHA challenge appears on email sign-in
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

Routes (post-Subprojeto 1 IA refactor): `/admin` → `/admin/security` (default redirect), `/admin/prices`, `/admin/wallet`. Single `AdminRoute` guard at the parent.

- [ ] `/admin` redirects to `/admin/security`
- [ ] Sub-nav has three tabs: Logs de Segurança, Configuração de Preços, Gestão de Saldo
- [ ] Active tab matches the URL (clicking tabs updates URL; pasting a sub-route URL highlights the right tab)
- [ ] Refreshing on `/admin/prices` or `/admin/wallet` stays on that route (does not redirect to `/admin/security`)
- [ ] Non-admin cannot access `/admin/security`, `/admin/prices`, or `/admin/wallet` (each redirects to `/dashboard`)
- [ ] Security tab loads stats from `getSecurityStats` without console errors
- [ ] Prices tab loads from `getProductPrices` and shows the 4 default products
- [ ] Saving prices calls `updateProductPrices` and shows the success message
- [ ] Wallet tab: admin can add credits to a user by email
- [ ] Amount validation: > 0, ≤ R$ 1.000
- [ ] Reason validation: ≥ 10 characters
- [ ] Switching language re-renders the admin panel labels (no raw `admin.*` keys visible)

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
