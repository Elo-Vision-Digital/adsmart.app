# Bun + Turborepo + Multi-Ambiente + Auto-Deploy Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate package manager from npm to Bun, add Turborepo task pipeline, add proper dev/prod environment isolation (two Firebase projects), and add GitHub Actions auto-deploy — `develop` branch → `adsmart-web-dev`, `main` branch → `adsmart-web`.

**Architecture:** The project has two packages (root = `@adsmart/web`, `functions/` = `@adsmart/functions`). Bun workspaces with isolated linker manages them. Turborepo orchestrates tasks with caching. Two Firebase projects enforce complete isolation: accounts/data created in dev never touch production. Vite's `.env` / `.env.production` mode system controls which Firebase project the frontend connects to.

**Tech Stack:** Bun 1.3.10, Turbo 2.x, `oven-sh/setup-bun@v2`, `bunx firebase-tools`, Vite env modes

**Critical: isolated linker.** Bun's default linker symlinks deps to root `node_modules/`. Firebase CLI zips `functions/node_modules/` for deployment — symlinks break this. `bunfig.toml` with `linker = "isolated"` ensures `functions/node_modules/` is a complete self-contained directory.

---

## Prerequisites — manual steps before executing tasks

These require human action in the Firebase Console and GitHub. Complete them before running the tasks.

### A. Create the `adsmart-web-dev` Firebase project

1. Open [console.firebase.google.com](https://console.firebase.google.com) → Add project → name it `adsmart-web-dev`
2. Enable **Authentication** → Sign-in method → Email/Password
3. Enable **Cloud Firestore** → Start in production mode (rules will be deployed in Task 12)
4. Enable **Cloud Functions** → Node.js 22
5. Enable **Firebase Hosting**
6. Add a **Web app** → register it (name: "AdSmart Dev") → copy the config object:
   ```js
   // This is what you'll put in .env (the dev-only file, never committed)
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=adsmart-web-dev.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=adsmart-web-dev
   VITE_FIREBASE_STORAGE_BUCKET=adsmart-web-dev.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

### B. Copy production web app config

1. Firebase Console → `adsmart-web` project → Project settings → Your apps → Web app
2. Copy all config values — you'll need them in Task 9 (`.env.production`)

### C. Add `localhost` to the existing reCAPTCHA key

The production key can be reused for dev. Go to [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin) → select the existing key → **Settings** → under **Domains** add `localhost` → save. No separate key needed — the same key is already set in `.env`.

### D. Set up dev project secrets in Secret Manager

From your terminal (after completing Task 4 lockfile migration so `bunx` is available):

```bash
firebase use adsmart-web-dev

# Minimal secrets for dev to work (can use test/dummy values initially)
firebase functions:secrets:set GOOGLE_ADS_CLIENT_SECRET
firebase functions:secrets:set META_ADS_APP_SECRET
firebase functions:secrets:set RECAPTCHA_SECRET_KEY
firebase functions:secrets:set ENCRYPTION_KEY
```

### E. Generate Firebase CI token and add to GitHub

```bash
bunx firebase-tools login:ci
# Copy the printed token
```

GitHub repo → Settings → Secrets and variables → Actions → New secret:
- Name: `FIREBASE_TOKEN`
- Value: paste the token

One token works for all Firebase projects the account has access to.

---

## File map

| Action | File | Purpose |
|---|---|---|
| Create | `bunfig.toml` | Isolated linker (critical for Firebase Functions deploy) |
| Create | `turbo.json` | Task pipeline: build, lint, typecheck, test, clean, dev |
| Create | `.env.production` | Prod Firebase config loaded by `vite build` (safe to commit — public values) |
| Create | `.github/workflows/deploy.yml` | Auto-deploy: `develop`→dev, `main`→prod |
| Modify | `package.json` (root) | name, packageManager, workspaces, turbo devDep, `:all` scripts |
| Modify | `functions/package.json` | name, add typecheck script, npm→bun in scripts |
| Modify | `.firebaserc` | Add `dev` and `production` project aliases |
| Modify | `firebase.json` | Add functions predeploy hook |
| Modify | `.env.example` | Document dual-environment structure |
| Modify | `lefthook.yml` | npx→bunx, npm→bun |
| Modify | `.github/workflows/ci.yml` | Rewrite for Bun + Turbo, add `develop` branch |
| Modify | `CLAUDE.md` | Update testing commands, environment section |
| Modify | `docs/ENVIRONMENT.md` | Add GitHub secrets table, update environments table |
| Modify | `docs/DEPLOYMENT.md` | Add auto-deploy section, two-project setup |
| Delete | `package-lock.json` | Replaced by `bun.lock` |
| Delete | `functions/package-lock.json` | Replaced by root `bun.lock` |
| Generate | `bun.lock` | Created by `bun install` |

---

### Task 1: Create bunfig.toml (isolated linker)

**Files:**
- Create: `bunfig.toml`

- [ ] **Step 1: Create bunfig.toml at project root**

```toml
# bunfig.toml
[install]
linker = "isolated"
```

- [ ] **Step 2: Verify the file**

```bash
cat bunfig.toml
```

Expected: prints the two lines above.

- [ ] **Step 3: Commit**

```bash
git add bunfig.toml
git commit -m "chore: add bunfig.toml with isolated linker for Firebase Functions compat"
```

---

### Task 2: Update root package.json for Bun workspace

**Files:**
- Modify: `package.json`

The root package must have `name` (Turbo requires it), `packageManager` (locks Bun version), and `workspaces`.

- [ ] **Step 1: Replace package.json entirely**

```json
{
  "name": "@adsmart/web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "packageManager": "bun@1.3.10",
  "workspaces": [
    ".",
    "functions"
  ],
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:all": "turbo run build",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "lint:all": "turbo run lint",
    "format": "biome format --write .",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "type-check": "turbo run typecheck",
    "clean": "rm -rf dist .vite",
    "clean:all": "turbo run clean",
    "reinstall": "bun run clean:all && bun install",
    "prepare": "lefthook install",
    "test": "vitest run",
    "test:all": "turbo run test",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "@fontsource/montserrat": "^5.2.6",
    "@hookform/resolvers": "^3.6.0",
    "@radix-ui/react-dialog": "^1.1.14",
    "@types/dompurify": "^3.0.5",
    "@types/react-google-recaptcha": "^2.1.9",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "dompurify": "^3.2.6",
    "firebase": "^10.12.2",
    "framer-motion": "^12.23.12",
    "lucide-react": "^0.396.0",
    "qrcode.react": "^4.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-google-recaptcha": "^3.1.0",
    "react-hook-form": "^7.52.0",
    "react-router-dom": "^6.23.1",
    "tailwind-merge": "^2.3.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.13",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/qrcode.react": "^1.0.5",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/react-router-dom": "^5.3.3",
    "@vitejs/plugin-react": "^4.3.1",
    "@vitest/coverage-v8": "^4.1.5",
    "autoprefixer": "^10.4.19",
    "happy-dom": "^20.9.0",
    "lefthook": "^2.1.6",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.0",
    "turbo": "^2.8.14",
    "typescript": "^5.2.2",
    "vite": "^7.0.6",
    "vitest": "^4.1.5"
  }
}
```

Key changes vs original: `name`, `packageManager`, `workspaces`, `turbo` devDep, `:all` scripts, `typecheck` script, `bun` in `reinstall`.

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore(workspace): add Bun workspace config and Turbo devDep to root package.json"
```

