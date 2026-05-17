# Phase 1 — Cleanup & Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up repository hygiene, extract the 1489-line i18n file to JSON locales, add Biome + lefthook + GitHub Actions CI + Vitest, and write tests for areas that survive the future Asaas migration (utils, rate limiter, admin guard, Firestore rules, OAuth V2).

**Architecture:** This phase produces zero user-facing behavior changes. All work is operational: fix `.gitignore` typo, remove leaked backups from tree, split `LanguageContext.tsx` into locale files with the same public API, swap ESLint for Biome on the frontend (ESLint stays in `functions/` until Fase 2), install lefthook git hooks, add CI workflow, scaffold Vitest in both `web` and `functions/`, then write a targeted test battery.

**Tech Stack:** Firebase (Hosting + Cloud Functions v2 + Firestore), React 18 + Vite 7 + TypeScript 5.2, Biome (new), lefthook (new), Vitest (new), `@firebase/rules-unit-testing` (new), `firebase-functions-test` (already installed).

---

## File Structure

### Files created

- `biome.json` — Biome config (frontend only)
- `lefthook.yml` — git hooks config
- `.github/workflows/ci.yml` — CI pipeline
- `vitest.config.ts` — frontend test runner
- `src/test/setup.ts` — frontend test globals
- `functions/vitest.config.ts` — functions test runner
- `functions/test/setup.ts` — functions test globals
- `src/locales/pt-BR.json` — Portuguese translations (extracted)
- `src/locales/en.json` — English translations (extracted)
- `src/locales/es.json` — Spanish translations (extracted)
- `src/locales/types.ts` — Translations TypeScript type
- `src/utils/sanitize.test.ts`
- `src/utils/validation.test.ts`
- `functions/test/rateLimiter.test.ts`
- `functions/test/adminWalletManager.test.ts`
- `functions/test/firestore-rules.test.ts`
- `functions/test/googleAdsOAuthV2.test.ts`
- `functions/test/metaAdsOAuthV2.test.ts`

### Files modified

- `.gitignore` — fix `.backup/` → `.backups/`, add CI artifacts
- `package.json` (root) — remove `firebase-admin`, remove ESLint deps, add Biome + Vitest + lefthook
- `tsconfig.json` — remove `functions/src/rateLimiter.ts` from `include`, unify target ES2022
- `tsconfig.app.json` — confirm ES2022 alignment
- `.env.example` — rename `VITE_USE_EMULATORS` → `VITE_USE_FIREBASE_EMULATOR`
- `src/contexts/LanguageContext.tsx` — reduce to locale loader (~60 lines)
- `functions/package.json` — add Vitest + `@firebase/rules-unit-testing`

### Files deleted

- `.backups/` (entire directory, 8 files)
- `src/pages/_deleted/` (entire directory)
- `src/test-translations.ts.bak`
- `eslint.config.js` (root — replaced by Biome)

---

## Task 1: Remove leaked .env backups from tree and fix .gitignore typo

**Context:** `.backups/` (with trailing `s`) contains 8 `.env` files committed to git because `.gitignore` has `.backup/` (no `s`). History stays — user accepted that trade-off. Goal: keep current tree clean and prevent re-commit.

**Files:**
- Modify: `.gitignore`
- Delete: `.backups/` (tracked; 8 files)

- [ ] **Step 1: Remove `.backups/` from tree**

Run:

```bash
git rm -r .backups/
```

Expected: output shows 8 files removed.

- [ ] **Step 2: Fix `.gitignore` typo**

Edit `.gitignore`:

```
# Backup files
.backup/
*.save
```

→

```
# Backup files
.backup/
.backups/
*.save
```

- [ ] **Step 3: Verify `.backups/` is now ignored**

Run:

```bash
mkdir -p .backups && touch .backups/test.env
git check-ignore -v .backups/test.env
rm -rf .backups/
```

Expected: output shows `.gitignore:XX:.backups/ .backups/test.env` (the rule matched).

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: remove leaked env backups from tree, fix gitignore typo

- .backups/ removed from working tree (history retained by design — repo private)
- .gitignore had '.backup/' (no trailing s) which didn't match the actual '.backups/' dir
- added '.backups/' alongside to prevent re-commit"
```

---

## Task 2: Remove dead code

**Context:** `src/pages/_deleted/` and `src/test-translations.ts.bak` are leftover files bloating the tree.

**Files:**
- Delete: `src/pages/_deleted/`
- Delete: `src/test-translations.ts.bak`

- [ ] **Step 1: Verify files exist**

Run:

```bash
ls src/pages/_deleted/ 2>/dev/null ; ls src/test-translations.ts.bak 2>/dev/null
```

Expected: both paths exist.

- [ ] **Step 2: Check nothing imports from `_deleted/`**

Run:

```bash
grep -rn "_deleted" src/ --include="*.ts" --include="*.tsx"
```

Expected: empty output (no imports).

- [ ] **Step 3: Delete files**

Run:

```bash
git rm -r src/pages/_deleted/
git rm src/test-translations.ts.bak
```

- [ ] **Step 4: Verify build still works**

Run:

```bash
npm run type-check
```

Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git commit -m "chore: remove dead code

- src/pages/_deleted/ (quarantine folder, not imported anywhere)
- src/test-translations.ts.bak (stale backup)"
```

---

## Task 3: Remove firebase-admin from frontend dependencies

**Context:** `firebase-admin` is in the root `package.json` `dependencies`. It's the Admin SDK, meant only for server-side. If anything in `src/` imports it accidentally, it'd get bundled and could leak admin credentials.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (regenerated)

- [ ] **Step 1: Verify no frontend code imports firebase-admin**

Run:

```bash
grep -rn "firebase-admin" src/
```

Expected: empty output.

- [ ] **Step 2: Remove from package.json**

Edit `package.json`, remove the line:

```json
"firebase-admin": "^13.4.0",
```

from the `dependencies` block.

- [ ] **Step 3: Regenerate lockfile**

Run:

```bash
npm install
```

Expected: `package-lock.json` updated, no errors.

- [ ] **Step 4: Verify build and typecheck still pass**

Run:

```bash
npm run type-check && npm run build
```

Expected: both succeed.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove firebase-admin from frontend deps

Admin SDK is server-only and must never reach the browser bundle.
No src/ code was importing it — this was dead weight with a security
risk if accidentally imported. Admin SDK lives only in functions/."
```

---

## Task 4: Fix tsconfig.json — decouple frontend from functions, unify target

**Context:** `tsconfig.json` has `"include": ["src", "functions/src/rateLimiter.ts"]` — the frontend TS project is pulling a single file from the Cloud Functions source. This creates a cross-project coupling that will blow up when functions upgrades its own config. Also the `target` is ES2020 here but ES2022 in `tsconfig.app.json` — they disagree.

**Files:**
- Modify: `tsconfig.json`
- Confirm: `tsconfig.app.json` (already ES2022)
- Confirm: no frontend file imports from `functions/`

- [ ] **Step 1: Check the suspicious import**

Run:

```bash
grep -rn "functions/src" src/ ; grep -rn "from.*rateLimiter" src/ functions/src/
```

Expected: confirm `src/hooks/useRateLimit.ts` (or similar) does NOT import from `functions/`. If it does, the test stays in functions — the frontend just needs its own thin wrapper, but that's out of scope for this task.

- [ ] **Step 2: Rewrite tsconfig.json**

Replace the entire contents of `tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Verify typecheck passes**

