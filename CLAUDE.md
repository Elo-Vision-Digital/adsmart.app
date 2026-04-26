# CLAUDE.md — AdSmart

This file supplements AGENTS.md with Claude Code-specific guidance and inline design system reference.

Read [AGENTS.md](AGENTS.md) first. This file adds what's unique to Claude Code sessions.

## Stack (quick reference)

React 18 · TypeScript · Vite · Tailwind 3 · shadcn/ui · react-router-dom v6 · Firebase SDK 10 · framer-motion 12 · Biome · Vitest · Firebase Functions v2 (Node 22) · firebase-admin 12 · Zod 4 (`@adsmart/shared`)

## Editing Firestore document shapes

For any change to a Firestore document shape (adding a field, tightening a type, renaming, deprecating), edit **`packages/shared/src/schemas/`** first — it is the source of truth. Types in `src/types/index.ts` and inside Cloud Functions are derived (`z.infer`) and re-exported; do not hand-write a parallel interface.

After changing a schema:

1. Update or add a Vitest case in the matching `*.test.ts` (co-located with the schema file).
2. Run `cd packages/shared && bun run test` and `bun run typecheck` from the root — Turbo will re-validate web and functions consumers.
3. Update [docs/DATA-MODEL.md](docs/DATA-MODEL.md) — the schema is executable; the markdown is human-facing and must follow.
4. Add a dated entry to [docs/CHANGES.md](docs/CHANGES.md) explaining the field-level drift you fixed (or introduced).

The architectural rationale lives in [docs/Decisions.md](docs/Decisions.md) — ADR-009.

## Design system

### Typography

- **Font family**: Montserrat (400, 500, 600, 700) loaded from `@fontsource/montserrat`
- **Base**: `font-sans` in Tailwind → `Montserrat, system-ui, sans-serif`
- **Scale**: Use standard Tailwind text-xs through text-4xl; no custom size tokens

### Color tokens (CSS variables)

All colors use CSS variables defined in `src/index.css`. Use Tailwind utility names, not raw hex values.

| Token | Light | Dark | Tailwind class |
|---|---|---|---|
| `--background` | `#FFFFFF` | `#000000` | `bg-background` |
| `--surface` | `#FAFAFA` | `#0A0A0A` | `bg-surface` |
| `--text` | `#000000` | `#FFFFFF` | `text-foreground` |
| `--border` | `#E5E5E5` | `#1A1A1A` | `border-border` |
| `--muted` | `#666666` | `#999999` | `text-muted` |
| `--muted-foreground` | `#999999` | `#666666` | `text-muted-foreground` |
| `--primary` | `#000000` | `#FFFFFF` | `text-primary` / `bg-primary` |

Theme switching: `data-theme="dark"` on `<html>` (managed by `ThemeContext`).

### shadcn/ui components in use

| Component | File |
|---|---|
| Button | `src/components/ui/button.tsx` |
| Card | `src/components/ui/card.tsx` |
| Checkbox | `src/components/ui/checkbox.tsx` |
| Dialog | `src/components/ui/dialog.tsx` |
| Input | `src/components/ui/input.tsx` |
| Label | `src/components/ui/label.tsx` |
| Toast | `src/components/ui/toast.tsx` |

When adding new UI, prefer extending existing components. Do not install new Radix primitives without checking if the pattern already exists.

### Animations

Framer Motion is loaded as `framer-motion` (import from `framer-motion`). Custom Tailwind animations: `animate-slide-in`, `animate-slide-out`, `animate-fade-in-up`, `animate-fade-in`.

## Contexts

| Context | Hook | Provides |
|---|---|---|
| `AuthContext` | `useAuth()` | `user`, `loading`, `isAdmin`, sign-in/out methods |
| `LanguageContext` | `useLanguage()` | `language`, `setLanguage`, `t(key)` |
| `ThemeContext` | `useTheme()` | `theme`, `toggleTheme` |

Provider nesting order in `App.tsx`: `LanguageProvider → ThemeProvider → AuthProvider`.

## Route guard components

- `PrivateRoute` (`src/components/PrivateRoute.tsx`): redirects unauthenticated users to `/login`.
- `AdminRoute` (`src/components/AdminRoute.tsx`): redirects non-admins to `/dashboard`. Wraps `PrivateRoute` logic internally.

## Testing in Claude sessions