---

### Task 3: Update functions/package.json

**Files:**
- Modify: `functions/package.json`

- [ ] **Step 1: Replace functions/package.json entirely**

```json
{
  "name": "@adsmart/functions",
  "private": true,
  "scripts": {
    "lint": "eslint .",
    "clean": "rm -rf lib tsconfig.tsbuildinfo",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "rebuild": "bun run clean && bun run build",
    "build:watch": "tsc --watch",
    "serve": "bun run build && firebase emulators:start --only functions",
    "shell": "bun run build && firebase functions:shell",
    "start": "bun run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "engines": {
    "node": "22"
  },
  "main": "lib/index.js",
  "dependencies": {
    "axios": "1.10.0",
    "firebase-admin": "12.7.0",
    "firebase-functions": "6.4.0",
    "google-auth-library": "^9.14.2",
    "googleapis": "^118.0.0",
    "qrcode.react": "4.2.0"
  },
  "devDependencies": {
    "@firebase/rules-unit-testing": "5.0.0",
    "@types/qrcode.react": "1.0.5",
    "@typescript-eslint/eslint-plugin": "^5.12.0",
    "@typescript-eslint/parser": "^5.12.0",
    "@vitest/coverage-v8": "4.1.5",
    "eslint": "^8.9.0",
    "eslint-config-google": "^0.14.0",
    "eslint-plugin-import": "^2.25.4",
    "firebase": "12.12.1",
    "firebase-functions-test": "^3.1.0",
    "typescript": "^5.7.3",
    "vitest": "4.1.5"
  }
}
```