Run:

```bash
npm run type-check
```

Expected: exit code 0. If errors appear about `rateLimiter`, it means some src/ file WAS importing it — investigate and fix before proceeding.

- [ ] **Step 4: Verify build passes**

Run:

```bash
npm run build
```

Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add tsconfig.json
git commit -m "chore: decouple frontend tsconfig from functions, unify ES2022 target

- Remove 'functions/src/rateLimiter.ts' from include (cross-project coupling)
- Align target to ES2022 matching tsconfig.app.json"
```

---

## Task 5: Standardize emulator env var name

**Context:** `.env.example` declares `VITE_USE_EMULATORS` but `src/firebase/config.ts` reads `VITE_USE_FIREBASE_EMULATOR`. Result: the example file is misleading and emulator mode never activated from `.env.example` template values. Standardize on `VITE_USE_FIREBASE_EMULATOR` (the name already used in code).

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Inspect current code usage**

Run:

```bash
grep -rn "VITE_USE_EMULATOR" src/ .env.example
```

Expected: `src/firebase/config.ts` uses `VITE_USE_FIREBASE_EMULATOR`, `.env.example` uses `VITE_USE_EMULATORS` (inconsistent).

- [ ] **Step 2: Update `.env.example`**

Edit `.env.example`, replace:

```
# Development Mode
VITE_USE_EMULATORS=
```

with:

```
# Development Mode (set to 'true' to connect to local Firebase emulators)
VITE_USE_FIREBASE_EMULATOR=
```

- [ ] **Step 3: Verify code-example alignment**

Run:

```bash
grep -n "VITE_USE_FIREBASE_EMULATOR" .env.example src/firebase/config.ts
```

Expected: both files reference the same name.

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "chore: standardize emulator env var name

.env.example had VITE_USE_EMULATORS but code reads VITE_USE_FIREBASE_EMULATOR.
Aligned example to match the code (the latter name is more explicit)."
```

---

## Task 6: Extract i18n translations to JSON locale files

**Context:** `src/contexts/LanguageContext.tsx` is 1489 lines with three languages (`pt`, `en`, `es`) inline. This is hard to diff, review, and maintain. Extract to JSON files, keep the context as a thin loader.

**Files:**
- Create: `src/locales/types.ts`
- Create: `src/locales/pt-BR.json`
- Create: `src/locales/en.json`
- Create: `src/locales/es.json`
- Modify: `src/contexts/LanguageContext.tsx` (reduce to ~60 lines)

- [ ] **Step 1: Read full LanguageContext.tsx to map structure**

Run:

```bash
wc -l src/contexts/LanguageContext.tsx
```

Expected: ~1489 lines.

Then read the file in full and identify:
- The `Translations` TypeScript interface (at top)
- The `translations: Record<Language, Translations>` constant (the huge block)
- The Context + Provider implementation (at the end)

- [ ] **Step 2: Create type file**

Create `src/locales/types.ts` with the `Translations` interface extracted verbatim from the current file:

```typescript
export type Language = 'pt' | 'en' | 'es'

export interface Translations {
  // PASTE the entire existing Translations interface from LanguageContext.tsx
  // verbatim here. Do not rename or change any field.
}
```

- [ ] **Step 3: Extract Portuguese translations**

Create `src/locales/pt-BR.json`:

Take the object value of `translations.pt` from the current file. Convert from TS object literal to JSON:
- Remove trailing commas
- Wrap all keys in double quotes
- Escape any embedded double quotes in strings

Save the result as valid JSON at `src/locales/pt-BR.json`.

- [ ] **Step 4: Extract English translations**

Same as Step 3 but for `translations.en` → `src/locales/en.json`.

- [ ] **Step 5: Extract Spanish translations**

Same as Step 3 but for `translations.es` → `src/locales/es.json`.

- [ ] **Step 6: Validate JSON files**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('src/locales/pt-BR.json','utf8')); console.log('pt-BR ok')"
node -e "JSON.parse(require('fs').readFileSync('src/locales/en.json','utf8')); console.log('en ok')"
node -e "JSON.parse(require('fs').readFileSync('src/locales/es.json','utf8')); console.log('es ok')"
```

Expected: three "ok" lines.

- [ ] **Step 7: Rewrite LanguageContext.tsx as loader**

Replace the entire contents of `src/contexts/LanguageContext.tsx` with:

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Language, Translations } from '@/locales/types'
import ptBR from '@/locales/pt-BR.json'
import en from '@/locales/en.json'
import es from '@/locales/es.json'

const translations: Record<Language, Translations> = {
  pt: ptBR as Translations,
  en: en as Translations,
  es: es as Translations,
}

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

const STORAGE_KEY = 'adsmart.language'

function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'pt'
  const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null
  if (stored && stored in translations) return stored
  const browser = window.navigator.language.slice(0, 2) as Language
  if (browser in translations) return browser
  return 'pt'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage)

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    window.localStorage.setItem(STORAGE_KEY, lang)
  }

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
```

Note: the original file may not have had `detectInitialLanguage`, `localStorage` persistence, or `document.documentElement.lang` sync. Before finalizing, compare to the old file's Provider logic and preserve whatever behavior existed (only language detection — if the old file just defaulted to `'pt'`, remove `detectInitialLanguage` complexity).

- [ ] **Step 8: Verify tsconfig allows JSON imports**

Confirm `tsconfig.json` has `"resolveJsonModule": true` (it does after Task 4).

- [ ] **Step 9: Typecheck and build**

Run:

```bash
npm run type-check && npm run build
```

Expected: both succeed. If the JSON structure doesn't exactly match the `Translations` interface, you'll get errors — fix by comparing the extracted JSON to the interface.

- [ ] **Step 10: Smoke test — ensure app renders**

Run:

```bash
npm run dev
```

Open browser, navigate to `/` and `/login`. Change language via the `LanguageSelector` component. Verify text switches between pt/en/es correctly.

Kill the dev server after verification.

- [ ] **Step 11: Commit**

```bash
git add src/locales/ src/contexts/LanguageContext.tsx
git commit -m "refactor(i18n): extract translations to JSON locale files

- Split src/contexts/LanguageContext.tsx (1489 lines) into:
  - src/locales/types.ts (Translations interface)
  - src/locales/pt-BR.json, en.json, es.json
  - src/contexts/LanguageContext.tsx (~60 lines, loader only)
- Public API unchanged (useLanguage, setLanguage, t)"
```