```bash
# Run all web tests
bun run test

# Run all functions tests (from functions/)
cd functions && bun run test

# Run all tests across workspaces (via Turbo)
bun run test:all

# Run with coverage (web)
bun run test:coverage
```

Tests live in `*.test.tsx` / `*.test.ts` next to the files they test (web) or in `functions/test/` (functions).

## Biome linter notes

- Biome replaces ESLint + Prettier in the frontend.
- Pre-commit hook runs `biome check --staged`.
- Common traps: `noAssignInExpressions` (no chained assignment `a = b = c`), `noConsole` (warn level).
- Fix automatically: `bun run lint:fix`.

## Code review router

Three review paths exist; pick the right one for the situation:

| Situation | Use | Why |
|---|---|---|
| Reviewing a real GitHub PR (already pushed) | `/code-review` (code-review plugin) | Operates on PR diff via `gh`; produces PR-level summary |
| Mid-implementation, want a sanity check on code in the working tree | `superpowers:requesting-code-review` | Returns Strengths / Issues / Assessment for unpushed work |
| Inside a `feature-dev:feature-dev` flow that produced architecture + code | `feature-dev:code-reviewer` agent | Knows the feature-dev plan and reviews against its blueprint |

Default: when in doubt and reviewing local changes before push → `superpowers:requesting-code-review`. After push, on the open PR → `/code-review`.

## Firebase operations

When operating Firebase live (queries, logs, rules, secrets, Auth), invoke `firebase-operations` skill. It documents when to use the MCP plugin vs `bunx firebase-tools` vs editing local files like `firestore.rules`.

## Docs hygiene

To audit documentation drift after a migration or before a release, invoke `docs-lint` skill. It checks for stale commands, broken cross-doc links, orphan docs, undated CHANGES entries, and contradictions vs AGENTS.md / CLAUDE.md.

## Memory system

This project has a memory system at `.claude/projects/.../memory/`. Key memories:
- `admin_claim_policy.md` — admin access uses custom claims + email fallback
- `firebase_secrets.md` — all secrets via `defineSecret` from `functions/src/config/index.ts`
- `suitpay_deprecated.md` — do NOT harden SuitPay; Asaas replaces it
- `phase_ordering.md` — Phase 1 → 3 → 4 → 2

## What changed in Phase 3 (security baseline)

Before Phase 2 upgrades, these security fixes are in place:
- Firestore rules: `wallet`/`transactions` write-blocked client-side; `rateLimits` write-only via Admin SDK
- CSP/HSTS/COOP/CORP headers in `firebase.json`
- GTM moved to `src/lib/gtm.ts` (no inline script)
- AdminRoute guards `/admin` with custom claim check
- All secrets via `defineSecret` (no `process.env.XXX_SECRET`)
- securityLogger re-entrancy guard prevents infinite loops on SUSPICIOUS_ACTIVITY events

## Wallet bootstrap (post-Phase-3 invariant)

The `useWallet` hook **never writes** to `users/{uid}/wallet/current`. The doc is seeded server-side by the `bootstrapUserWallet` Auth blocking trigger ([functions/src/bootstrapUserWallet.ts](functions/src/bootstrapUserWallet.ts)) on every new signup, via `beforeUserCreated` from `firebase-functions/v2/identity`. Existing users created before the trigger landed see a virtual `EMPTY_WALLET` (`balance: 0`, `updatedAt: epoch`) until an admin grants credit (which seeds the doc) or a backfill runs.

When touching wallet code, never re-introduce a client `setDoc(walletRef, ...)` — Phase 3 [firestore.rules:39-46](firestore.rules) reject it. See [ADR-010](docs/Decisions.md#adr-010-wallet-bootstrap-moved-to-server-side-auth-blocking-trigger).

## Adding Firestore queries

Any new query that combines `where(...)` with `orderBy(...)` (or two range filters on different fields) needs a composite index in [firestore.indexes.json](firestore.indexes.json). The Firebase SDK throws `FirebaseError: The query requires an index. You can create it here: ...` with the auto-create link, but committing the index in source is required so dev/prod stay in sync. After editing the file, run `firebase deploy --only firestore:indexes --project <target>` for each environment — index builds are async (1–3 min) so the query stays red until status flips to `Enabled`. See [DEPLOYMENT.md → Firestore rules and indexes](docs/DEPLOYMENT.md).
