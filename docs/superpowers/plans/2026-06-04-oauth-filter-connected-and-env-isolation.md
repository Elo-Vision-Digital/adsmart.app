# OAuth: Filter Connected Accounts + Env Isolation Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On reconnect, the account-selection modal shows only the ad accounts the user has NOT yet connected for that email; when all available accounts are already connected, it shows an in-modal notice. Plus three environment-isolation cleanups the Gemini session left behind.

**Architecture:** Client-side filtering. The `AccountSelectionModal` receives a new `connectedAccountIds: string[]` prop; it filters `accounts` and `businessManagers` against it and renders an "all connected" empty state when the filtered list is empty. `IntegrationsPage` already holds the connected accounts via `onSnapshot` and passes the matching platform's IDs. The isolation fixes remove hardcoded redirect literals (use the `defineString` config already loaded) and clean up env files.

**Tech Stack:** React 19 + TypeScript, Radix Dialog, `useLanguage()` i18n (pt-BR/en/es), Firebase Functions v2 (`defineString` config).

---

## File Structure

- `src/components/ui/AccountSelectionModal.tsx` — add `connectedAccountIds` prop, filter logic, all-connected empty state. (modify)
- `src/pages/IntegrationsPage.tsx` — pass `connectedAccountIds` derived from the platform's connected accounts. (modify)
- `src/locales/{pt-BR,en,es}.json` — add `allConnectedTitle` + `allConnectedDesc` keys under `accountSelectionModal`. (modify)
- `functions/src/googleAdsOAuth.ts` — replace hardcoded redirect literals in `handleGoogleAdsCallback` with `config.redirectUri/redirectUriDev`. (modify)
- `functions/.env` — frontend-irrelevant; the **root** `.env` (Vite) keeps only shared keys. (modify, see Task 5)
- GitHub Environment `prod` variable `META_ADS_REDIRECT_URI_DEV` — remove (manual `gh` step, Task 6).

---

## Task 1: Add `connectedAccountIds` prop + filtering to AccountSelectionModal

**Files:**
- Modify: `src/components/ui/AccountSelectionModal.tsx`

- [ ] **Step 1: Add the prop to the interface**

In `interface AccountSelectionModalProps` add after `accounts: AccountOption[]`:

```ts
  /** Account ids (no platform prefix) already connected for this email; filtered out of the selectable list. */
  connectedAccountIds?: string[]
```

And destructure it in the component signature, after `accounts,`:

```ts
  connectedAccountIds = [],
```

- [ ] **Step 2: Derive filtered accounts/businessManagers with useMemo**

Immediately after the existing `const { t } = useLanguage()` line, add:

```ts
  const connectedSet = useMemo(() => new Set(connectedAccountIds), [connectedAccountIds])

  const availableAccounts = useMemo(
    () => accounts.filter((a) => !connectedSet.has(a.id)),
    [accounts, connectedSet]
  )

  const availableBusinessManagers = useMemo(
    () =>
      businessManagers
        ?.map((bm) => ({ ...bm, accounts: bm.accounts.filter((a) => !connectedSet.has(a.id)) }))
        .filter((bm) => bm.accounts.length > 0),
    [businessManagers, connectedSet]
  )

  const allAlreadyConnected = accounts.length > 0 && availableAccounts.length === 0
```

(`useMemo` is already imported — confirm `import { useMemo, useState } from 'react'` at top.)

- [ ] **Step 3: Use the filtered lists in render**

Replace every render-time reference to `accounts` with `availableAccounts` and `businessManagers` with `availableBusinessManagers` INSIDE the JSX/select-step rendering:
- `renderFlatAccountList`: iterate `availableAccounts` instead of `accounts`.
- `renderBusinessManagerGroups`: guard on `availableBusinessManagers` and iterate it.
- The "select all" checkbox + count: `availableAccounts.length`.
- `handleToggleAll`: use `availableAccounts.map((acc) => acc.id)`.
- The footer count `{selectedAccounts.length} / {accounts.length}` → `/ {availableAccounts.length}`.
- The `businessManagers ? renderBusinessManagerGroups() : renderFlatAccountList()` decision → `availableBusinessManagers ? ... : ...`.

Do NOT change `renderConfigureAccounts`'s `accounts.filter((a) => selectedAccounts.includes(a.id))` — selected ids are always a subset of available, so it still resolves correctly; but for safety change its source to `availableAccounts.filter(...)`.

- [ ] **Step 4: Render the all-connected empty state**

In the select-step body, the current empty check is `accounts.length === 0 ? (<Nenhuma conta...>) : (...)`. Replace the condition with a three-way:

```tsx
{step === 'select' ? (
  accounts.length === 0 ? (
    <div className="text-center py-8">
      <p className="text-gray-500 dark:text-gray-400">
        {t('accountSelectionModal.noAccountsFound')}
      </p>
    </div>
  ) : allAlreadyConnected ? (
    <div className="text-center py-10">
      <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-[var(--success)]" />
      <p className="font-medium text-gray-900 dark:text-white mb-1">
        {t('accountSelectionModal.allConnectedTitle')}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('accountSelectionModal.allConnectedDesc', { email: mainAccountEmail || mainAccountName })}
      </p>
    </div>
  ) : (
    <div className="space-y-2">
      {/* existing select-all + list block, now using availableAccounts/availableBusinessManagers */}
    </div>
  )
) : loadingProjects ? ( /* unchanged */ ) : (
  renderConfigureAccounts()
)}
```