---

## Task 7: Install and configure Biome (replacing frontend ESLint)

**Context:** Current frontend uses ESLint 9 flat config. Biome is a faster single-binary linter+formatter. Replace ESLint on the frontend; keep ESLint in `functions/` (migrated to v9 flat in Fase 2). Biome config will match the existing code style (no mass reformatting expected).

**Files:**
- Create: `biome.json`
- Modify: `package.json`
- Delete: `eslint.config.js`

- [ ] **Step 1: Install Biome**

Run:

```bash
npm install --save-dev --save-exact @biomejs/biome@2
```

(Pin exact version per Biome's recommendation.)

- [ ] **Step 2: Initialize config**

Run:

```bash
npx @biomejs/biome init
```

Expected: `biome.json` created.

- [ ] **Step 3: Customize biome.json**

Replace `biome.json` contents with:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "includes": ["src/**/*.ts", "src/**/*.tsx", "!src/locales/**"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      },
      "correctness": {
        "noUnusedVariables": "warn",
        "useExhaustiveDependencies": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "jsxQuoteStyle": "double",
      "trailingCommas": "es5",
      "semicolons": "asNeeded"
    }
  },
  "json": {
    "formatter": { "enabled": true, "indentStyle": "space" }
  }
}
```

- [ ] **Step 4: Update package.json scripts**

Edit `package.json` — replace the `lint` script and add new ones:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "lint": "biome check .",
  "lint:fix": "biome check --write .",
  "format": "biome format --write .",
  "preview": "vite preview",
  "type-check": "tsc --noEmit",
  "clean": "rm -rf node_modules dist .vite",
  "reinstall": "npm run clean && npm install"
}
```

- [ ] **Step 5: Remove ESLint dependencies**

Edit `package.json`, remove from `devDependencies`:

```
"@typescript-eslint/eslint-plugin": "^7.18.0",
"@typescript-eslint/parser": "^7.18.0",
"eslint": "^8.57.0",
"eslint-plugin-react-hooks": "^4.6.2",
"eslint-plugin-react-refresh": "^0.4.7",
```

(Leave `typescript-eslint`, `globals`, `@eslint/js` if they appear — remove them too if present.)

- [ ] **Step 6: Delete eslint.config.js**

Run:

```bash
git rm eslint.config.js
```

- [ ] **Step 7: Regenerate lockfile**

Run:

```bash
npm install
```

- [ ] **Step 8: Run Biome check (non-fatal first pass)**

Run:

```bash
npx biome check . || true
```

Expected: outputs list of findings. Many are likely formatting — that's fine. Examine output to ensure config is loaded correctly.

- [ ] **Step 9: Auto-fix safe issues**

Run:

```bash
npx biome check --write .
```

Expected: many files reformatted. Review diff with `git diff --stat`.

- [ ] **Step 10: Final check must pass**

Run:

```bash
npm run lint
```

Expected: exit code 0, or only warnings (no errors).

If there are remaining errors: triage. If they're about `noExplicitAny`, either fix the type or demote the rule to `"off"` for this phase (we'll tighten in Fase 2).

- [ ] **Step 11: Typecheck and build**

Run:

```bash
npm run type-check && npm run build
```

Expected: both succeed.

- [ ] **Step 12: Commit**

```bash
git add biome.json package.json package-lock.json src/
git rm eslint.config.js
git commit -m "chore: replace frontend ESLint with Biome

- Add biome.json (formatter + linter, 2 spaces, single quotes, no semis)
- Remove eslint.config.js and all ESLint deps from root package.json
- Scripts: lint = biome check, lint:fix = biome check --write
- Auto-format applied across src/
- Functions still uses ESLint (migrated to v9 flat in Fase 2)"
```

---

## Task 8: Install and configure lefthook

**Context:** No git hooks today. Add lefthook for pre-commit (biome on staged files) and pre-push (tsc on both projects).

**Files:**
- Create: `lefthook.yml`
- Modify: `package.json`

- [ ] **Step 1: Install lefthook**

Run:

```bash
npm install --save-dev lefthook
```

- [ ] **Step 2: Create lefthook.yml**

Create `lefthook.yml`:

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{ts,tsx,js,jsx,json}"
      run: npx biome check --write --no-errors-on-unmatched {staged_files}
      stage_fixed: true

pre-push:
  parallel: true
  commands:
    typecheck-web:
      run: npm run type-check
    typecheck-functions:
      root: "functions/"
      run: npm run build
```

- [ ] **Step 3: Install hooks**

Run:

```bash
npx lefthook install
```

Expected: output mentions hooks installed at `.git/hooks/`.

- [ ] **Step 4: Verify pre-commit hook works**

Run:

```bash
touch src/test-lefthook.ts && echo "const x :  string = 'hello'" > src/test-lefthook.ts
git add src/test-lefthook.ts
git commit -m "test: lefthook verification" --dry-run 2>&1 | head -20
```

Expected: pre-commit runs biome, which reformats the file.

Cleanup:

```bash
git restore --staged src/test-lefthook.ts
rm src/test-lefthook.ts
```

- [ ] **Step 5: Add `prepare` script so hooks auto-install on `npm install`**

Edit `package.json` scripts, add:

```json
"prepare": "lefthook install"
```

- [ ] **Step 6: Commit**

```bash
git add lefthook.yml package.json package-lock.json
git commit -m "chore: add lefthook for pre-commit biome and pre-push typecheck

- pre-commit: biome check --write on staged ts/tsx/js/jsx/json
- pre-push: tsc --noEmit on frontend + functions build
- hooks auto-install via 'prepare' script on npm install"
```

---

## Task 9: Add GitHub Actions CI

**Context:** No CI today. Add a workflow that runs on PRs and pushes to `main`/`migrate`: lint + typecheck + build on both `web` and `functions`.

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create workflow file**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, migrate]
  pull_request:
    branches: [main, migrate]

jobs:
  web:
    name: Frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run build

  functions:
    name: Cloud Functions
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: functions
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: functions/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions pipeline

- Job 'web': lint (biome) + typecheck + build
- Job 'functions': lint (eslint) + build
- Runs on push/PR to main and migrate"
```

Note: CI will only run once the branch is pushed. Local validation stays as the immediate gate.

---

## Task 10: Scaffold Vitest in frontend

**Context:** No test runner today. Add Vitest + testing-library + happy-dom for unit and component tests.

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json`
- Create: `src/test/smoke.test.ts` (sanity check)

- [ ] **Step 1: Install deps**

Run:

```bash
npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom
```

- [ ] **Step 2: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.test.{ts,tsx}', 'src/locales/**', 'src/main.tsx'],
    },
  },
})
```

- [ ] **Step 3: Create setup file**

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 4: Add package.json scripts**

Edit `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 5: Create smoke test**

Create `src/test/smoke.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

