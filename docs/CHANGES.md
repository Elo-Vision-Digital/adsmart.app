# Changes

Append-only log of significant changes. Most recent at the top. Each entry uses the parseable header `## [YYYY-MM-DD] — Title` for tooling/lint.

Format conventions:
- One section per logical change set (a phase, a migration, an incident, a major decision).
- Use bullet points for individual changes; group by area when long (Frontend / Functions / Rules / Docs).
- Reference commit SHAs or PR numbers when relevant.
- Do NOT edit past entries. If a past claim is wrong, add a new dated entry that supersedes it (and link back).

---

## [2026-04-25] — Phase 5: Bun + Turborepo + multi-environment + auto-deploy

- **Package manager:** npm → Bun 1.3.10. `bunfig.toml` pins `linker = "isolated"` (required for Firebase Functions deploy compat — symlinked deps would break the deploy zip).
- **Workspaces:** Bun-native workspaces, root `@adsmart/web` + `functions/` `@adsmart/functions`.
- **Lockfile:** `package-lock.json` removed (root + functions); `bun.lock` committed.
- **Turborepo 2.x:** added `turbo.json` with `build / lint / typecheck / test / clean / dev` pipeline. CI uses Turbo cache.
- **Two Firebase projects:** `.firebaserc` default flipped to `adsmart-web-dev`; `adsmart-web` is production-only (CI explicit).
- **Auto-deploy:** new `.github/workflows/deploy.yml` — push to `develop` deploys to `adsmart-web-dev`, push to `main` deploys to `adsmart-web`.
- **CI:** rewrote `.github/workflows/ci.yml` for Bun + Turbo + adds `develop` to triggers.
- **Hooks:** `lefthook.yml` migrated `npx → bunx`, `npm run → bun run`.
- **Docs:** updated CLAUDE.md, README.md, docs/ENVIRONMENT.md, docs/DEPLOYMENT.md to reflect Bun.
- **New direct deps required by isolated linker:** `@radix-ui/react-slot` (button.tsx), `@types/node` (vite/vitest config + NodeJS types).
- **Known follow-up (Phase 2 scope):** Functions ESLint 8 still scans `functions/coverage/` artifacts — currently bypassed via `continue-on-error: true`.

---

## [2026-04-24] — Phase 3: Security hardening

- **Firestore rules:** Blocked client writes to `users/.../wallet`, `users/.../transactions`, and `rateLimits`. Wildcard subcollection rule tightened to require named `{subcollection}` segment.
- **Security headers:** Added `Strict-Transport-Security` (HSTS), `Content-Security-Policy` (CSP), `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`. Removed `X-XSS-Protection`.
- **CSP:** GTM boot script moved from `index.html` inline to `src/lib/gtm.ts` module; GTM/GA domains added to `script-src` and `connect-src`.
- **Secrets:** Migrated `recaptcha.ts`, `googleAdsOAuth*.ts`, `metaAdsOAuth*.ts` from `process.env` to `defineSecret` / Secret Manager.
- **Admin guard:** Added `AdminRoute` component; `/admin` route now requires `token.admin === true || ADMIN_EMAILS.includes(email)`.
- **Auth claims:** `AuthContext.isAdmin` now checks Firebase custom claim `token.admin` via `getIdTokenResult()`, with email allowlist as fallback.
- **securityLogger:** Added re-entrancy guard; `logEvent` no longer calls `checkSuspiciousPatterns` for `SUSPICIOUS_ACTIVITY` events (prevents infinite recursion).
- **OAuth error codes:** `handleGoogleAdsCallbackWithSelection` and `handleMetaAdsCallbackWithSelection` now re-throw `instanceof HttpsError` instead of wrapping them as `internal`.
- **SuitPay:** Marked `@deprecated`, webhook log payload reduced to non-sensitive headers.
- Added `docs/SECURITY.md`.
- Test counts: 44 functions / 31 web (all passing).

---

## [2026-04-24] — Phase 1: Cleanup and foundation

- Removed `.backups/` directory and 8 committed `.env` files.
- Removed `src/pages/_deleted/`, `src/test-translations.ts.bak`.
- Removed `firebase-admin` from root `package.json`.
- Fixed `tsconfig.json`: removed `functions/src/rateLimiter.ts` from frontend include.
- Standardized env var: `VITE_USE_EMULATORS` → `VITE_USE_FIREBASE_EMULATOR`.
- Refactored `LanguageContext.tsx` (1489 lines) into JSON locale files (`src/locales/`).
- Added Biome (frontend lint+format), lefthook (pre-commit + pre-push hooks), GitHub Actions CI.
- Added Vitest with test suites for: Firestore rules, rate limiter, admin wallet manager, Google Ads OAuth V2, Meta Ads OAuth V2, admin guard.
- Initial test count: 28 web / 39+2 skipped functions (skipped tests documented real security bugs, fixed in Phase 3).
