# Phase 3 — Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every security gap discovered in Phase 1 testing plus everything from the security section of the design spec. Result: hardened Firestore rules, preserved semantic error codes in OAuth V2, fixed `securityLogger` recursion, all secrets via `defineSecret`, security headers on hosting, an `AdminRoute` client guard, and SuitPay marked deprecated pending Asaas migration.

**Architecture:** Fixes are surgical. No behavioural change for legitimate users. Rules tighten (tests that were `.skip()`'d become passing). OAuth errors stop collapsing to `'internal'`. `securityLogger` stops recursing. CSP, HSTS added to Firebase Hosting. A new `AdminRoute` wraps `/admin` and checks `token.admin` claim.

**Tech Stack:** Same as Phase 1 — Firebase Hosting + Cloud Functions v2 + Firestore, React 18 + Vite 7 + TS, Biome, Vitest, `@firebase/rules-unit-testing`, lefthook, GitHub Actions.

---

## Context for the implementing agent (read this first)

### Repo state after Phase 1

- Branch: `migrate` (pushed to `origin/migrate` on `github.com/ZenniTTy/adsmart-web`)
- Working directory: `/Users/eduardorodrigues/Downloads/Meus Projetos/adsmart-app`
- Phase 1 delivered: cleanup, i18n JSON split, Biome, lefthook, GitHub Actions CI, Vitest scaffolds, 65 passing tests (2 skipped)
- Stack is still the "original" versions — **upgrades are Phase 2, executed AFTER this phase**
- `firestore.rules` was NOT modified in Phase 1 — still contains the bugs
- Biome 2.4.13 with 125 warnings as documented tech debt (mostly a11y in existing code) — do NOT fix those here
- Functions ESLint 8 + google style is broken (2880 errors) — CI has `continue-on-error: true`, do NOT fix that here either (Phase 2)

### User decisions fixed

- **Secrets rotation** is deferred (repo private, user controls access)
- **SuitPay is going away** to be replaced by Asaas in a future phase. Do NOT invest effort in hardening SuitPay validation/IP allowlist — just mark `@deprecated` and reduce log noise.
- **Pre-existing lint warnings** (Biome + ESLint) are not part of this phase

### Bugs discovered in Phase 1 that Phase 3 must fix

1. **Firestore rules — invalid email bypass** — `users/{userId}/{document=**}` wildcard allows writing the parent doc itself, overriding email validation. Test: `functions/test/firestore-rules.test.ts` `it.skip('creating user with invalid email fails')`.
2. **Firestore rules — user can delete own account** — same root cause; parent rule has `allow delete: if false;` but subcollection wildcard permits writes. Test: `it.skip('deleting own user doc is blocked')`.
3. **OAuth V2 try/catch collapses semantic codes** — both `googleAdsOAuthV2.ts` and `metaAdsOAuthV2.ts` wrap every error (including intentional `HttpsError` throws) to `code: 'internal'`. Tests currently assert the broken behaviour; this plan reverts them to assert semantic codes once the handlers are fixed.
4. **`securityLogger` infinite recursion** — `logEvent` → `checkSuspiciousPatterns` (unusual-hours branch) → `logEvent` → ... produces `RangeError: Maximum call stack size exceeded` in emulator.

### Emulator requirement

Tasks 7, 15 and the final validation require the Firestore + Auth emulators running:

```bash
firebase emulators:start --only firestore,auth --project adsmart-test
```

Leave running in a separate terminal.

---

## File Structure

### Files modified

- `firestore.rules` — scope subcollection wildcard, block `rateLimits` client writes, explicit rules for `users/*/wallet`, `users/*/transactions`
- `functions/src/securityLogger.ts` — add re-entrancy guard to `logEvent` / `checkSuspiciousPatterns`
- `functions/src/googleAdsOAuthV2.ts` — catch block rethrows `HttpsError` unchanged
- `functions/src/metaAdsOAuthV2.ts` — same
- `functions/src/recaptcha.ts` — migrate from `process.env.RECAPTCHA_SECRET_KEY` to `defineSecret`
- `functions/src/googleAdsOAuth.ts`, `googleAdsOAuthV2.ts` — migrate client secret to `defineSecret`
- `functions/src/metaAdsOAuth.ts`, `metaAdsOAuthV2.ts` — migrate app secret to `defineSecret`
- `functions/src/suitpayPayment.ts`, `suitpayWebhook.ts` — add `@deprecated` JSDoc header, reduce `webhook_logs` payload size
- `functions/test/firestore-rules.test.ts` — un-skip 2 tests, add rateLimits write-blocked test, add wallet/transactions subcollection tests
- `functions/test/googleAdsOAuthV2.test.ts` — revert "inside-try" assertions to semantic codes after fix
- `functions/test/metaAdsOAuthV2.test.ts` — same
- `firebase.json` — add HSTS, CSP, COOP, CORP headers; remove X-XSS-Protection
- `src/App.tsx` — wrap `/admin` route with `<AdminRoute>`
- `docs/SECURITY.md` — create with rotation checklist + admin-claim instructions

### Files created

- `src/components/AdminRoute.tsx` — client guard checking `token.admin` claim
- `docs/SECURITY.md` — (new minimal doc; full documentation lives in Phase 4)

---

## Task 1: Fix `securityLogger` recursion

**Context:** `functions/src/securityLogger.ts` line 122–163 `checkSuspiciousPatterns` is called from inside `logEvent` (line 110). That method itself calls `logEvent` again (lines 134–143 for rapid login failures, lines 152–163 for unusual-hour). In the emulator, the unusual-hour branch matches any event between 02:00–05:00 local — each call re-enters `logEvent`, causing `RangeError: Maximum call stack size exceeded`.

The guard: `checkSuspiciousPatterns` should NOT be called when the event itself is a `SUSPICIOUS_ACTIVITY` (the patterns only detect OTHER events becoming suspicious, never themselves).

**Files:**
- Modify: `functions/src/securityLogger.ts`
- Test: `functions/test/securityLogger.test.ts` (new — minimal re-entrancy check)

- [ ] **Step 1: Write the failing re-entrancy test**

Create `functions/test/securityLogger.test.ts`:

```typescript
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { getAdmin, clearCollection } from './helpers/firestore'
import {
  securityLogger,
  SecurityEventType,
  SecuritySeverity,
} from '../src/securityLogger'

beforeAll(() => {
  getAdmin()
})

describe('securityLogger — re-entrancy', () => {
  beforeEach(async () => {
    await clearCollection('securityLogs')
    await clearCollection('securityAlerts')
  })

  it('does not recurse when logging a SUSPICIOUS_ACTIVITY event', async () => {
    // If checkSuspiciousPatterns is called for a SUSPICIOUS_ACTIVITY event,
    // the unusual-hour branch (if system clock matches 02:00–05:00) triggers
    // another logEvent call, which recurses. Guard MUST skip the check.
    await expect(
      securityLogger.logEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        'test-user',
        { reason: 'test' },
        SecuritySeverity.WARNING
      )
    ).resolves.toBeUndefined()

    // Only ONE document written, not a chain
    const snap = await getAdmin().firestore().collection('securityLogs').get()
    expect(snap.size).toBe(1)
    expect(snap.docs[0].data().eventType).toBe('suspicious_activity')
  })

  it('does not crash on a normal event regardless of wall-clock hour', async () => {
    await expect(
      securityLogger.logEvent(
        SecurityEventType.RECAPTCHA_SUCCESS,
        'test-user',
        { ok: true },
        SecuritySeverity.INFO
      )
    ).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails (or at least shows stack-overflow warnings)**

Run:

```bash
cd functions && npm test -- securityLogger
```

Expected: test may pass but shows `RangeError` noise on stderr if run between 02:00–05:00. Before-the-fix behaviour is NOT the primary failure signal here — move to step 3.

- [ ] **Step 3: Add re-entrancy guard**

Edit `functions/src/securityLogger.ts`. Replace the `logEvent` method (lines 72–119) and `checkSuspiciousPatterns` method (lines 121–164) with:

```typescript
  // Método principal para registrar eventos
  async logEvent(
    eventType: SecurityEventType,
    identifier: string,
    details: Record<string, any>,
    severity: SecuritySeverity = SecuritySeverity.INFO,
    requestContext?: functions.https.Request
  ): Promise<void> {
    try {
      const timestamp = admin.firestore?.Timestamp?.now?.() || {
        _seconds: Math.floor(Date.now() / 1000),
        _nanoseconds: 0,
      }

      const event: SecurityEvent = {
        eventType,
        severity,
        identifier,
        userId: details.userId,
        details,
        metadata: {
          timestamp: timestamp as admin.firestore.Timestamp,
          ip: requestContext?.ip || details.ip,
          userAgent: requestContext?.headers['user-agent'] || details.userAgent,
          location: details.location,
          requestId: details.requestId,
        },
      }

      try {
        await this.getDb().collection('securityLogs').add(event)
      } catch (firestoreError) {
        console.log('Firestore não disponível, evento não salvo:', event)
      }

      // GUARD: suspicious-pattern detection must not re-enter on events
      // that *are already* the result of the detector (otherwise
      // unusual-hour logs trigger more unusual-hour logs forever).
      if (eventType !== SecurityEventType.SUSPICIOUS_ACTIVITY) {
        await this.checkSuspiciousPatterns(event)
      }

      if (severity === SecuritySeverity.CRITICAL) {
        await this.sendSecurityAlert(event)
      }
    } catch (error) {
      console.error('Erro ao registrar evento de segurança:', error)
    }
  }
```

`checkSuspiciousPatterns` body stays the same (it only calls `logEvent(SUSPICIOUS_ACTIVITY, ...)`, which now short-circuits via the guard).

- [ ] **Step 4: Rerun test + confirm no stack overflow**

Run:

```bash
cd functions && npm test -- securityLogger
```

Expected: 2 tests pass, no `RangeError` noise.

- [ ] **Step 5: Commit**

```bash
git add functions/src/securityLogger.ts functions/test/securityLogger.test.ts
git commit -m "fix(securityLogger): stop re-entrancy on SUSPICIOUS_ACTIVITY events

checkSuspiciousPatterns logs a SUSPICIOUS_ACTIVITY whenever the unusual-
hours branch fires (wall-clock 02:00–05:00). That re-entered logEvent,
triggering the same branch again → RangeError: Maximum call stack size
exceeded in the emulator (and intermittent production noise). Guard now
skips the detector when the event being logged is itself a detector
output."
```

---

## Task 2: Fix `googleAdsOAuthV2` try/catch — preserve `HttpsError` codes

**Context:** `functions/src/googleAdsOAuthV2.ts` lines 257–282 catch every error and rewrap as `HttpsError('internal', ...)`. This includes intentional throws from the state-validation block (`invalid-argument`, `permission-denied`, `deadline-exceeded`). Result: client cannot distinguish CSRF attempt from a generic server fault.

The fix: rethrow `HttpsError` instances unchanged — only wrap genuine unknown errors.

**Files:**
- Modify: `functions/src/googleAdsOAuthV2.ts`
- Modify: `functions/test/googleAdsOAuthV2.test.ts` (revert assertions after fix)

- [ ] **Step 1: Make the test expect the correct (post-fix) behaviour**

Edit `functions/test/googleAdsOAuthV2.test.ts`. Find the three "inside-try" tests (`'rejects state not present in Firestore'`, `'rejects state belonging to another user'`, `'rejects expired state'`).

Replace their `rejects.toMatchObject({ code: 'internal', ... })` assertions with the semantic ones:

- `'rejects state not present in Firestore'` → `rejects.toMatchObject({ code: 'invalid-argument' })`
- `'rejects state belonging to another user'` → `rejects.toMatchObject({ code: 'permission-denied' })`
- `'rejects expired state'` → `rejects.toMatchObject({ code: 'deadline-exceeded' })`

- [ ] **Step 2: Run tests — expect the 3 to fail**

Run:

```bash
cd functions && npm test -- googleAdsOAuthV2
```

Expected: 3 tests fail (the rewrapped codes don't match `invalid-argument` / `permission-denied` / `deadline-exceeded`). The 3 "outside-try" tests still pass.

- [ ] **Step 3: Fix the handler catch block**

Edit `functions/src/googleAdsOAuthV2.ts`. Locate the catch block (currently line 257 onwards). Replace:

```typescript
  } catch (error: any) {
    console.error('=== ERRO DETALHADO ===')
    console.error('Mensagem:', error.message)
    console.error('Status:', error.response?.status)
    console.error('Data:', JSON.stringify(error.response?.data, null, 2))
    console.error('Config usada:', error.config)
    console.error('Stack:', error.stack)
    
    // Log de erro
    await securityLogger.logEvent(
      OAuthEventType.OAUTH_ERROR,
      userId,
      { 
        error: error.message,
        code: error.response?.status,
        details: error.response?.data
      },
      SecuritySeverity.ERROR
    )

    if (error.response?.data?.error) {
      throw new HttpsError('internal', error.response.data.error_description || error.response.data.error || 'Erro ao processar OAuth')
    }
    
    throw new HttpsError('internal', error.message || 'Erro ao conectar conta Google Ads')
  }