describe('Vitest smoke test', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: 1 test passes.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts src/test/ package.json package-lock.json
git commit -m "test: scaffold Vitest in frontend

- vitest + @testing-library/react + happy-dom
- src/test/setup.ts with jest-dom matchers + cleanup
- Scripts: test, test:watch, test:coverage
- Smoke test confirms setup works"
```

---

## Task 11: Scaffold Vitest in functions

**Context:** Functions project has its own `package.json` and needs its own test runner. Add Vitest + `@firebase/rules-unit-testing` (will be used in Task 16).

**Files:**
- Create: `functions/vitest.config.ts`
- Create: `functions/test/setup.ts`
- Modify: `functions/package.json`
- Create: `functions/test/smoke.test.ts`

- [ ] **Step 1: Install deps**

Run:

```bash
cd functions
npm install --save-dev vitest @vitest/coverage-v8 @firebase/rules-unit-testing
cd ..
```

- [ ] **Step 2: Create functions/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'lib/**'],
    },
  },
})
```

- [ ] **Step 3: Create setup file**

Create `functions/test/setup.ts`:

```typescript
// Firebase Admin requires these env vars when running outside of a real project.
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'adsmart-test'
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099'
```

- [ ] **Step 4: Add scripts to functions/package.json**

Edit `functions/package.json` scripts, add:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 5: Create smoke test**

Create `functions/test/smoke.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

describe('Functions Vitest smoke test', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run tests**

```bash
cd functions && npm test && cd ..
```

Expected: 1 test passes.

- [ ] **Step 7: Commit**

```bash
git add functions/vitest.config.ts functions/test/ functions/package.json functions/package-lock.json
git commit -m "test: scaffold Vitest in functions

- vitest + @firebase/rules-unit-testing
- Node test env with emulator host defaults
- Scripts: test, test:watch, test:coverage
- Smoke test confirms setup works"
```

---

## Task 12: Test — `src/utils/sanitize.ts`

**Context:** Sanitizer around DOMPurify. Covers `sanitizeInput`, `sanitizeHTML`, `sanitizeEmail`, `sanitizeFilename`. Pure functions, easy to test.

**Files:**
- Create: `src/utils/sanitize.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/sanitize.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  sanitizeInput,
  sanitizeHTML,
  sanitizeEmail,
  sanitizeFilename,
} from './sanitize'

describe('sanitizeInput', () => {
  it('strips all HTML tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>hello')).toBe('hello')
  })

  it('strips attributes', () => {
    expect(sanitizeInput('<div onclick="x">text</div>')).toBe('text')
  })

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('preserves plain text', () => {
    expect(sanitizeInput('hello world 123')).toBe('hello world 123')
  })

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('')
  })

  it('removes img tags with onerror', () => {
    expect(sanitizeInput('<img src=x onerror=alert(1)>')).toBe('')
  })
})

describe('sanitizeHTML', () => {
  it('preserves allowed tags', () => {
    expect(sanitizeHTML('<b>bold</b>')).toBe('<b>bold</b>')
    expect(sanitizeHTML('<p>paragraph</p>')).toBe('<p>paragraph</p>')
    expect(sanitizeHTML('<a href="https://x.com">link</a>')).toContain('href="https://x.com"')
  })

  it('strips script tags', () => {
    expect(sanitizeHTML('<script>evil()</script><p>ok</p>')).toBe('<p>ok</p>')
  })

  it('strips style attribute', () => {
    const out = sanitizeHTML('<p style="color:red">x</p>')
    expect(out).toBe('<p>x</p>')
  })

  it('strips data- attributes', () => {
    const out = sanitizeHTML('<p data-evil="1">x</p>')
    expect(out).not.toContain('data-evil')
  })

  it('strips javascript: href', () => {
    const out = sanitizeHTML('<a href="javascript:alert(1)">x</a>')
    expect(out).not.toContain('javascript:')
  })
})

describe('sanitizeEmail', () => {
  it('lowercases', () => {
    expect(sanitizeEmail('FOO@BAR.COM')).toBe('foo@bar.com')
  })

  it('trims', () => {
    expect(sanitizeEmail('  foo@bar.com  ')).toBe('foo@bar.com')
  })
})

describe('sanitizeFilename', () => {
  it('replaces unsafe chars with underscore', () => {
    expect(sanitizeFilename('my file/../etc/passwd')).toBe('my_file_.._etc_passwd')
  })

  it('preserves allowed chars (alphanum, dot, underscore, dash)', () => {
    expect(sanitizeFilename('report-2024_v1.pdf')).toBe('report-2024_v1.pdf')
  })

  it('replaces spaces', () => {
    expect(sanitizeFilename('my document.txt')).toBe('my_document.txt')
  })

  it('replaces unicode', () => {
    expect(sanitizeFilename('relatório.pdf')).toBe('relat_rio.pdf')
  })
})
```

- [ ] **Step 2: Run the tests — expect all to pass (these exercise already-implemented code)**

Run:

```bash
npm test -- sanitize
```

Expected: all ~15 tests pass. If any fails, investigate whether the test assertion is wrong or the implementation has a real bug.

- [ ] **Step 3: Commit**

```bash
git add src/utils/sanitize.test.ts
git commit -m "test(utils): add sanitize.ts coverage

XSS vectors, allowed-tag whitelist, email/filename normalization."
```

---

## Task 13: Test — `src/utils/validation.ts`

**Context:** Password validator and strength scorer. Pure functions.

**Files:**
- Create: `src/utils/validation.test.ts`

- [ ] **Step 1: Write tests**

Create `src/utils/validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { validatePassword, getPasswordStrength } from './validation'

describe('validatePassword', () => {
  it('accepts a password meeting all rules', () => {
    expect(validatePassword('Abcdef1!')).toEqual([])
  })

  it('rejects short passwords', () => {
    const errors = validatePassword('Ab1!')
    expect(errors.some((e) => e.includes('mínimo 8'))).toBe(true)
  })

  it('requires uppercase', () => {
    const errors = validatePassword('abcdef1!')
    expect(errors.some((e) => e.toLowerCase().includes('maiúscula'))).toBe(true)
  })

  it('requires lowercase', () => {
    const errors = validatePassword('ABCDEF1!')
    expect(errors.some((e) => e.toLowerCase().includes('minúscula'))).toBe(true)
  })

  it('requires number', () => {
    const errors = validatePassword('Abcdefgh!')
    expect(errors.some((e) => e.toLowerCase().includes('número'))).toBe(true)
  })

  it('requires special char', () => {
    const errors = validatePassword('Abcdefg1')
    expect(errors.some((e) => e.includes('especial'))).toBe(true)
  })

  it('accumulates multiple errors', () => {
    const errors = validatePassword('abc')
    expect(errors.length).toBeGreaterThanOrEqual(3)
  })
})

