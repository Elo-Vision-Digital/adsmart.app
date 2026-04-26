# AdSmart

SaaS platform for advertising management dashboards. Connects Google Ads and Meta Ads accounts, generates Looker Studio report links, and manages user wallet balance for pay-per-report billing.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 (CSS variable tokens) + shadcn/ui |
| Routing | react-router-dom v6 |
| Auth / DB | Firebase (Auth + Firestore) |
| Functions | Firebase Cloud Functions v2 (Node 22) |
| Schemas | Zod 4 (single source of truth in `@adsmart/shared` workspace package) |
| Tooling | Bun 1.3.10 (package manager + runtime), Turborepo 2.x (task pipeline), Biome (lint+format), lefthook (git hooks), Vitest |

## Prerequisites

- Bun 1.3.10 or higher: `curl -fsSL https://bun.sh/install | bash`
- Node 22 (Functions runtime — installed via Bun for build, used by Firebase CLI for deploy)
- Firebase CLI is invoked via `bunx firebase-tools` (no global install required)
- Java 11+ (for Firebase emulators)

## Setup

```bash
# Install all workspace deps (root + functions + packages/shared)
bun install

# Copy env template — pre-filled with adsmart-web-dev defaults
cp .env.example .env
# Fill the empty VITE_* values from Firebase console → adsmart-web-dev → Project settings → Your apps
# For Cloud Functions (OAuth, reCAPTCHA), backend secrets are managed via
# Firebase Secret Manager — see docs/ENVIRONMENT.md
```

## Environment variables

Two environments, controlled by Vite mode:

- `.env` (gitignored) — DEV config, loaded by `bun run dev`. Connects to `adsmart-web-dev`.
- `.env.production` (committed; values are public Firebase web config) — loaded by `bun run build`. Connects to `adsmart-web`.

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for full reference. Minimum for local dev (in `.env`):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=adsmart-web-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=adsmart-web-dev
VITE_FIREBASE_STORAGE_BUCKET=adsmart-web-dev.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_RECAPTCHA_SITE_KEY=...

# Optional — set to "true" to use local Firebase emulators instead of adsmart-web-dev
# VITE_USE_FIREBASE_EMULATOR=true
```

## Scripts

### Frontend (root)

| Command | Action |
|---|---|
| `bun run dev` | Start Vite dev server (port 5173) — connects to `adsmart-web-dev` |
| `bun run build` | TypeScript compile + Vite build (uses `.env.production` → `adsmart-web`) |
| `bun run build:all` | Build all workspaces via Turbo (web + functions) |
| `bun run lint` | Biome check (all files) |
| `bun run lint:fix` | Biome lint + format auto-fix (write mode) |
| `bun run format` | Biome format only (write mode) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Vitest run (web suites) |
| `bun run test:all` | Run all tests across workspaces (via Turbo) |
| `bun run test:watch` | Vitest watch mode |
| `bun run test:coverage` | Coverage report |

### Functions (`cd functions`)

| Command | Action |
|---|---|
| `bun run build` | `tsc` compile to `lib/` |
| `bun run build:watch` | TypeScript watch mode (incremental compile) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | ESLint (non-blocking until Phase 2 ESLint 8 → 9 migration) |
| `bun run test` | Vitest run |
| `bun run test:coverage` | Coverage report |
| `bun run serve` | Build + start functions emulator only |
| `bun run deploy` | `firebase deploy --only functions` |

## Local development with emulators

```bash
# Terminal 1 — start all emulators
bunx firebase-tools emulators:start

# Terminal 2 — start frontend
bun run dev
```

Emulator ports: Auth 9099, Firestore 8080, Functions 5001, Hosting 5002, UI 4000.

Set `VITE_USE_FIREBASE_EMULATOR=true` in `.env` to connect the frontend to the emulators instead of `adsmart-web-dev`.

## Deployment

Auto-deploy via GitHub Actions:

| Branch | Firebase project | URL |
|---|---|---|
| `develop` | `adsmart-web-dev` | `https://adsmart-web-dev.web.app` |
| `main` | `adsmart-web` | `https://adsmart.app` |

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full deploy flow, manual deploys, and rollback.

## Architecture overview

- **Frontend** (SPA): React app served via Firebase Hosting. Communicates with Firestore directly for reads and calls Cloud Functions for writes that require server-side logic (wallet, OAuth, reCAPTCHA).
- **Cloud Functions**: All sensitive operations live here — OAuth token exchange, wallet mutations, admin actions, rate limiting, security logging.
- **Firestore**: Single database. Security rules enforce ownership and prevent client writes to sensitive subcollections (`wallet`, `transactions`, `rateLimits`).

See [AGENTS.md](AGENTS.md) for the full agent-oriented overview.
