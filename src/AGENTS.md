# Frontend — Agent Guide

Read [../AGENTS.md](../AGENTS.md) for the project-wide overview. This file covers frontend-specific conventions.

## Current vs target stack

Current code targets **React 18.3 + Tailwind 3.x**. The redesign roadmap upgrades to **React 19 + Tailwind v4 + SF Pro** in Fase 1 (`docs/redesign/EXECUTION-CHECKLIST.md` § FASE 1). When editing, follow the conventions that exist NOW; do not preemptively use Tailwind v4 syntax (`@theme`, `@utility`) until Fase 1 lands. Same for React 19 features (Actions, `use`, ref as prop) — wait for Fase 1.

## i18n is mandatory (princípio 7)

All user-visible strings go through `t('namespace.key')` and must exist in **all three locales** (`pt-BR.json`, `en.json`, `es.json`) before merge. Zero literal hardcoded strings in JSX/TSX. The `check-no-hardcoded-literal.sh` hook (Fase 0b) blocks commits that violate this. `pt-BR` is the source language — write the key there first, then translate.

## Directory structure

```
src/
  components/
    ui/           # shadcn/ui primitives (button, card, dialog, input, …)
    layout/       # Shell components (Header, Sidebar, Footer, MainLayout, …)
    common/       # Shared small components (LanguageSelector, Logo, …)

    AdminRoute.tsx
    PrivateRoute.tsx
  contexts/
    AuthContext.tsx      # user, isAdmin, sign-in/out
    LanguageContext.tsx  # language, setLanguage, t()
    ThemeContext.tsx     # theme, toggleTheme
  firebase/
    config.ts           # Firebase app init; emulator connection
  hooks/
    useProductPrices.ts
    useRateLimit.ts
    useReports.ts
    useWallet.ts
  lib/
    gtm.ts              # GTM boot (initGtm)
    utils.ts            # cn() classname utility
  locales/
    pt-BR.json          # Source language (Portuguese)
    en.json
    es.json
    types.ts            # Language + Translations types
  pages/                # One file per route
  schemas/              # Zod schemas + FirestoreDataConverter helpers
    firestore-converter.ts  # zodConverter, zTimestamp
    report.ts
    adAccount.ts        # (more land in Phase C6 of docs/REFACTOR-PLAN.md)
  services/
    oauthServices.ts    # httpsCallable wrappers for OAuth functions
    paymentService.ts   # httpsCallable wrappers for payment functions
  main.tsx              # App entry, initGtm call
  App.tsx               # Router + providers
  index.css             # CSS variables + Tailwind base
```

## Routing conventions

All routes are declared in `src/App.tsx`. Route guards:

- Public route: no wrapper
- Authenticated-only: wrap in `<PrivateRoute>`
- Admin-only: wrap in `<AdminRoute>` (internally also enforces authentication)

```tsx
// Private route
<Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

// Admin route
<Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
```

Do not add authentication logic in page components. Route guards are the single enforcement point.

## Page conventions

Each page in `src/pages/` is a named export:

```tsx
export function MyPage() {
  const { t } = useLanguage()
  return <MainLayout>...</MainLayout>
}
```

Pages use `MainLayout` (desktop sidebar + mobile bottom nav) except for full-screen pages (Login, Landing). No default exports except where required by lazy loading.

## Context consumers

Always consume contexts via their hook:

```tsx
const { user, isAdmin } = useAuth()
const { t, language, setLanguage } = useLanguage()
const { theme, toggleTheme } = useTheme()
```

Never read context directly — always use the hook so the undefined check is centralized.

## Translation keys

Use `t('namespace.key')` pattern. Dot notation for nesting. All keys must exist in `src/locales/pt-BR.json` before using them.

```tsx
<span>{t('wallet.balance')}</span>
```

## Calling Cloud Functions

Use the service layer (`src/services/`) rather than calling `httpsCallable` directly in components. If no wrapper exists, add one.

```tsx
// ✅ Good
import { confirmGoogleAdsSelection } from '@/services/oauthServices'
await confirmGoogleAdsSelection({ temporaryToken, selectedAccountIds })

// ❌ Bad
const fn = httpsCallable(functions, 'confirmGoogleAdsAccountSelection')
await fn({ temporaryToken, selectedAccountIds })
```

## Styling

Use Tailwind utilities. For component variants, use `cva` (class-variance-authority) from `class-variance-authority`. Combine classes with `cn()` from `@/lib/utils`.

Do not write CSS in separate `.css` files (except `src/index.css` for global tokens/reset). Do not use inline `style` objects except for truly dynamic values.

Dark mode: classes under `[data-theme="dark"]` selector via Tailwind config. The `ThemeContext` toggles `data-theme` on `<html>`.
