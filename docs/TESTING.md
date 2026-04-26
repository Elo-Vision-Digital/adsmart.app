# Testing

## Framework

Vitest 4.x in both the frontend (root) and Cloud Functions (`functions/`).

## Running tests

```bash
# Frontend
bun run test               # run once
bun run test:watch         # watch mode
bun run test:coverage      # coverage report to coverage/

# Functions
cd functions
bun run test
bun run test:watch
bun run test:coverage

# Both workspaces in parallel via Turbo
bun run test:all
```

## Test layout

```
src/
  components/
    AdminRoute.test.tsx     # AdminRoute component
    ...
  schemas/
    report.test.ts          # Zod schema tests, one per schema
    adAccount.test.ts
    campaign.test.ts
    userWallet.test.ts
    transaction.test.ts
    firestore-converter.test.ts
functions/
  test/
    securityLogger.test.ts
    googleAdsOAuthV2.test.ts
    metaAdsOAuthV2.test.ts
    firestore-rules.test.ts
    rateLimiter.test.ts
    adminWalletManager.test.ts
    helpers/
      firestore.ts          # getAdmin(), clearCollection() helpers
```

Frontend tests co-locate with source files (`*.test.tsx` next to `*.tsx`). Zod schemas in `src/schemas/` follow the same convention — tests live alongside the schema they cover (e.g., `report.test.ts` next to `report.ts`), not in a `__tests__/` subfolder.

Functions tests live in `functions/test/` because they require emulator setup.

## Emulator requirements for functions tests

Functions tests hit real Firebase emulators:
- Firestore emulator must be running on port 8080 (`FIRESTORE_EMULATOR_HOST=localhost:8080`)
- Auth emulator must be running on port 9099 (`FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`)

Start emulators before running functions tests:
```bash
bunx firebase emulators:start --only firestore,auth
```

Or run functions tests via the serve script which starts emulators automatically:
```bash
# From functions/
bun run serve
# In another terminal:
bun run test
```

## Test coverage areas and counts (as of Phase 3)

| File | Tests | Coverage area |
|---|---|---|
| `AdminRoute.test.tsx` | 3 | Unauthenticated redirect, non-admin redirect, admin access |
| `securityLogger.test.ts` | 3 | Re-entrancy guard, normal event write, CRITICAL alert write |
| `googleAdsOAuthV2.test.ts` | ~10 | Auth check, CSRF validation, state expiry, semantic error codes |
| `metaAdsOAuthV2.test.ts` | ~10 | Same as Google Ads V2 |
| `firestore-rules.test.ts` | ~15 | All collection rules: owner-only, wallet/transactions blocked, rateLimits blocked |
| `rateLimiter.test.ts` | ~5 | First attempt, window reset, block after max attempts |
| `adminWalletManager.test.ts` | ~5 | Admin check, input validation, wallet mutation |

Total: 44 functions tests, 31 web tests as of Phase 3.

## Mocking approach

### Frontend tests

Use `vi.spyOn` to mock context hooks:

```typescript
import * as AuthContextModule from '@/contexts/AuthContext'

vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
  user: { uid: 'test-user' } as User,
  isAdmin: true,
  loading: false,
  // ...other fields
})
```

Do not mock Firebase directly — mock the hooks that consume Firebase.

### Functions tests

Functions tests do NOT mock the database — they hit the Firestore emulator with real reads/writes. This prevents the mocked-tests-pass/prod-fails problem.

`functions/test/helpers/firestore.ts` exports:
- `getAdmin()` — returns initialized `firebase-admin` instance pointed at emulators
- `clearCollection(collectionName)` — deletes all docs in a collection (use in `beforeEach`)

## Firestore rules testing

`firestore-rules.test.ts` uses `@firebase/rules-unit-testing`:

```typescript
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'

const testEnv = await initializeTestEnvironment({
  projectId: 'demo-adsmart',
  firestore: {
    rules: readFileSync('firestore.rules', 'utf8'),
    host: 'localhost',
    port: 8080,
  }
})

// Authenticated context
const userCtx = testEnv.authenticatedContext('user-uid')
const db = userCtx.firestore()

await assertSucceeds(db.doc('users/user-uid').get())
await assertFails(db.doc('users/other-uid').get())
```

Always call `testEnv.cleanup()` in `afterAll`.

## Writing new tests

1. **New Cloud Function** → add test file in `functions/test/`. Cover: auth check, input validation, happy path, error path.
2. **New Firestore rule** → add cases to `firestore-rules.test.ts`. Test both `assertSucceeds` and `assertFails`.
3. **New React component** → add `ComponentName.test.tsx` next to the component. Test: renders correctly, interaction (if any), edge cases.

Coverage target: 80%+ in test-covered areas (not project-wide coverage).

## CI

Tests do not run in CI currently (Phase 1 only set up lint + typecheck + build). Adding tests to CI is part of Phase 2 scope.
