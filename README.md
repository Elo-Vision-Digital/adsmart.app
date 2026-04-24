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
| Tooling | Biome (lint+format), lefthook (git hooks), Vitest |

## Prerequisites

- Node 22
- Firebase CLI: `npm install -g firebase-tools`
- Java 11+ (for Firebase emulators)

## Setup

```bash
# Clone and install root deps
npm install

# Install functions deps
cd functions && npm install && cd ..

# Copy env template
cp .env.example .env
# Fill VITE_* values from Firebase console → Project settings → Your apps → Web app
```

## Environment variables

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for full reference. Minimum for local dev:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_USE_FIREBASE_EMULATOR=true
VITE_RECAPTCHA_SITE_KEY=...
```

## Scripts

### Frontend (root)

| Command | Action |
|---|---|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | TypeScript compile + Vite build |
| `npm run lint` | Biome check (all files) |
| `npm run lint:fix` | Biome check with auto-fix |
| `npm run format` | Biome format (write) |
| `npm run type-check` | `tsc --noEmit` |
| `npm test` | Vitest run (all suites) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Coverage report |

### Functions (`cd functions`)

| Command | Action |
|---|---|
| `npm run build` | `tsc` compile to `lib/` |
| `npm run build:watch` | Incremental watch |
| `npm run lint` | ESLint (non-blocking until Phase 2) |
| `npm test` | Vitest run |
| `npm run serve` | Build + start functions emulator only |
| `npm run deploy` | `firebase deploy --only functions` |

## Local development with emulators

```bash
# Terminal 1 — start all emulators
firebase emulators:start

# Terminal 2 — start frontend
npm run dev
```

Emulator ports: Auth 9099, Firestore 8080, Functions 5001, Hosting 5002, UI 4000.

Set `VITE_USE_FIREBASE_EMULATOR=true` in `.env` to connect the frontend to the emulators.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Architecture overview

- **Frontend** (SPA): React app served via Firebase Hosting. Communicates with Firestore directly for reads and calls Cloud Functions for writes that require server-side logic (wallet, OAuth, reCAPTCHA).
- **Cloud Functions**: All sensitive operations live here — OAuth token exchange, wallet mutations, admin actions, rate limiting, security logging.
- **Firestore**: Single database. Security rules enforce ownership and prevent client writes to sensitive subcollections (`wallet`, `transactions`, `rateLimits`).

See [AGENTS.md](AGENTS.md) for the full agent-oriented overview.