Key changes: `name`, `private`, `typecheck` script, `npm run` → `bun run` in `rebuild`/`serve`/`shell`.

- [ ] **Step 2: Commit**

```bash
git add functions/package.json
git commit -m "chore(workspace): add Bun/Turbo compat fields to functions/package.json"
```

---

### Task 4: Migrate lockfiles from npm to Bun

**Files:**
- Delete: `package-lock.json`
- Delete: `functions/package-lock.json`
- Generate: `bun.lock`

- [ ] **Step 1: Install Bun (if not installed)**

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.zshrc
bun --version
```

Expected: `1.3.10` or higher.

- [ ] **Step 2: Migrate root lockfile**

```bash
bun pm migrate
```

Expected: `bun.lock` is created. `package-lock.json` is preserved by Bun for verification.

- [ ] **Step 3: Install all workspaces**

```bash
bun install
```

Expected: installs deps for both `@adsmart/web` and `@adsmart/functions`, updates `bun.lock`. No errors.

- [ ] **Step 4: Verify both workspaces build**

```bash
# Web build
bun run build
# Expected: dist/ created without errors

# Functions build
cd functions && bun run build && cd ..
# Expected: functions/lib/ created without errors
```

- [ ] **Step 5: Delete old lockfiles**

```bash
rm package-lock.json functions/package-lock.json
```

- [ ] **Step 6: Commit**

```bash
git add bun.lock
git rm package-lock.json functions/package-lock.json
git commit -m "chore: migrate from npm to Bun, replace package-lock.json with bun.lock"
```

---

### Task 5: Create turbo.json

**Files:**
- Create: `turbo.json`

- [ ] **Step 1: Create turbo.json**

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "lib/**"]
    },
    "typecheck": {
      "inputs": ["**/*.{ts,tsx}", "tsconfig*.json"]
    },
    "lint": {},
    "test": {
      "cache": false
    },
    "clean": {
      "cache": false
    },
    "dev": {
      "persistent": true,
      "cache": false
    }
  }
}
```

- [ ] **Step 2: Install turbo (now in devDeps) and verify pipeline**

```bash
bun install

# Build all workspaces via Turbo
bunx turbo run build
```

Expected: web (`dist/`) and functions (`lib/`) are built. Output shows two tasks completed.

- [ ] **Step 3: Verify cache works**

```bash
bunx turbo run build
```

Expected: second run shows `2 tasks [2 cached, 0 untracked]` — near-instant.

- [ ] **Step 4: Commit**

```bash
git add turbo.json
git commit -m "chore: add turbo.json with build/lint/typecheck/test pipeline"
```

---

### Task 6: Add functions predeploy to firebase.json

**Files:**
- Modify: `firebase.json`

Without an explicit `predeploy`, Firebase CLI tries `npm run build` in `functions/` — which fails after removing `package-lock.json`.

- [ ] **Step 1: Find the functions block in firebase.json**

Current:
```json
"functions": {
  "source": "functions"
},
```

Replace with:
```json
"functions": {
  "source": "functions",
  "predeploy": ["cd functions && bun run build"]
},
```

- [ ] **Step 2: Verify valid JSON**

```bash
node -e "require('./firebase.json'); console.log('OK')"
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add firebase.json
git commit -m "chore: add bun predeploy hook to firebase.json functions config"
```

---

### Task 7: Update lefthook.yml for Bun

**Files:**
- Modify: `lefthook.yml`

- [ ] **Step 1: Replace lefthook.yml**

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{ts,tsx,js,jsx,json}"
      run: bunx biome check --write --no-errors-on-unmatched {staged_files}
      stage_fixed: true

pre-push:
  parallel: true
  commands:
    typecheck-web:
      run: bun run typecheck
    typecheck-functions:
      root: "functions/"
      run: bun run build