describe('getPasswordStrength', () => {
  it('returns a label and color for any input', () => {
    const s = getPasswordStrength('')
    expect(s.label).toBeTruthy()
    expect(s.color).toMatch(/^#/)
  })

  it('scores a strong password higher than a weak one', () => {
    const weak = getPasswordStrength('abc')
    const strong = getPasswordStrength('Abcdef123!@#')
    expect(strong.score).toBeGreaterThan(weak.score)
  })

  it('caps score at 5', () => {
    const s = getPasswordStrength('Abcdefghijk1234567!@#$')
    expect(s.score).toBeLessThanOrEqual(5)
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npm test -- validation
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/utils/validation.test.ts
git commit -m "test(utils): add validation.ts coverage

Password rules (length, case, digits, special) and strength scoring."
```

---

## Task 14: Test — `functions/src/rateLimiter.ts`

**Context:** Rate limiter uses Firestore transactions. Test against the Firestore emulator using `firebase-functions-test`. The emulator must be running for these tests.

**Files:**
- Create: `functions/test/rateLimiter.test.ts`
- Create: `functions/test/helpers/firestore.ts`

- [ ] **Step 1: Create firestore test helper**

Create `functions/test/helpers/firestore.ts`:

```typescript
import * as admin from 'firebase-admin'

let initialized = false

export function getAdmin() {
  if (!initialized) {
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: 'adsmart-test' })
    }
    initialized = true
  }
  return admin
}

export async function clearCollection(collectionPath: string) {
  const a = getAdmin()
  const snap = await a.firestore().collection(collectionPath).get()
  const batch = a.firestore().batch()
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}
```

- [ ] **Step 2: Write rate limiter tests**

Create `functions/test/rateLimiter.test.ts`:

```typescript
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import { getAdmin, clearCollection } from './helpers/firestore'

beforeAll(() => {
  getAdmin()
})

describe('checkRateLimit', () => {
  const userId = 'user-rate-limit-test'
  const action = 'recaptcha_verify'

  beforeEach(async () => {
    await clearCollection('rateLimits')
  })

  it('allows the first attempt and creates the document', async () => {
    const { checkRateLimit } = await import('../src/rateLimiter')
    const result = await checkRateLimit(userId, action, 3, 15)
    expect(result).toBe(true)

    const doc = await getAdmin().firestore().collection('rateLimits').doc(`${userId}_${action}`).get()
    expect(doc.exists).toBe(true)
    expect(doc.data()?.attempts).toBe(1)
    expect(doc.data()?.blocked).toBe(false)
  })

  it('increments attempts on subsequent calls within the window', async () => {
    const { checkRateLimit } = await import('../src/rateLimiter')
    await checkRateLimit(userId, action, 3, 15)
    await checkRateLimit(userId, action, 3, 15)
    const doc = await getAdmin().firestore().collection('rateLimits').doc(`${userId}_${action}`).get()
    expect(doc.data()?.attempts).toBe(2)
  })

  it('blocks after maxAttempts reached', async () => {
    const { checkRateLimit } = await import('../src/rateLimiter')
    await checkRateLimit(userId, action, 3, 15)
    await checkRateLimit(userId, action, 3, 15)
    await checkRateLimit(userId, action, 3, 15)

    await expect(checkRateLimit(userId, action, 3, 15)).rejects.toMatchObject({
      code: 'resource-exhausted',
    })

    const doc = await getAdmin().firestore().collection('rateLimits').doc(`${userId}_${action}`).get()
    expect(doc.data()?.blocked).toBe(true)
  })

  it('resets the counter after the window expires', async () => {
    const { checkRateLimit } = await import('../src/rateLimiter')
    const admin = getAdmin()

    // Seed a document with firstAttempt = 20 minutes ago
    const twentyMinAgo = new Date(Date.now() - 20 * 60 * 1000)
    await admin.firestore().collection('rateLimits').doc(`${userId}_${action}`).set({
      attempts: 5,
      firstAttempt: admin.firestore.Timestamp.fromDate(twentyMinAgo),
      lastAttempt: admin.firestore.Timestamp.fromDate(twentyMinAgo),
      blocked: false,
    })

    // Window is 15 minutes, so this call should reset
    const result = await checkRateLimit(userId, action, 5, 15)
    expect(result).toBe(true)

    const doc = await admin.firestore().collection('rateLimits').doc(`${userId}_${action}`).get()
    expect(doc.data()?.attempts).toBe(1)
    expect(doc.data()?.blocked).toBe(false)
  })

  it('keeps blocking while blocked flag is still within window', async () => {
    const { checkRateLimit } = await import('../src/rateLimiter')
    const admin = getAdmin()

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    await admin.firestore().collection('rateLimits').doc(`${userId}_${action}`).set({
      attempts: 5,
      firstAttempt: admin.firestore.Timestamp.fromDate(fiveMinAgo),
      lastAttempt: admin.firestore.Timestamp.fromDate(fiveMinAgo),
      blocked: true,
    })

    await expect(checkRateLimit(userId, action, 5, 15)).rejects.toMatchObject({
      code: 'resource-exhausted',
    })
  })
})
```

- [ ] **Step 3: Start Firestore emulator (manual pre-step)**

In a separate terminal:

```bash
firebase emulators:start --only firestore --project adsmart-test
```

Leave it running during test execution.

- [ ] **Step 4: Run tests**

```bash
cd functions && npm test -- rateLimiter && cd ..
```

Expected: all 5 tests pass.

If tests fail with "FIRESTORE_EMULATOR_HOST not set" — confirm `functions/test/setup.ts` is being loaded.

- [ ] **Step 5: Document emulator requirement**

Add a note to `functions/README.md` (create it if it doesn't exist):

```markdown
# Functions — Development

## Running tests

Some tests require the Firebase emulators. Start them first:

\`\`\`bash
firebase emulators:start --only firestore,auth --project adsmart-test
\`\`\`

Then in another terminal:

\`\`\`bash
npm test
\`\`\`
```

- [ ] **Step 6: Commit**

```bash
git add functions/test/ functions/README.md
git commit -m "test(rateLimiter): add emulator-backed coverage

- First attempt, increment, block at max, window reset, stay blocked
- Requires Firestore emulator running (documented in functions/README.md)"
```

---

## Task 15: Test — `functions/src/adminWalletManager.ts` (authorization only)

**Context:** `addUserCredits` has layered authorization: must be authenticated, must be admin (either via `token.admin` claim or `ADMIN_EMAILS` allowlist), validates input shape, enforces per-transaction and daily limits. Testing the Firestore transaction body requires a heavy setup (users, wallets, auth users). **Focus this task on the authorization guard** — the cheapest, highest-value coverage.

**Files:**
- Create: `functions/test/adminWalletManager.test.ts`

- [ ] **Step 1: Inspect `firebase-functions-test` usage**

`firebase-functions-test` wraps callables for offline testing. Docs: https://firebase.google.com/docs/functions/unit-testing

Install pattern: already in `functions/package.json` as `firebase-functions-test`.

- [ ] **Step 2: Write auth guard tests**

Create `functions/test/adminWalletManager.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import functionsTest from 'firebase-functions-test'

const testEnv = functionsTest()

beforeAll(() => {
  process.env.GCLOUD_PROJECT = 'adsmart-test'
})

describe('addUserCredits — authorization', () => {
  it('rejects unauthenticated callers', async () => {
    const { addUserCredits } = await import('../src/adminWalletManager')
    const wrapped = testEnv.wrap(addUserCredits)

    await expect(
      wrapped({
        data: { targetEmail: 'u@x.com', amount: 1000, reason: 'test reason text' },
        auth: undefined,
      } as any)
    ).rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('rejects non-admin authenticated callers', async () => {
    const { addUserCredits } = await import('../src/adminWalletManager')
    const wrapped = testEnv.wrap(addUserCredits)

    await expect(
      wrapped({
        data: { targetEmail: 'u@x.com', amount: 1000, reason: 'test reason text' },
        auth: {
          uid: 'not-admin',
          token: { email: 'regular@user.com', admin: false },
        },
      } as any)
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('rejects missing targetEmail', async () => {
    const { addUserCredits } = await import('../src/adminWalletManager')
    const wrapped = testEnv.wrap(addUserCredits)

    await expect(
      wrapped({
        data: { amount: 1000, reason: 'test reason text' },
        auth: {
          uid: 'admin',
          token: { email: 'agency.elovisiondigital@gmail.com', admin: true },
        },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects non-positive amount', async () => {
    const { addUserCredits } = await import('../src/adminWalletManager')
    const wrapped = testEnv.wrap(addUserCredits)

    await expect(
      wrapped({
        data: { targetEmail: 'u@x.com', amount: 0, reason: 'test reason text' },
        auth: {
          uid: 'admin',
          token: { email: 'agency.elovisiondigital@gmail.com', admin: true },
        },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects amount above per-transaction cap', async () => {
    const { addUserCredits } = await import('../src/adminWalletManager')
    const wrapped = testEnv.wrap(addUserCredits)

    await expect(
      wrapped({
        data: { targetEmail: 'u@x.com', amount: 100001, reason: 'test reason text' },
        auth: {
          uid: 'admin',
          token: { email: 'agency.elovisiondigital@gmail.com', admin: true },
        },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects reason shorter than 10 chars', async () => {
    const { addUserCredits } = await import('../src/adminWalletManager')
    const wrapped = testEnv.wrap(addUserCredits)

    await expect(
      wrapped({
        data: { targetEmail: 'u@x.com', amount: 1000, reason: 'short' },
        auth: {
          uid: 'admin',
          token: { email: 'agency.elovisiondigital@gmail.com', admin: true },
        },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('accepts admin via `token.admin` claim even if email not in allowlist', async () => {
    const { addUserCredits } = await import('../src/adminWalletManager')
    const wrapped = testEnv.wrap(addUserCredits)

    // Will fail later in the flow (user lookup in emulator) but NOT with permission-denied
    await expect(
      wrapped({
        data: { targetEmail: 'nonexistent@x.com', amount: 1000, reason: 'test reason text' },
        auth: {
          uid: 'admin',
          token: { email: 'any@any.com', admin: true },
        },
      } as any)
    ).rejects.not.toMatchObject({ code: 'permission-denied' })
  })
})
```

- [ ] **Step 3: Run tests**

```bash
cd functions && npm test -- adminWalletManager && cd ..
```

Expected: all 7 tests pass.

- [ ] **Step 4: Commit**

```bash
git add functions/test/adminWalletManager.test.ts
git commit -m "test(adminWalletManager): add authorization coverage

Covers unauthenticated, non-admin, input validation (missing email,
non-positive amount, over per-tx cap, short reason), and admin claim
acceptance. Wallet transaction body not tested here — requires full
user/auth emulator setup, tracked for later."
```

---

## Task 16: Test — Firestore security rules

**Context:** Use `@firebase/rules-unit-testing` to test `firestore.rules` against the emulator without calling any function code. Covers the most important rules: ownership on `users/{uid}/**`, write-blocked collections (`productPrices`, `systemConfig`, `reportTemplates`, `securityLogs`, `backupMetadata`), campaign ownership.

**Files:**
- Create: `functions/test/firestore-rules.test.ts`

- [ ] **Step 1: Write rules tests**

Create `functions/test/firestore-rules.test.ts`:

```typescript
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { setDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'adsmart-rules-test',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
})

describe('users/{userId}', () => {
  it('owner can read their doc', async () => {
    const uid = 'u1'
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${uid}`), {
        email: 'u1@x.com',
        createdAt: new Date(),
      })
    })
    const db = env.authenticatedContext(uid).firestore()
    await assertSucceeds(getDoc(doc(db, `users/${uid}`)))
  })

  it('stranger cannot read someone else doc', async () => {
    const uid = 'u1'
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${uid}`), {
        email: 'u1@x.com',
        createdAt: new Date(),
      })
    })
    const db = env.authenticatedContext('stranger').firestore()
    await assertFails(getDoc(doc(db, `users/${uid}`)))
  })

  it('creating user with valid fields succeeds', async () => {
    const uid = 'u1'
    const db = env.authenticatedContext(uid).firestore()
    await assertSucceeds(
      setDoc(doc(db, `users/${uid}`), {
        email: 'u1@x.com',
        createdAt: serverTimestamp(),
      })
    )
  })

  it('creating user with invalid email fails', async () => {
    const uid = 'u1'
    const db = env.authenticatedContext(uid).firestore()
    await assertFails(
      setDoc(doc(db, `users/${uid}`), {
        email: 'not-an-email',
        createdAt: serverTimestamp(),
      })
    )
  })

  it('deleting own user doc is blocked', async () => {
    const uid = 'u1'
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${uid}`), {
        email: 'u1@x.com',
        createdAt: new Date(),
      })
    })
    const db = env.authenticatedContext(uid).firestore()
    const { deleteDoc } = await import('firebase/firestore')
    await assertFails(deleteDoc(doc(db, `users/${uid}`)))
  })
})