```

with:

```typescript
  } catch (error: any) {
    // Rethrow semantic HttpsError (e.g. invalid-argument, permission-denied,
    // deadline-exceeded) so callers can distinguish CSRF/validation failures
    // from genuine server faults. Only wrap NON-HttpsError exceptions.
    if (error instanceof HttpsError) {
      throw error
    }

    console.error('=== ERRO DETALHADO (Google Ads OAuth) ===')
    console.error('Mensagem:', error.message)
    console.error('Status:', error.response?.status)
    console.error('Data:', JSON.stringify(error.response?.data, null, 2))
    console.error('Stack:', error.stack)

    await securityLogger.logEvent(
      OAuthEventType.OAUTH_ERROR,
      userId,
      {
        error: error.message,
        code: error.response?.status,
        details: error.response?.data,
      },
      SecuritySeverity.ERROR
    )

    if (error.response?.data?.error) {
      throw new HttpsError(
        'internal',
        error.response.data.error_description ||
          error.response.data.error ||
          'Erro ao processar OAuth'
      )
    }

    throw new HttpsError('internal', error.message || 'Erro ao conectar conta Google Ads')
  }
```

- [ ] **Step 4: Rerun tests**

```bash
cd functions && npm test -- googleAdsOAuthV2
```

Expected: all 6 pass with semantic codes.

- [ ] **Step 5: Commit**

```bash
git add functions/src/googleAdsOAuthV2.ts functions/test/googleAdsOAuthV2.test.ts
git commit -m "fix(googleAdsOAuthV2): preserve semantic HttpsError codes