```

Changes: `npx` → `bunx`, `npm run type-check` → `bun run typecheck`, `npm run build` → `bun run build`.

- [ ] **Step 2: Reinstall hooks**

```bash
bun run prepare
```

Expected: lefthook installs updated hooks without errors.

- [ ] **Step 3: Commit**

```bash
git add lefthook.yml
git commit -m "chore: update lefthook hooks to use bunx/bun instead of npx/npm"
```

---

### Task 8: Update .firebaserc with dev/production aliases

**Files:**
- Modify: `.firebaserc`

- [ ] **Step 1: Replace .firebaserc**

```json
{
  "projects": {
    "default": "adsmart-web-dev",
    "dev": "adsmart-web-dev",
    "production": "adsmart-web"
  }
}
```

`default` now points to the dev project — running `firebase` commands locally targets dev by default. Production is only targeted explicitly via `--project adsmart-web` (done in CI).

- [ ] **Step 2: Verify the file**

```bash
bunx firebase-tools projects:list
```

Expected: shows both `adsmart-web-dev` and `adsmart-web` in the list. Active project is `adsmart-web-dev`.

- [ ] **Step 3: Deploy Firestore rules to dev project (one-time)**

```bash
bunx firebase-tools deploy --only firestore:rules --project adsmart-web-dev
```

Expected: deploys the existing `firestore.rules` to the dev project.

- [ ] **Step 4: Commit**

```bash
git add .firebaserc
git commit -m "chore: set adsmart-web-dev as default Firebase project, add dev/production aliases"
```

---

### Task 9: Create .env.production with production Firebase config

**Files:**
- Create: `.env.production`

Vite loads `.env.production` automatically when running `vite build` (production mode). This file is committed because Firebase web app config values are public by design — they're embedded in the client JS bundle regardless.

- [ ] **Step 1: Create .env.production**

Populate with the actual production values from Firebase Console → `adsmart-web` → Project settings → Your apps → Web app (collected in Prerequisite B):

```bash
# .env.production
# Vite loads this file automatically during `vite build`
# Safe to commit — these values are embedded in the public client bundle
VITE_FIREBASE_API_KEY=REPLACE_WITH_PROD_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=adsmart-web.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=adsmart-web
VITE_FIREBASE_STORAGE_BUCKET=adsmart-web.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=REPLACE_WITH_PROD_SENDER_ID
VITE_FIREBASE_APP_ID=REPLACE_WITH_PROD_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=REPLACE_WITH_PROD_MEASUREMENT_ID
VITE_RECAPTCHA_SITE_KEY=REPLACE_WITH_PROD_RECAPTCHA_SITE_KEY
```

Replace all `REPLACE_WITH_*` placeholders with the actual values from Firebase Console.

Do NOT add `VITE_USE_FIREBASE_EMULATOR` here — it must stay unset in production.

- [ ] **Step 2: Verify Vite picks up the correct project on build**

```bash
bun run build
# After build, check that the production project ID is in the bundle:
grep -r "adsmart-web" dist/assets/*.js | grep -v "adsmart-web-dev" | head -3
```

Expected: finds `adsmart-web` strings (prod project ID) in the built assets.

- [ ] **Step 3: Update .env (dev file, not committed) to point to dev project**

This is a manual step — edit your local `.env` file (gitignored) to use the dev project config from Prerequisite A:

```bash
# .env (dev project — NOT committed)
VITE_FIREBASE_API_KEY=<dev project api key>
VITE_FIREBASE_AUTH_DOMAIN=adsmart-web-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=adsmart-web-dev
VITE_FIREBASE_STORAGE_BUCKET=adsmart-web-dev.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=<dev sender id>
VITE_FIREBASE_APP_ID=<dev app id>
VITE_RECAPTCHA_SITE_KEY=<dev localhost recaptcha key>
```

- [ ] **Step 4: Verify dev server connects to dev project**

```bash
bun run dev
# In browser, open DevTools → Network → look for requests to adsmart-web-dev
# OR check: window.__firebase_app__.options.projectId should be 'adsmart-web-dev'
```

Expected: dev server connects to `adsmart-web-dev`, not `adsmart-web`.

- [ ] **Step 5: Commit .env.production**

```bash
git add .env.production
git commit -m "chore: add .env.production with production Firebase config for vite build"
```

---

### Task 10: Update .env.example for dual-environment

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Replace .env.example**

```bash
# .env — DEVELOPMENT config (copy this file to .env and fill in dev project values)
# .env.production — PRODUCTION config (committed, used by vite build automatically)
#
# How environments work:
#   bun run dev   → Vite uses .env        → connects to adsmart-web-dev (dev project)
#   bun run build → Vite uses .env.production → connects to adsmart-web (prod project)
#
# NEVER put production values here. .env is for local dev only.
# Get dev project values from Firebase Console → adsmart-web-dev → Project settings → Your apps

# ── Dev Firebase project config (adsmart-web-dev) ───────────────────────────
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=adsmart-web-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=adsmart-web-dev
VITE_FIREBASE_STORAGE_BUCKET=adsmart-web-dev.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Optional — uncomment to set
# VITE_FIREBASE_MEASUREMENT_ID=

# ── Local emulators (optional) ───────────────────────────────────────────────
# Set to "true" to connect to local Firebase emulators instead of adsmart-web-dev
# VITE_USE_FIREBASE_EMULATOR=true

# ── reCAPTCHA (register at console.cloud.google.com/recaptcha — domain: localhost)
VITE_RECAPTCHA_SITE_KEY=

# ── Backend env vars (functions runtime) ─────────────────────────────────────
# Set these in Firebase Functions config for adsmart-web-dev project
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_DEVELOPER_TOKEN=
META_ADS_APP_ID=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: update .env.example to document dual dev/prod environment setup"
```

---

### Task 11: Rewrite CI workflow for Bun + Turbo + develop branch

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Replace .github/workflows/ci.yml**

```yaml
name: CI

on:
  push:
    branches: [main, develop, migrate]
  pull_request:
    branches: [main, develop]

jobs:
  web:
    name: Frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.10

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Turbo cache
        uses: actions/cache@v4
        with:
          path: .turbo
          key: ${{ runner.os }}-turbo-web-${{ github.sha }}
          restore-keys: ${{ runner.os }}-turbo-web-

      - name: Lint
        run: bun run lint

      - name: Typecheck
        run: bun run typecheck

      - name: Build
        run: bun run build

  functions:
    name: Cloud Functions
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.10

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Turbo cache
        uses: actions/cache@v4
        with:
          path: .turbo
          key: ${{ runner.os }}-turbo-functions-${{ github.sha }}
          restore-keys: ${{ runner.os }}-turbo-functions-

      # Non-blocking until Phase 2 ESLint 8→9 migration
      - name: Lint (non-blocking)
        working-directory: functions
        run: bun run lint
        continue-on-error: true

      - name: Build
        working-directory: functions
        run: bun run build
```

- [ ] **Step 2: Verify valid YAML**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); print('OK')"
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: migrate CI workflow to Bun + Turbo with task caching, add develop branch"
```

---

### Task 12: Create dual-environment deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

Two jobs in one workflow:
- `deploy-dev`: triggers on push to `develop` → deploys to `adsmart-web-dev`
- `deploy-prod`: triggers on push to `main` → deploys to `adsmart-web`

Both require the `FIREBASE_TOKEN` secret (set up in Prerequisite E).

- [ ] **Step 1: Create .github/workflows/deploy.yml**

```yaml
name: Deploy

on:
  push:
    branches: [develop, main]

jobs:
  deploy-dev:
    name: Deploy → adsmart-web-dev (develop)
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.10

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Turbo cache
        uses: actions/cache@v4
        with:
          path: .turbo
          key: ${{ runner.os }}-turbo-deploy-dev-${{ github.sha }}
          restore-keys: ${{ runner.os }}-turbo-deploy-dev-

      - name: Build all (web + functions)
        run: bun run build:all

      - name: Deploy to dev
        run: bunx firebase-tools deploy --only hosting,functions --project adsmart-web-dev --non-interactive
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}

  deploy-prod:
    name: Deploy → adsmart-web (main)
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.10

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Turbo cache
        uses: actions/cache@v4
        with:
          path: .turbo
          key: ${{ runner.os }}-turbo-deploy-prod-${{ github.sha }}
          restore-keys: ${{ runner.os }}-turbo-deploy-prod-

      - name: Build all (web + functions)
        run: bun run build:all

      - name: Deploy to production
        run: bunx firebase-tools deploy --only hosting,functions --project adsmart-web --non-interactive
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

Note: `bun run build:all` runs `turbo run build`. Vite automatically uses `.env.production` (committed file) during build — no extra env injection needed for Firebase web config. Functions build (`tsc`) produces `functions/lib/`.

- [ ] **Step 2: Verify valid YAML**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml')); print('OK')"
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add dual-environment deploy workflow (develop→dev, main→prod)"
```

---

### Task 13: Update CLAUDE.md and docs

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/ENVIRONMENT.md`
- Modify: `docs/DEPLOYMENT.md`

#### CLAUDE.md — testing section

- [ ] **Step 1: Update the Testing section**

Find:
```markdown
## Testing in Claude sessions

\`\`\`bash
# Run all web tests
npm test

# Run all functions tests (from functions/)
cd functions && npm test

# Run with coverage
npm run test:coverage
\`\`\`
```

Replace with:
```markdown
## Testing in Claude sessions

\`\`\`bash
# Run all web tests
bun run test

# Run all functions tests (from functions/)
cd functions && bun run test

# Run all tests across workspaces (via Turbo)
bun run test:all

# Run with coverage (web)
bun run test:coverage
\`\`\`
```

#### docs/ENVIRONMENT.md — environments table + GitHub secrets

- [ ] **Step 2: Update the Environments table**

Find:
```markdown
| Name | Firebase project | Frontend URL |
|---|---|---|
| Production | `adsmart-web` | `https://adsmart.app` |
| Development | Local emulators | `http://localhost:5173` |

There is no staging environment currently. All testing is done locally with emulators.
```

Replace with:
```markdown
| Name | Firebase project | Frontend URL | Trigger |
|---|---|---|---|
| Production | `adsmart-web` | `https://adsmart.app` | Push to `main` |
| Development | `adsmart-web-dev` | `https://adsmart-web-dev.web.app` | Push to `develop` |
| Local | Local emulators | `http://localhost:5173` | `bun run dev` |

`bun run dev` connects to `adsmart-web-dev` by default (values in `.env`). Set `VITE_USE_FIREBASE_EMULATOR=true` in `.env` to use local emulators instead.
```

- [ ] **Step 3: Add GitHub Actions secrets section at the end of docs/ENVIRONMENT.md**

```markdown
## GitHub Actions secrets

| Secret | Where to set | Description |
|---|---|---|
| `FIREBASE_TOKEN` | GitHub repo → Settings → Secrets | Firebase CI token. Generate: `bunx firebase-tools login:ci`. Works for both `adsmart-web-dev` and `adsmart-web`. |
```

#### docs/DEPLOYMENT.md — auto-deploy section

- [ ] **Step 4: Add auto-deploy section at the top of docs/DEPLOYMENT.md (before the existing checklist)**

```markdown
## Auto-deploy (CI/CD)

Pushes to `develop` and `main` trigger automatic deploys via `.github/workflows/deploy.yml`:

| Branch | Firebase project | URL |
|---|---|---|
| `develop` | `adsmart-web-dev` | `https://adsmart-web-dev.web.app` |
| `main` | `adsmart-web` | `https://adsmart.app` |

**Deploy flow:**
1. `bun install --frozen-lockfile`
2. `turbo run build` → builds web (`dist/`) and functions (`functions/lib/`) with caching
3. `firebase deploy --only hosting,functions --project <target>`

**Prerequisites (one-time):**
- `FIREBASE_TOKEN` GitHub secret set (see `docs/ENVIRONMENT.md`)
- All Firebase Secret Manager secrets provisioned in the target project
- `adsmart-web-dev` project created and configured (see `docs/ENVIRONMENT.md`)

**Manual deploy from local machine:**
\`\`\`bash
# Deploy to dev
bun run build:all
bunx firebase-tools deploy --only hosting,functions --project adsmart-web-dev

# Deploy to production (prefer letting CI handle this)
bun run build:all
bunx firebase-tools deploy --only hosting,functions --project adsmart-web
\`\`\`

---
```

- [ ] **Step 5: Commit all doc changes**

```bash
git add CLAUDE.md docs/ENVIRONMENT.md docs/DEPLOYMENT.md
git commit -m "docs: update commands to bun, document dual-environment setup and auto-deploy"
```

---

## End-to-end verification

After all tasks are complete, run this sequence to confirm everything works:

```bash
# 1. Fresh install
bun install

# 2. Web dev server connects to adsmart-web-dev
bun run dev
# Open browser → create a test account → verify it appears in adsmart-web-dev Auth, NOT adsmart-web

# 3. Production build uses prod Firebase config
bun run build
grep -r "adsmart-web\"" dist/assets/*.js | grep -v "dev" | head -3
# Expected: finds adsmart-web (not adsmart-web-dev) in the production bundle

# 4. Turbo pipeline
bunx turbo run build lint typecheck
# Second run should show cache hits

# 5. Web tests pass
bun run test

# 6. Git hooks work (make a small change, commit it)
git add CLAUDE.md
git commit -m "test: verify git hooks"  # biome should run, typecheck should run on push

# 7. Dry-run deploy to dev
bunx firebase-tools deploy --only hosting,functions --project adsmart-web-dev --dry-run
# Expected: no errors
```