describe('client-write-blocked collections', () => {
  const blocked = [
    'productPrices/p1',
    'reportTemplates/t1',
    'systemConfig/c1',
    'securityLogs/l1',
    'backupMetadata/b1',
  ]

  for (const path of blocked) {
    it(`write to ${path} is blocked even for authenticated users`, async () => {
      const db = env.authenticatedContext('u1').firestore()
      await assertFails(setDoc(doc(db, path), { any: 'value' }))
    })
  }

  it('authenticated user CAN read productPrices', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'productPrices/p1'), { price: 10 })
    })
    const db = env.authenticatedContext('u1').firestore()
    await assertSucceeds(getDoc(doc(db, 'productPrices/p1')))
  })

  it('securityLogs read is ALSO blocked for authenticated users', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'securityLogs/l1'), { any: 'value' })
    })
    const db = env.authenticatedContext('u1').firestore()
    await assertFails(getDoc(doc(db, 'securityLogs/l1')))
  })
})

describe('campaigns/{id}', () => {
  it('owner reads their campaign', async () => {
    const uid = 'u1'
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'campaigns/c1'), {
        userId: uid,
        name: 'C',
        budget: 0,
        status: 'draft',
        createdAt: new Date(),
      })
    })
    const db = env.authenticatedContext(uid).firestore()
    await assertSucceeds(getDoc(doc(db, 'campaigns/c1')))
  })

  it('non-owner cannot read someone else campaign', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'campaigns/c1'), {
        userId: 'owner',
        name: 'C',
        budget: 0,
        status: 'draft',
        createdAt: new Date(),
      })
    })
    const db = env.authenticatedContext('stranger').firestore()
    await assertFails(getDoc(doc(db, 'campaigns/c1')))
  })
})
```

- [ ] **Step 2: Ensure firebase client SDK is available in functions test scope**

In `functions/`, install:

```bash
cd functions && npm install --save-dev firebase && cd ..
```

- [ ] **Step 3: Start Firestore emulator (if not already running)**

```bash
firebase emulators:start --only firestore --project adsmart-rules-test
```

- [ ] **Step 4: Run tests**

```bash
cd functions && npm test -- firestore-rules && cd ..
```

Expected: all ~13 tests pass. If any FAIL, that's a security rule bug — record it for Fase 3 (Security) and either tighten the test to reflect actual behavior or add a TODO comment for the rule fix.

Likely finding: `rateLimits` collection rule is loose (user can write). We'll document this as a Fase 3 fix (already in spec) — no test written here yet.

- [ ] **Step 5: Commit**

```bash
git add functions/test/firestore-rules.test.ts functions/package.json functions/package-lock.json
git commit -m "test(rules): add Firestore security rules coverage