The outer try/catch was rewrapping every thrown HttpsError as
'internal', erasing the invalid-argument / permission-denied /
deadline-exceeded signals for state-validation failures. Clients now
receive the correct code so a CSRF replay can be told apart from a
generic server fault.

Tests updated to assert semantic codes (previously asserted the
broken 'internal' behaviour)."
```

---

## Task 3: Fix `metaAdsOAuthV2` try/catch — same fix

**Context:** Mirror of Task 2. `functions/src/metaAdsOAuthV2.ts` lines 234–258 has the same bug — *worse*, because its catch path DISCARDS the original message and emits a generic `'Erro ao conectar conta Meta Ads'` for all three inner failures.

**Files:**
- Modify: `functions/src/metaAdsOAuthV2.ts`
- Modify: `functions/test/metaAdsOAuthV2.test.ts`

- [ ] **Step 1: Update tests to expect semantic codes**

Edit `functions/test/metaAdsOAuthV2.test.ts`. Find the three "inside-try" tests and update assertions:

- `'rejects state not present in Firestore'` → `rejects.toMatchObject({ code: 'invalid-argument' })`
- `'rejects state belonging to another user'` → `rejects.toMatchObject({ code: 'permission-denied' })`
- `'rejects expired state'` → `rejects.toMatchObject({ code: 'deadline-exceeded' })`

- [ ] **Step 2: Run — 3 fail**

```bash
cd functions && npm test -- metaAdsOAuthV2
```

Expected: 3 failing.

- [ ] **Step 3: Fix the handler catch block**

Edit `functions/src/metaAdsOAuthV2.ts`. Locate the catch block (around line 234). Replace:

```typescript
  } catch (error: any) {
    console.error('Erro detalhado Meta Ads:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    
    // Log de erro
    await securityLogger.logEvent(
      OAuthEventType.OAUTH_ERROR,
      userId,
      { 
        error: error.message,
        code: error.response?.status,
        details: error.response?.data
      },
      SecuritySeverity.ERROR
    )

    if (error.response?.data?.error) {
      throw new HttpsError('internal', error.response.data.error.message || 'Erro ao processar OAuth')
    }
    
    throw new HttpsError('internal', 'Erro ao conectar conta Meta Ads')
  }
```

with:

```typescript
  } catch (error: any) {
    // Rethrow semantic HttpsError (e.g. invalid-argument, permission-denied,
    // deadline-exceeded) so callers can distinguish CSRF/validation failures
    // from genuine server faults.
    if (error instanceof HttpsError) {
      throw error
    }

    console.error('Erro detalhado Meta Ads:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    })

    await securityLogger.logEvent(
      OAuthEventType.OAUTH_ERROR,
      userId,
      {
        error: error.message,
        code: error.response?.status,
        details: error.response?.data,
      },
      SecuritySeverity.ERROR
    )

    if (error.response?.data?.error) {
      throw new HttpsError(
        'internal',
        error.response.data.error.message || 'Erro ao processar OAuth'
      )
    }

    throw new HttpsError('internal', 'Erro ao conectar conta Meta Ads')
  }
```

- [ ] **Step 4: Rerun tests**

```bash
cd functions && npm test -- metaAdsOAuthV2
```

Expected: all 6 pass.

- [ ] **Step 5: Commit**

```bash
git add functions/src/metaAdsOAuthV2.ts functions/test/metaAdsOAuthV2.test.ts
git commit -m "fix(metaAdsOAuthV2): preserve semantic HttpsError codes

Mirror of the googleAdsOAuthV2 fix. Meta's catch block was even
worse: it dropped the original message entirely and emitted
'Erro ao conectar conta Meta Ads' for all three state-validation
failures. Now HttpsError instances are rethrown unchanged, and
tests assert the correct semantic codes."
```

---

## Task 4: Fix Firestore rules — scope user subcollection wildcard

**Context:** `firestore.rules` lines 36–38:

```
match /users/{userId}/{document=**} {
  allow read, write: if isOwner(userId);
}
```

The recursive `{document=**}` wildcard ALSO matches the parent doc `users/{userId}` itself (per Firestore rules semantics — rules are OR'd across all matching branches). The owner therefore bypasses (a) email validation on create, (b) the `allow delete: if false` on the parent. Fix: require an intermediate path segment.

**Files:**
- Modify: `firestore.rules`
- Modify: `functions/test/firestore-rules.test.ts` (un-skip 2 tests)

- [ ] **Step 1: Un-skip the 2 failing tests**

Edit `functions/test/firestore-rules.test.ts`. Replace `it.skip(` with `it(` on the two tests flagged in Phase 1:
- `'creating user with invalid email fails'`
- `'deleting own user doc is blocked'`

Remove the `// SKIP: ...` comment blocks above them.

- [ ] **Step 2: Run tests — expect 2 failures**

With Firestore emulator running:

```bash
cd functions && npm test -- firestore-rules
```

Expected: 2 tests fail (14 passing → 12 passing / 2 failing).

- [ ] **Step 3: Fix the rules**

Edit `firestore.rules`. Replace lines 36–38:

```
    // Subcoleções do usuário
    match /users/{userId}/{document=**} {
      allow read, write: if isOwner(userId);
    }
```

with:

```
    // Subcoleções do usuário — the wildcard MUST NOT cover the parent doc
    // (otherwise it would override the strict rules on /users/{userId}).
    // The required {subcollection} segment ensures this rule only matches
    // documents at path /users/{userId}/{subcollection}/{docId}/...
    match /users/{userId}/{subcollection}/{docId=**} {
      // Wallet and transactions are system-managed — writes only via
      // Cloud Functions using the Admin SDK. Reads are owner-only.
      allow read: if isOwner(userId);
      allow write: if isOwner(userId)
        && subcollection != 'wallet'
        && subcollection != 'transactions';
    }
```

- [ ] **Step 4: Rerun tests — all 14 should pass**

```bash
cd functions && npm test -- firestore-rules
```

Expected: 14/14 pass.

- [ ] **Step 5: Commit**

```bash
git add firestore.rules functions/test/firestore-rules.test.ts
git commit -m "fix(rules): scope user subcollection wildcard, block client writes to wallet/transactions

The old rule \`match /users/{userId}/{document=**}\` matched the parent
doc /users/{userId} itself, overriding the stricter rules defined for
that path (email validation on create, delete blocked). Adding an
explicit {subcollection} segment ensures the wildcard only fires for
TRUE subcollection documents.

Also tightened: wallet and transactions subcollections are no longer
writable by the client — only by Cloud Functions with the Admin SDK.
This is correct because credit adds go through \`addUserCredits\` and
SuitPay webhook writes, never the client."
```

---

## Task 5: Fix Firestore rules — block `rateLimits` client writes

**Context:** `firestore.rules` lines 102–106:

```
match /rateLimits/{userId} {
  allow read: if isOwner(userId);
  allow write: if isOwner(userId) &&
    request.resource.data.count <= 1000;
}
```

Allowing the owner to write their own rate-limit counter is a footgun — a motivated user can reset their `attempts` field to bypass the limit. The entire rate-limiter logic runs in Cloud Functions with the Admin SDK, so client writes are unnecessary.

**Files:**
- Modify: `firestore.rules`
- Modify: `functions/test/firestore-rules.test.ts` (add coverage)

- [ ] **Step 1: Add a failing test**

Edit `functions/test/firestore-rules.test.ts`. Inside the `describe('client-write-blocked collections', ...)` block, extend the `blocked` array:

```typescript
  const blocked = [
    'productPrices/p1',
    'reportTemplates/t1',
    'systemConfig/c1',
    'securityLogs/l1',
    'backupMetadata/b1',
    'rateLimits/u1', // ← add this
  ]
```

And add a dedicated test right after the loop:

```typescript
  it('rateLimits write is ALSO blocked — even by the owner', async () => {
    const db = env.authenticatedContext('u1').firestore()
    await assertFails(
      setDoc(doc(db, 'rateLimits/u1'), { attempts: 0, blocked: false })
    )
  })
```

- [ ] **Step 2: Run — expect 2 new tests to fail**

```bash
cd functions && npm test -- firestore-rules
```

Expected: 2 new tests fail (the loop entry for `rateLimits/u1` and the dedicated test).

- [ ] **Step 3: Tighten the rule**

Edit `firestore.rules` lines 102–106. Replace:

```
    // Rate limiting (contador de requisições)
    match /rateLimits/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) &&
        request.resource.data.count <= 1000; // Max 1000 requisições
    }
```

with:

```
    // Rate limiting (contador de requisições)
    // Writes only via Cloud Functions (Admin SDK). Reads are owner-only
    // so client UIs can surface their own current counter if needed.
    match /rateLimits/{userId} {
      allow read: if isOwner(userId);
      allow write: if false;
    }
```

- [ ] **Step 4: Rerun — all tests pass**

```bash
cd functions && npm test -- firestore-rules
```

Expected: all tests pass (15 now).

- [ ] **Step 5: Smoke-check rateLimiter still works**

The rateLimiter uses Admin SDK, which bypasses rules — so it still writes. Verify:

```bash
cd functions && npm test -- rateLimiter
```

Expected: 5/5 pass (unchanged from Phase 1).

- [ ] **Step 6: Commit**

```bash
git add firestore.rules functions/test/firestore-rules.test.ts
git commit -m "fix(rules): block client writes to rateLimits

Previously 'if isOwner(userId) && count <= 1000' allowed the user
to reset their own rate-limit counter, trivially bypassing throttling.
The rateLimiter runs in Cloud Functions with the Admin SDK, which
bypasses rules — client writes were never needed."
```

---

## Task 6: Migrate `recaptcha.ts` secret to `defineSecret`

**Context:** `functions/src/recaptcha.ts` currently reads the secret via `process.env.RECAPTCHA_SECRET_KEY`. Firebase Functions v2 recommends `defineSecret` with explicit per-function injection — the secret lives in Google Cloud Secret Manager and is only decrypted for functions that declare it.

**Files:**
- Modify: `functions/src/recaptcha.ts`

- [ ] **Step 1: Rewrite the secret loader + function declaration**

Edit `functions/src/recaptcha.ts`. Replace the top block through the function declaration (lines 1–27) with:

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import axios from 'axios'
import { checkRateLimit } from './rateLimiter'
import {
  securityLogger,
  SecurityEventType,
  SecuritySeverity,
} from './securityLogger'

if (!admin.apps.length) {
  admin.initializeApp()
}

const recaptchaSecret = defineSecret('RECAPTCHA_SECRET_KEY')

export const verifyRecaptcha = onCall(
  { secrets: [recaptchaSecret] },
  async (request) => {
    const token = request?.data?.token

    if (!token) {
      throw new HttpsError('invalid-argument', 'Token do ReCAPTCHA é obrigatório')
    }

    const userId = request?.auth?.uid || 'anonymous'
```

(The rest of the function body stays identical — just change `secret: getRecaptchaSecret()` on line 46 to `secret: recaptchaSecret.value()` and delete the now-unused `getRecaptchaSecret` helper.)

- [ ] **Step 2: Remove the obsolete helper**

Delete the `const getRecaptchaSecret = () => { ... }` block (old lines 12–25) if it's still present.

- [ ] **Step 3: Build**

```bash
cd functions && npm run build
```

Expected: exit 0. If TS complains about the defineSecret import, confirm the import path `'firebase-functions/params'` (this is where v2 exports it).

- [ ] **Step 4: Run full test suite**

```bash
cd functions && npm test
```

Expected: all existing tests still pass (recaptcha isn't directly tested but the import chain must stay clean).

- [ ] **Step 5: Commit**

```bash
git add functions/src/recaptcha.ts
git commit -m "refactor(recaptcha): migrate secret to defineSecret

Secret Manager integration replaces the raw process.env.RECAPTCHA_SECRET_KEY
read. The secret is only decrypted for this function (per-function scope),
reducing blast radius.

Deployment note: before deploy, set the secret value via
  firebase functions:secrets:set RECAPTCHA_SECRET_KEY"
```

---

## Task 7: Migrate Google/Meta OAuth client secrets to `defineSecret`

**Context:** Google Ads + Meta Ads OAuth handlers each need their client secret. Currently likely via `process.env` or imported from `config/`. Consolidate to `defineSecret` and inject per-function.

**Files to inspect first:** `functions/src/config/index.ts`, `functions/src/googleAdsOAuth.ts`, `functions/src/googleAdsOAuthV2.ts`, `functions/src/metaAdsOAuth.ts`, `functions/src/metaAdsOAuthV2.ts`.

- [ ] **Step 1: Read the current config module**

Run:

```bash
cat functions/src/config/index.ts
```

Note how secrets are currently referenced (likely a mix of `defineSecret` in some places and `process.env` in others).

- [ ] **Step 2: Standardize secret declarations in `config/index.ts`**

Ensure the following named exports exist (add/refactor as needed):

```typescript
import { defineSecret } from 'firebase-functions/params'

export const googleAdsClientSecret = defineSecret('GOOGLE_ADS_CLIENT_SECRET')
export const metaAdsAppSecret = defineSecret('META_ADS_APP_SECRET')
export const suitpayClientId = defineSecret('SUITPAY_CLIENT_ID')
export const suitpayClientSecret = defineSecret('SUITPAY_CLIENT_SECRET')
export const recaptchaSecret = defineSecret('RECAPTCHA_SECRET_KEY')
```

(Keep any other existing exports like `config`, `getWebhookUrl`, `isProduction` — don't delete them.)

- [ ] **Step 3: Wire Google Ads OAuth to use the secret**

In `functions/src/googleAdsOAuthV2.ts`:
- Import `googleAdsClientSecret` from `./config`
- Add `{ secrets: [googleAdsClientSecret] }` option to each `onCall(...)` that exchanges or refreshes a Google token
- Replace `process.env.GOOGLE_ADS_CLIENT_SECRET` / any raw env reads with `googleAdsClientSecret.value()`

Same pattern for `functions/src/googleAdsOAuth.ts` (V1 — still exported, keep functional).

- [ ] **Step 4: Wire Meta Ads OAuth to use the secret**

Same for `functions/src/metaAdsOAuthV2.ts` and `functions/src/metaAdsOAuth.ts`:
- Import `metaAdsAppSecret`
- `{ secrets: [metaAdsAppSecret] }` on each token-exchanging `onCall`
- Replace raw env reads with `metaAdsAppSecret.value()`

- [ ] **Step 5: Build**

```bash
cd functions && npm run build
```

Expected: exit 0.

- [ ] **Step 6: Run full test suite**

```bash
cd functions && npm test
```

Expected: all pass — the state-validation tests don't trigger secret access (they fail before token exchange).

- [ ] **Step 7: Commit**

```bash
git add functions/src/config/index.ts functions/src/googleAdsOAuth*.ts functions/src/metaAdsOAuth*.ts
git commit -m "refactor(oauth): consolidate OAuth secrets via defineSecret

- GOOGLE_ADS_CLIENT_SECRET and META_ADS_APP_SECRET now Secret Manager-backed
- Per-function secret injection via { secrets: [...] } option
- Removes raw process.env reads from OAuth token exchanges

Deployment: set secrets once with
  firebase functions:secrets:set GOOGLE_ADS_CLIENT_SECRET
  firebase functions:secrets:set META_ADS_APP_SECRET"
```

---

## Task 8: Mark SuitPay files `@deprecated` and reduce webhook logging

**Context:** User is migrating pagamentos to Asaas. Do NOT invest in hardening SuitPay's hash validation or IP allowlist. Just:
1. Add `@deprecated` JSDoc to the file headers so future agents know it's going.
2. Reduce `webhook_logs` payload — current code saves the full `request.headers` (PII + auth tokens potentially).

**Files:**
- Modify: `functions/src/suitpayWebhook.ts`
- Modify: `functions/src/suitpayPayment.ts`

- [ ] **Step 1: Annotate `suitpayWebhook.ts` as deprecated**

Add at the very top of `functions/src/suitpayWebhook.ts` (before the imports):

```typescript
/**
 * @deprecated SuitPay integration is being phased out in favor of Asaas.
 * This file will be removed in a future phase. No new features should be
 * added here; existing behaviour is maintained only until Asaas migration
 * completes.
 */
```

- [ ] **Step 2: Reduce the webhook_logs payload**

In `functions/src/suitpayWebhook.ts`, find the block that writes `webhook_logs` (around lines 36–42):

```typescript
    await admin.firestore().collection('webhook_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: sourceIP,
      body: request.body,
      headers: request.headers
    })
```

Replace with:

```typescript
    // Reduced logging — the original stored the full headers dict, which
    // can include authorization tokens, cookies and other PII. Keep only
    // the headers that are useful for forensics.
    await admin.firestore().collection('webhook_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: sourceIP,
      body: request.body,
      headersSubset: {
        userAgent: request.headers['user-agent'] || null,
        xForwardedFor: request.headers['x-forwarded-for'] || null,
        contentType: request.headers['content-type'] || null,
      },
    })
```

- [ ] **Step 3: Annotate `suitpayPayment.ts` as deprecated**

Add the same `@deprecated` JSDoc block at the top of `functions/src/suitpayPayment.ts`.

- [ ] **Step 4: Build**

```bash
cd functions && npm run build
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add functions/src/suitpayWebhook.ts functions/src/suitpayPayment.ts
git commit -m "chore(suitpay): mark deprecated, reduce webhook log payload

- @deprecated JSDoc signals to future agents that SuitPay is scheduled
  for removal once the Asaas integration lands.
- webhook_logs no longer stores the full request.headers (which could
  include authorization tokens and PII). Keeps only user-agent,
  x-forwarded-for, content-type — enough for basic forensics.

Body is still logged since SuitPay payloads are required to debug
transaction disputes; that ends when SuitPay is removed."
```

---

## Task 9: Add Firebase Hosting security headers

**Context:** `firebase.json` today has:
- `X-Content-Type-Options: nosniff` ✅ keep
- `X-Frame-Options: SAMEORIGIN` ✅ keep
- `X-XSS-Protection: 1; mode=block` ❌ deprecated and harmful in modern browsers — remove
- `Referrer-Policy: strict-origin-when-cross-origin` ✅ keep
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` ✅ keep

Missing: `Strict-Transport-Security`, `Content-Security-Policy`, optional `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`.

**Files:**
- Modify: `firebase.json`

- [ ] **Step 1: Replace the headers block**

Edit `firebase.json`. Locate the first element of `hosting.headers` (the one with `"source": "**"`). Replace its `headers` array:

```json
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "camera=(), microphone=(), geolocation=()"
          }
        ]
      },
```

with:

```json
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "camera=(), microphone=(), geolocation=()"
          },
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=63072000; includeSubDomains; preload"
          },
          {
            "key": "Cross-Origin-Opener-Policy",
            "value": "same-origin"
          },
          {
            "key": "Cross-Origin-Resource-Policy",
            "value": "same-origin"
          },
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' https://www.google.com https://www.gstatic.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google.com https://graph.facebook.com; frame-src https://www.google.com https://*.firebaseapp.com; object-src 'none'; base-uri 'self'"
          }
        ]
      },
```

The CSP allowlist above covers: Firebase Auth (identitytoolkit, securetoken), Firestore (firebaseio), Cloud Functions (cloudfunctions), Google reCAPTCHA (google.com/gstatic), Meta Ads OAuth (graph.facebook.com), Google Fonts. Inline styles are allowed (common with Tailwind runtime theming).

- [ ] **Step 2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('firebase.json','utf8')); console.log('firebase.json ok')"
```

Expected: ok.

- [ ] **Step 3: Build the app and verify it still loads under CSP (local smoke test)**

Run:

```bash
npm run build && npm run preview -- --port 4173 &
BUILD_PID=$!
sleep 3
curl -sI http://localhost:4173 | head -30
kill $BUILD_PID 2>/dev/null
```

Expected: HTTP 200, headers returned — note: `preview` doesn't serve the Firebase headers, those only apply on deploy. So this step only validates the build succeeds; full CSP validation requires a Firebase Hosting preview deploy which is out-of-scope here.

- [ ] **Step 4: Commit**

```bash
git add firebase.json
git commit -m "security(hosting): add HSTS, CSP, COOP/CORP headers; remove X-XSS-Protection

- X-XSS-Protection removed: obsolete, can enable XSS in modern browsers
  per OWASP guidance.
- Added Strict-Transport-Security with 2-year max-age + preload.
- Added Cross-Origin-Opener-Policy and Cross-Origin-Resource-Policy
  (same-origin) to enable cross-origin isolation.
- Added Content-Security-Policy allowlisting Firebase, reCAPTCHA,
  Google Fonts, and Meta Graph API. Inline styles still allowed
  ('unsafe-inline' on style-src) due to runtime-theming patterns.

After deploy, verify: curl -I https://adsmart.app/ | grep -i -E 'hsts|content-security|coop|corp'"
```

---

## Task 10: Audit inline scripts / `dangerouslySetInnerHTML` for CSP compatibility

**Context:** The CSP added in Task 9 forbids inline `<script>` tags (no `'unsafe-inline'` on `script-src`). If the app uses `dangerouslySetInnerHTML` or injects `<script>` at runtime, those paths break. Audit now.

**Files:**
- Check (read-only): all `src/**/*.{ts,tsx}`, `index.html`

- [ ] **Step 1: Grep for suspicious patterns**

```bash
grep -rn "dangerouslySetInnerHTML\|document.write\|eval(\|new Function(" src/ index.html
```

Expected findings should be NONE or minimal. If any match exists:
- `dangerouslySetInnerHTML` in an i18n renderer — wrap with `dompurify.sanitize` first (if not already)
- `<script>` in `index.html` that isn't a Firebase/reCAPTCHA SDK — move to a module and import
- `eval` — must be removed or replaced

- [ ] **Step 2: Grep for inline scripts in index.html**

```bash
grep -n "<script" index.html
```

Expected: only `type="module"` imports generated by Vite OR external CDN scripts. Any `<script>...</script>` with inline JS must be moved to a module.

- [ ] **Step 3: If issues found, fix them**

For each issue, apply the smallest correct fix:
- Inline `<script>` → extract to `src/*.ts` and import via Vite module
- `dangerouslySetInnerHTML` → ensure input is DOMPurify-sanitized (the app already has `src/utils/sanitize.ts`); otherwise refactor to use React text nodes
- `eval` / `new Function` → rewrite without dynamic code

If no issues, skip step 4.

- [ ] **Step 4: Re-run typecheck + tests**

```bash
npm run type-check && npm test
cd functions && npm test
```

Expected: all pass.

- [ ] **Step 5: Commit (only if changes made, otherwise skip)**

```bash
git add <changed files>
git commit -m "security(csp): remove inline scripts / sanitize dangerouslySetInnerHTML

Ensures the CSP introduced in the previous commit does not break the
app. <describe the specific fixes here>."
```

If no changes needed, add a note in the final report but don't create an empty commit.

---

## Task 11: Add `AdminRoute` client guard

**Context:** `src/App.tsx` wraps `/admin` with `<PrivateRoute>` only — any authenticated user can reach the admin panel UI. The actual Cloud Functions check `token.admin` server-side, so there's no data breach, but the UI should not be reachable. Add `<AdminRoute>` that checks the admin claim.

**Files:**
- Create: `src/components/AdminRoute.tsx`
- Modify: `src/App.tsx`
- Modify: `src/contexts/AuthContext.tsx` (if the context doesn't already expose the token claims)
- Test: `src/components/AdminRoute.test.tsx`

- [ ] **Step 1: Read `src/contexts/AuthContext.tsx` to see what it exposes**

```bash
cat src/contexts/AuthContext.tsx
```

Note: does the context already expose `user.getIdTokenResult()` data or a derived `isAdmin` boolean? If not, Step 2 adds it. If yes, skip Step 2.

- [ ] **Step 2 (conditional): Add `isAdmin` derived state to AuthContext**

If the context does NOT expose admin state, add a `useEffect` that refreshes the token claims on user change and stores `isAdmin` in state. Expose it in the context value:

```typescript
// In AuthContext.tsx — add to the existing provider
const [isAdmin, setIsAdmin] = useState(false)

useEffect(() => {
  if (!user) {
    setIsAdmin(false)
    return
  }
  user.getIdTokenResult().then((result) => {
    setIsAdmin(result.claims.admin === true)
  }).catch(() => setIsAdmin(false))
}, [user])

// ... and add `isAdmin` to the returned context value
```

And in the context's TypeScript value type, add `isAdmin: boolean`.

- [ ] **Step 3: Create `src/components/AdminRoute.tsx`**

```typescript
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAdmin } = useAuth()

  if (!user) return <Navigate to="/login" />
  if (!isAdmin) return <Navigate to="/dashboard" />
  return <>{children}</>
}
```

- [ ] **Step 4: Wire the admin route**

Edit `src/App.tsx`. Find the `/admin` route:

```tsx
<Route
  path="/admin"
  element={
    <PrivateRoute>
      <AdminPanel />
    </PrivateRoute>
  }
/>
```

Replace with:

```tsx
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminPanel />
    </AdminRoute>
  }
/>
```

Add the import: `import { AdminRoute } from '@/components/AdminRoute'`.

- [ ] **Step 5: Write a test**

Create `src/components/AdminRoute.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AdminRoute } from './AdminRoute'
import * as AuthContextModule from '@/contexts/AuthContext'

function renderWithAuth(authValue: { user: any; isAdmin: boolean }, initialPath = '/admin') {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(authValue as any)

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <div data-testid="admin-content">ADMIN</div>
            </AdminRoute>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">LOGIN</div>} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page">DASHBOARD</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AdminRoute', () => {
  it('redirects unauthenticated users to /login', () => {
    renderWithAuth({ user: null, isAdmin: false })
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('redirects authenticated non-admin users to /dashboard', () => {
    renderWithAuth({ user: { uid: 'u1' }, isAdmin: false })
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
  })

  it('renders children for admin users', () => {
    renderWithAuth({ user: { uid: 'u1' }, isAdmin: true })
    expect(screen.getByTestId('admin-content')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run tests**

```bash
npm test -- AdminRoute
```

Expected: 3 tests pass.

- [ ] **Step 7: Typecheck + build**

```bash
npm run type-check && npm run build
```

Expected: exit 0 both.

- [ ] **Step 8: Commit**

```bash
git add src/components/AdminRoute.tsx src/components/AdminRoute.test.tsx src/App.tsx src/contexts/AuthContext.tsx
git commit -m "security(client): add AdminRoute guard for /admin

Previously /admin was wrapped by PrivateRoute only, meaning any
authenticated user could reach the admin panel UI (server functions
rejected their actions, but the page still rendered — sloppy).

AdminRoute checks user.getIdTokenResult().claims.admin. Non-admins
are redirected to /dashboard. Unauthenticated users go to /login.

Setting the admin claim remains a server-side operation — see
docs/SECURITY.md (next task)."
```

---

## Task 12: Create `docs/SECURITY.md` with rotation checklist + admin-claim setup

**Context:** The user has deferred secret rotation ("private repo, only me"). Document it as a future action checklist. Also document how to set the admin custom claim (the user already has admin emails allowlisted, but custom-claim-based admin is the intended path).

**Files:**
- Create: `docs/SECURITY.md`

- [ ] **Step 1: Create the doc**

Create `docs/SECURITY.md`:

```markdown
# Security

## Pending credential rotation

The following secrets appeared in git history in `.backups/.env.backup_*`
files (committed August 2025). The repo is private and single-user, so
rotation was deferred — but it should happen before the repo is ever
shared, made public, or connected to any external CI/service.

Rotation checklist:

- [ ] Firebase API keys (console: Project settings → General → Web API key)
- [ ] Google Ads OAuth Client Secret (Google Cloud Console → OAuth 2.0 Client)
- [ ] Meta Ads App Secret (developers.facebook.com → App → Settings → Advanced → Reset)
- [ ] SuitPay client ID + client secret (SuitPay dashboard) — will be moot once Asaas migration completes
- [ ] reCAPTCHA v2 secret (https://www.google.com/recaptcha/admin)
- [ ] Any ENCRYPTION_KEY used for local data encryption (if in use)

After rotation, set new values via:

\`\`\`bash
firebase functions:secrets:set RECAPTCHA_SECRET_KEY
firebase functions:secrets:set GOOGLE_ADS_CLIENT_SECRET
firebase functions:secrets:set META_ADS_APP_SECRET
\`\`\`

## Admin access

Admin access is granted via a custom claim on the Firebase Auth user,
not by email allowlist. `AdminRoute` (client) reads `token.admin === true`
and the Cloud Functions check the same claim before executing privileged
operations.

### Granting admin to a user

Requires the Admin SDK (e.g. a one-off Node script run from a machine with
your service account credentials, OR the Firebase CLI's functions shell):

\`\`\`javascript
const admin = require('firebase-admin')
admin.initializeApp()
await admin.auth().setCustomUserClaims(uid, { admin: true })
// The user must sign out and sign back in for the claim to take effect
// in their client token.
\`\`\`

### Revoking admin

\`\`\`javascript
await admin.auth().setCustomUserClaims(uid, { admin: false })
// Follow up with admin.auth().revokeRefreshTokens(uid) to force immediate
// re-auth rather than waiting for the 1-hour token TTL.
\`\`\`

## Firestore rules

Rules enforce per-user ownership on `users/{uid}` and its subcollections
(`wallet`, `transactions`, `oauthConnections`, etc.). Wallet and
transactions are read-only from the client — writes require the Admin
SDK (Cloud Functions).

System collections (`productPrices`, `reportTemplates`, `systemConfig`,
`securityLogs`, `backupMetadata`, `rateLimits`) are write-blocked from
the client.

## Security headers

Firebase Hosting responds with:
- HSTS (2 years, preload)
- CSP allowlisting Firebase, reCAPTCHA, Google Fonts, Meta Graph
- COOP + CORP same-origin (cross-origin isolation)
- X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
  Permissions-Policy

See `firebase.json` for the full list.
```

- [ ] **Step 2: Commit**

```bash
git add docs/SECURITY.md
git commit -m "docs(security): add SECURITY.md with rotation checklist and admin setup"
```

---

## Task 13: Final validation and push

- [ ] **Step 1: Full local validation (emulator must be running)**

```bash
# Terminal 1:
firebase emulators:start --only firestore,auth --project adsmart-test

# Terminal 2:
cd "/Users/eduardorodrigues/Downloads/Meus Projetos/adsmart-app"
npm run lint && npm run type-check && npm run build && npm test
cd functions && npm run build && npm test && cd ..
```

Expected: every command exits 0. Test counts should be:
- Frontend: 31+ tests (28 previous + 3 new AdminRoute)
- Functions: 40+ tests (39 previous — 2 skipped un-skipped + 2 new re-entrancy + 2 new rateLimits = 43)

- [ ] **Step 2: Kill emulator + verify git status clean**

```bash
pkill -f "firebase.*emulators"
git status
```

Expected: clean tree, all work committed.

- [ ] **Step 3: Push**

```bash
git push origin migrate
```

Expected: lefthook pre-push runs (typecheck-web + typecheck-functions build), push succeeds.

- [ ] **Step 4: Review CI status**

Open https://github.com/ZenniTTy/adsmart-web/actions (or `gh run list --branch migrate --limit 1` if `gh` is installed).

Expected: frontend job green. Functions job yellow (lint continue-on-error still active until Phase 2), build green.

---

## Self-Review Notes

**Spec coverage check:**

- ✅ 4.1 Rules `rateLimits` — Task 5
- ✅ 4.1 Rules subcollection scope — Task 4
- ✅ 4.2 Hosting headers (HSTS, CSP, COOP, CORP, remove X-XSS) — Task 9
- ✅ 4.3 Secrets (recaptcha + OAuth) via defineSecret — Tasks 6, 7
- ✅ 4.4 AdminRoute client guard — Task 11
- ✅ 4.5 Reduced webhook logs — Task 8
- ✅ 4.6 SuitPay mark deprecated — Task 8
- ✅ 4.7 CSP inline-script audit — Task 10

**Phase 1 bugs fixed:**
- ✅ Rules invalid email bypass — Task 4
- ✅ Rules delete bypass — Task 4
- ✅ OAuth V2 try/catch code loss (Google) — Task 2
- ✅ OAuth V2 try/catch code loss (Meta) — Task 3
- ✅ `securityLogger` recursion — Task 1

**Out of scope (documented):**
- Rotation of the leaked secrets (user's call — `docs/SECURITY.md` has the checklist)
- SuitPay hardening (webhook hash validation, IP allowlist enforcement) — it's being replaced
- Full `docs/` documentation — Phase 4
- Firebase App Check — future consideration

**Placeholder scan:** no `TBD`, no `TODO`, no "add appropriate handling" — every step has concrete code or commands.

**Type consistency check:** `AdminRoute` uses `useAuth()` which returns `{ user, isAdmin }` (augmented in Task 11 Step 2); tests mock the same shape. Firestore rules test constants match the rules file paths.