Add `CheckCircle2` to the lucide-react import at top (it is NOT currently imported in this file — verify and add).

Note: the hardcoded `"Nenhuma conta de anúncios encontrada."` string at the old `accounts.length === 0` branch is replaced with `t('accountSelectionModal.noAccountsFound')` — add that key too in Task 3.

- [ ] **Step 5: Disable the footer Continue button when all connected**

The select-step footer button is `<Button onClick={handleConfirm} disabled={selectedAccounts.length === 0}>`. That already disables it (nothing selectable). No change needed, but verify the Cancel/Close path still closes the modal.

- [ ] **Step 6: Typecheck**

Run: `bun run typecheck`
Expected: PASS (no errors in AccountSelectionModal.tsx).

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/AccountSelectionModal.tsx
git commit -m "feat(oauth): filter already-connected accounts in selection modal + all-connected state"
```

---

## Task 2: Pass connectedAccountIds from IntegrationsPage

**Files:**
- Modify: `src/pages/IntegrationsPage.tsx`

- [ ] **Step 1: Compute the connected ids for the active OAuth platform**

`IntegrationsPage` already has `const googleAccounts = accounts.filter((a) => a.platform === 'google_ads')` and `metaAccounts` (lines ~270-271). The `AdAccount.accountId` field holds the raw id (no `google_ads_`/`meta_ads_` prefix — that prefix is only the doc id). Add, right before the `return (`:

```ts
  const connectedAccountIds = (oauthPlatform === 'google_ads' ? googleAccounts : metaAccounts).map(
    (a) => a.accountId
  )
```

- [ ] **Step 2: Pass it to the modal**

In the `<AccountSelectionModal ... />` JSX (around line 562), add the prop after `accounts={oauthData.accountsAvailable}`:

```tsx
          connectedAccountIds={connectedAccountIds}
```

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/IntegrationsPage.tsx
git commit -m "feat(oauth): pass connected account ids to selection modal"
```

---

## Task 3: i18n keys in all three languages

**Files:**
- Modify: `src/locales/pt-BR.json`, `src/locales/en.json`, `src/locales/es.json`

- [ ] **Step 1: Add keys under `accountSelectionModal` in pt-BR.json**

```json
"allConnectedTitle": "Tudo conectado",
"allConnectedDesc": "Todas as contas de {email} já estão vinculadas à AdSmart.",
"noAccountsFound": "Nenhuma conta de anúncios encontrada."
```

- [ ] **Step 2: Add the same keys in en.json**

```json
"allConnectedTitle": "All connected",
"allConnectedDesc": "Every ad account for {email} is already linked to AdSmart.",
"noAccountsFound": "No ad accounts found."
```

- [ ] **Step 3: Add the same keys in es.json**

```json
"allConnectedTitle": "Todo conectado",
"allConnectedDesc": "Todas las cuentas de {email} ya están vinculadas a AdSmart.",
"noAccountsFound": "No se encontraron cuentas de anuncios."
```

- [ ] **Step 4: Verify i18n parity**

Run: `bun run typecheck` (the locales `types.ts` is typed against the JSON shape; a missing key in one language fails typecheck).
Expected: PASS. If a `/check-i18n` skill exists, run it.

- [ ] **Step 5: Commit**

```bash
git add src/locales/pt-BR.json src/locales/en.json src/locales/es.json
git commit -m "i18n(oauth): add all-connected + no-accounts-found keys (pt-BR/en/es)"
```

---

## Task 4: Fix hardcoded Google redirect URI (isolation fix #1)

**Files:**
- Modify: `functions/src/googleAdsOAuth.ts`

- [ ] **Step 1: Replace the hardcoded literals**

In `handleGoogleAdsCallback`, `config` is already loaded at line ~189 via `const config = await getGoogleAdsConfig()` which returns `{ redirectUri, redirectUriDev, ... }`. Replace lines ~192-197:

```ts
    const isLocalEnv = stateData.isLocalEnv === true
    const redirectUri = isLocalEnv
      ? 'http://localhost:5173/auth/google-ads/callback'
      : 'https://adsmart.app/auth/google-ads/callback'
```

with:

```ts
    const isLocalEnv = stateData.isLocalEnv === true
    const redirectUri = isLocalEnv ? config.redirectUriDev : config.redirectUri
```

This mirrors how `getMetaAdsAuthUrl` and `handleMetaAdsCallback` already source the redirect from config, and how `getGoogleAdsAuthUrl` (lines 92-94) already uses `googleAdsRedirectUriDev.value()`.

- [ ] **Step 2: Build functions**

Run: `cd functions && bun run build`
Expected: PASS (no type errors).

- [ ] **Step 3: Commit**

```bash
git add functions/src/googleAdsOAuth.ts
git commit -m "fix(oauth): source Google callback redirect_uri from config, not hardcoded literals"
```

---

## Task 5: Clean Vite root `.env` (isolation fix #2)

**Context:** Vite loads root `.env` in ALL modes; `.env.production` overrides it for prod builds. The only key present in `.env` (dev values) but absent from `.env.production` is `VITE_USE_FIREBASE_EMULATOR`, which therefore leaks the dev value into prod builds. The root `.env` is gitignored; `.env.development` and `.env.production` are tracked.

**Files:**
- Modify (local, gitignored): `/Users/eduardorodrigues/Documents/Projetos/Meus/adsmart/adsmart/.env`
- Modify (tracked): `.env.production`

- [ ] **Step 1: Add the missing key to `.env.production`**

Append to `.env.production` (so prod builds don't inherit the dev `.env` value):

```
VITE_USE_FIREBASE_EMULATOR=false
```

- [ ] **Step 2: (Local, optional) trim root `.env` to dev-only**

The root `.env` is a dev-default fallback and gitignored — leave it as-is functionally, but since `.env.development` already carries the full dev config, the root `.env` is redundant. No commit (gitignored). Document in commit message of Step 1 that prod now declares the emulator flag explicitly.

- [ ] **Step 3: Verify prod build picks the right values**

Run: `bun run build` (mode=production) then inspect: `grep -r "adsmart-web-dev" dist/assets/*.js | head` — expected: NO matches (prod build must not contain the dev project id).
Expected: empty output (no dev project leakage).

- [ ] **Step 4: Commit**

```bash
git add .env.production
git commit -m "chore(env): declare VITE_USE_FIREBASE_EMULATOR in prod env to stop dev .env leakage"
```

---

## Task 6: Remove dev redirect from prod GitHub Environment (isolation fix #3)

**Context:** GitHub Environment `prod` has `META_ADS_REDIRECT_URI_DEV=http://localhost:5173/...` — a dev-only, localhost value living in the production environment. It is unused by prod runtime (prod uses `META_ADS_REDIRECT_URI`) but is config-in-the-wrong-place. Same applies to `GOOGLE_ADS_REDIRECT_URI_DEV=http://localhost:5173` in prod.

**This is a manual `gh` operation — not a code change. Confirm with the user before running (it mutates GitHub state).**

- [ ] **Step 1: Verify current prod values**

Run: `gh api 'repos/{owner}/{repo}/environments/prod/variables' --jq '.variables[] | .name + " = " + .value'`
Expected: shows `META_ADS_REDIRECT_URI_DEV` and `GOOGLE_ADS_REDIRECT_URI_DEV` with localhost values.

- [ ] **Step 2: Decide — remove vs. correct**

Two options for the user:
- (a) DELETE the `*_REDIRECT_URI_DEV` vars from the `prod` environment (cleanest — prod never needs a dev redirect).
- (b) Leave them (harmless at runtime). The deploy.yml writes them into `.env` but prod code paths use the non-DEV value.

Default recommendation: (a) delete from prod env.

- [ ] **Step 3 (if deleting): Remove the vars**

Run:
```bash
gh api -X DELETE 'repos/{owner}/{repo}/environments/prod/variables/META_ADS_REDIRECT_URI_DEV'
gh api -X DELETE 'repos/{owner}/{repo}/environments/prod/variables/GOOGLE_ADS_REDIRECT_URI_DEV'
```
Note: if these vars are removed, the deploy.yml `echo "META_ADS_REDIRECT_URI_DEV=$META_ADS_REDIRECT_URI_DEV"` line will write an empty value for prod deploys. That is acceptable (prod doesn't use it), but cleaner is to ALSO guard the deploy.yml to only write `*_DEV` vars in the dev job. If the user wants that, add a follow-up to edit `.github/workflows/deploy.yml` prod job to drop the two `*_REDIRECT_URI_DEV` echo lines.

- [ ] **Step 4: No commit** (GitHub state change, not repo).

---

## Self-Review Notes

- **Spec coverage:** filter connected (Tasks 1-2), all-connected notice (Task 1 step 4 + Task 3), i18n 3 langs (Task 3), isolation #1 Google redirect (Task 4), #2 Vite env (Task 5), #3 prod env var (Task 6). All covered.
- **Type consistency:** new prop `connectedAccountIds?: string[]` used identically in modal (Task 1) and page (Task 2). `availableAccounts`/`availableBusinessManagers`/`allAlreadyConnected` defined in Task 1 and only used there.
- **No placeholders:** all code shown. Manual GitHub step (Task 6) explicitly gated on user confirmation.
- **Deploy dependency:** Tasks 1-5 are code; the Meta connect fix is the separate re-deploy already triggered. The Google `select_account` URL change was deemed unnecessary by the user (Google reconnect now works; the real ask is filtering connected accounts, handled here). If the user later wants the Google account-switcher too, add `prompt=consent select_account` in `getGoogleAdsAuthUrl` as a one-line follow-up.