- Owner-only read/write on users/{uid}
- Invalid email, disallowed delete
- Write-blocked collections (productPrices, reportTemplates, systemConfig,
  securityLogs, backupMetadata) including read-blocked securityLogs
- Campaign ownership
Requires Firestore emulator."
```

---

## Task 17: Test — `functions/src/googleAdsOAuthV2.ts` (state token validation)

**Context:** The V2 OAuth callback validates an anti-CSRF state token stored in `oauth_states` Firestore collection. Tests: missing state, invalid state, state belonging to another user, expired state. External HTTP calls (axios to Google token endpoint) are mocked.

**Files:**
- Create: `functions/test/googleAdsOAuthV2.test.ts`

- [ ] **Step 1: Write state validation tests**

Create `functions/test/googleAdsOAuthV2.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import functionsTest from 'firebase-functions-test'
import { getAdmin } from './helpers/firestore'

const testEnv = functionsTest()

beforeAll(() => {
  process.env.GCLOUD_PROJECT = 'adsmart-test'
})

afterAll(() => {
  testEnv.cleanup()
})

beforeEach(async () => {
  const admin = getAdmin()
  const snap = await admin.firestore().collection('oauth_states').get()
  await Promise.all(snap.docs.map((d) => d.ref.delete()))
})

describe('handleGoogleAdsCallbackWithSelection — state validation', () => {
  it('rejects unauthenticated callers', async () => {
    const { handleGoogleAdsCallbackWithSelection } = await import('../src/googleAdsOAuthV2')
    const wrapped = testEnv.wrap(handleGoogleAdsCallbackWithSelection)

    await expect(
      wrapped({ data: { code: 'x', state: 'y' }, auth: undefined } as any)
    ).rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('rejects missing code', async () => {
    const { handleGoogleAdsCallbackWithSelection } = await import('../src/googleAdsOAuthV2')
    const wrapped = testEnv.wrap(handleGoogleAdsCallbackWithSelection)

    await expect(
      wrapped({ data: { state: 'y' }, auth: { uid: 'u1', token: {} } } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects missing state', async () => {
    const { handleGoogleAdsCallbackWithSelection } = await import('../src/googleAdsOAuthV2')
    const wrapped = testEnv.wrap(handleGoogleAdsCallbackWithSelection)

    await expect(
      wrapped({ data: { code: 'x' }, auth: { uid: 'u1', token: {} } } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects state not present in Firestore', async () => {
    const { handleGoogleAdsCallbackWithSelection } = await import('../src/googleAdsOAuthV2')
    const wrapped = testEnv.wrap(handleGoogleAdsCallbackWithSelection)

    await expect(
      wrapped({
        data: { code: 'x', state: 'does-not-exist' },
        auth: { uid: 'u1', token: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects state belonging to another user', async () => {
    const admin = getAdmin()
    await admin.firestore().collection('oauth_states').doc('state-x').set({
      userId: 'OTHER_USER',
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
    })

    const { handleGoogleAdsCallbackWithSelection } = await import('../src/googleAdsOAuthV2')
    const wrapped = testEnv.wrap(handleGoogleAdsCallbackWithSelection)

    await expect(
      wrapped({
        data: { code: 'x', state: 'state-x' },
        auth: { uid: 'u1', token: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('rejects expired state', async () => {
    const admin = getAdmin()
    await admin.firestore().collection('oauth_states').doc('state-x').set({
      userId: 'u1',
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 60 * 1000)),
    })

    const { handleGoogleAdsCallbackWithSelection } = await import('../src/googleAdsOAuthV2')
    const wrapped = testEnv.wrap(handleGoogleAdsCallbackWithSelection)

    await expect(
      wrapped({
        data: { code: 'x', state: 'state-x' },
        auth: { uid: 'u1', token: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'deadline-exceeded' })
  })
})
```

- [ ] **Step 2: Run tests**

```bash
cd functions && npm test -- googleAdsOAuthV2 && cd ..
```

Expected: all 6 tests pass. (Emulator must be running.)

- [ ] **Step 3: Commit**

```bash
git add functions/test/googleAdsOAuthV2.test.ts
git commit -m "test(googleAdsOAuthV2): add state CSRF validation coverage

- Unauthenticated rejected
- Missing code/state rejected
- Unknown state rejected (invalid-argument)
- State from another user rejected (permission-denied)
- Expired state rejected (deadline-exceeded)
Token-exchange/HTTP paths not tested here — tracked for later."
```

---

## Task 18: Test — `functions/src/metaAdsOAuthV2.ts` (state token validation)

**Context:** Mirror of Task 17 for Meta Ads. Implementation likely identical in structure.

**Files:**
- Create: `functions/test/metaAdsOAuthV2.test.ts`

- [ ] **Step 1: Inspect `metaAdsOAuthV2.ts` briefly**

Read the first ~80 lines of `functions/src/metaAdsOAuthV2.ts` and confirm:
- The exported handler name is `handleMetaAdsCallbackWithSelection`
- It uses `oauth_states` collection (or document the actual name if different)
- Error codes thrown match `invalid-argument` / `permission-denied` / `deadline-exceeded`

If anything differs from the Google Ads version, adapt assertions in Step 2 accordingly.

- [ ] **Step 2: Write tests**

Create `functions/test/metaAdsOAuthV2.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import functionsTest from 'firebase-functions-test'
import { getAdmin } from './helpers/firestore'

const testEnv = functionsTest()

beforeAll(() => {
  process.env.GCLOUD_PROJECT = 'adsmart-test'
})

afterAll(() => {
  testEnv.cleanup()
})

// NOTE: if Meta uses a different collection (e.g., 'meta_oauth_states'),
// adjust STATE_COLLECTION here and in all tests below.
const STATE_COLLECTION = 'oauth_states'

beforeEach(async () => {
  const admin = getAdmin()
  const snap = await admin.firestore().collection(STATE_COLLECTION).get()
  await Promise.all(snap.docs.map((d) => d.ref.delete()))
})

describe('handleMetaAdsCallbackWithSelection — state validation', () => {
  it('rejects unauthenticated callers', async () => {
    const { handleMetaAdsCallbackWithSelection } = await import('../src/metaAdsOAuthV2')
    const wrapped = testEnv.wrap(handleMetaAdsCallbackWithSelection)

    await expect(
      wrapped({ data: { code: 'x', state: 'y' }, auth: undefined } as any)
    ).rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('rejects missing code', async () => {
    const { handleMetaAdsCallbackWithSelection } = await import('../src/metaAdsOAuthV2')
    const wrapped = testEnv.wrap(handleMetaAdsCallbackWithSelection)

    await expect(
      wrapped({ data: { state: 'y' }, auth: { uid: 'u1', token: {} } } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects missing state', async () => {
    const { handleMetaAdsCallbackWithSelection } = await import('../src/metaAdsOAuthV2')
    const wrapped = testEnv.wrap(handleMetaAdsCallbackWithSelection)

    await expect(
      wrapped({ data: { code: 'x' }, auth: { uid: 'u1', token: {} } } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects state not present in Firestore', async () => {
    const { handleMetaAdsCallbackWithSelection } = await import('../src/metaAdsOAuthV2')
    const wrapped = testEnv.wrap(handleMetaAdsCallbackWithSelection)

    await expect(
      wrapped({
        data: { code: 'x', state: 'does-not-exist' },
        auth: { uid: 'u1', token: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects state belonging to another user', async () => {
    const admin = getAdmin()
    await admin.firestore().collection(STATE_COLLECTION).doc('state-x').set({
      userId: 'OTHER_USER',
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
    })

    const { handleMetaAdsCallbackWithSelection } = await import('../src/metaAdsOAuthV2')
    const wrapped = testEnv.wrap(handleMetaAdsCallbackWithSelection)

    await expect(
      wrapped({
        data: { code: 'x', state: 'state-x' },
        auth: { uid: 'u1', token: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('rejects expired state', async () => {
    const admin = getAdmin()
    await admin.firestore().collection(STATE_COLLECTION).doc('state-x').set({
      userId: 'u1',
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 60 * 1000)),
    })

    const { handleMetaAdsCallbackWithSelection } = await import('../src/metaAdsOAuthV2')
    const wrapped = testEnv.wrap(handleMetaAdsCallbackWithSelection)

    await expect(
      wrapped({
        data: { code: 'x', state: 'state-x' },
        auth: { uid: 'u1', token: {} },
      } as any)
    ).rejects.toMatchObject({ code: 'deadline-exceeded' })
  })
})
```

If Step 1 inspection revealed that Meta OAuth has a different error code pattern or state collection name, adjust the `STATE_COLLECTION` constant and error codes accordingly before running.

- [ ] **Step 3: Run tests**

```bash
cd functions && npm test -- metaAdsOAuthV2 && cd ..
```

Expected: all tests pass (adjust if Meta has fewer checks).

- [ ] **Step 4: Commit**

```bash
git add functions/test/metaAdsOAuthV2.test.ts
git commit -m "test(metaAdsOAuthV2): add state CSRF validation coverage

Mirrors googleAdsOAuthV2 coverage (unauthenticated, missing input,
unknown state, state from other user, expired state)."
```

---

## Task 19: Final validation and push

- [ ] **Step 1: Full local suite**

Run:

```bash
npm run lint && npm run type-check && npm run build && npm test
cd functions && npm run lint && npm run build && npm test && cd ..
```

Expected: everything green.

- [ ] **Step 2: Check coverage report**

Run:

```bash
npm run test:coverage
```

Expected: coverage of `src/utils/` > 80%.

Run:

```bash
cd functions && npm run test:coverage && cd ..
```

Expected: `rateLimiter.ts` > 80%, `adminWalletManager.ts` > 40% (guard only), `googleAdsOAuthV2.ts` + `metaAdsOAuthV2.ts` > 30% (state-validation only).

- [ ] **Step 3: Verify git log is clean**

Run:

```bash
git log --oneline -25
```

Expected: ~18 commits from Fase 1 with clear scoped messages (`chore:`, `refactor:`, `test:`, `ci:`).

- [ ] **Step 4: Push to remote (if remote exists)**

Run:

```bash
git remote -v
```

If a remote is configured:

```bash
git push origin migrate
```

If no remote: skip — commits stay local.

- [ ] **Step 5: Confirm CI status (if pushed)**

Wait ~2 min, then:

```bash
gh run list --branch migrate --limit 1
```

Expected: run succeeds.

---

## Self-Review Notes

**Spec coverage check:**

- ✅ 3.1 Limpeza — Tasks 1-5
- ✅ 3.2 i18n quebra — Task 6
- ✅ 3.3 Biome — Task 7
- ✅ 3.3 lefthook — Task 8
- ✅ 3.3 GitHub Actions — Task 9
- ✅ 3.3 Vitest scaffolding — Tasks 10, 11
- ✅ 3.4 sanitize, validation — Tasks 12, 13
- ✅ 3.4 rate limiter — Task 14
- ✅ 3.4 admin guard — Task 15 (guard only, not full transaction)
- ✅ 3.4 Firestore rules — Task 16
- ✅ 3.4 OAuth V2 Google + Meta — Tasks 17, 18 (state-validation only, not token exchange)

**Out of scope (documented):**
- Full wallet transaction test in Task 15 (too heavy for this phase — deferred)
- OAuth token-exchange mocking in Tasks 17/18 (deferred)
- `rateLimits` rules tightening (Fase 3)

**Placeholder scan:** no `TBD`, no `TODO`, no "add appropriate error handling" — all steps have concrete commands or code.

**Type consistency check:** `Translations` type defined in Task 6, consumed by `LanguageContext.tsx` rewrite in same task. Test file imports match the exports they assert against (`checkRateLimit`, `addUserCredits`, `handleGoogleAdsCallbackWithSelection`, `handleMetaAdsCallbackWithSelection`).
