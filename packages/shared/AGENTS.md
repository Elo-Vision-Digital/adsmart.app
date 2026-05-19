# @adsmart/shared — Agent Guide

Read [../../AGENTS.md](../../AGENTS.md) for the project-wide overview. This file covers shared package conventions.

## Purpose

`@adsmart/shared` is the **single source of truth** for:

- Every Firestore document shape (via Zod schemas in `src/schemas/`)
- Every callable I/O contract (input + output Zod schemas)
- Cross-cutting auth helpers (`isAdminUser`, `validatePassword`)
- Cross-cutting utilities consumed by both `src/` (web) and `functions/src/`

It is consumed by:

- `src/` (web app) — for types + runtime validation when needed
- `functions/src/` (Cloud Functions) — for `safeParse` on inputs and types on outputs
- Tests in both layers

If a type or schema is needed in more than one layer, it lives here. If only in one layer, it stays there.

## Directory structure

```
packages/shared/
  src/
    schemas/             # All Zod schemas + co-located tests
      report.ts
      report.test.ts
      transaction.ts
      transaction.test.ts
      userWallet.ts
      userWallet.test.ts
      ... (one .ts + one .test.ts per schema)
      firestore-converter.ts  # zodConverter, zTimestamp helpers
    auth/
      admin.ts           # ADMIN_EMAILS + isAdminUser
      password.ts        # validatePassword
    index.ts             # Re-exports the public API
  package.json
  tsconfig.json
  AGENTS.md (this file)
```

## Schema conventions

### Source of truth (ADR-009 / ADR-016 / ADR-018)

```typescript
import { z } from 'zod'

export const ReportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  createdAt: zTimestamp(),
  // ...
})

export type Report = z.infer<typeof ReportSchema>
```

**Never** hand-write a parallel `interface Report` — it drifts. The type is always derived via `z.infer<typeof XSchema>`.

### Zod 4 idioms

Use the top-level format validators:

```typescript
z.email()           // ✅ Zod 4 style
z.url()             // ✅
z.iso.datetime()    // ✅
z.string().email()  // ❌ deprecated, do not use
```

For Firestore timestamps, use `zTimestamp()` from this package (duck-typed for both Admin SDK and Web SDK):

```typescript
import { zTimestamp } from '@adsmart/shared'

const schema = z.object({
  createdAt: zTimestamp(),  // ✅
  updatedAt: z.unknown(),    // ❌ erases the contract
})
```

### Co-located tests are mandatory

Every `foo.ts` schema file must have a `foo.test.ts` next to it. The 4-step flow for schema changes (from root `AGENTS.md`):

1. Update or add a Vitest case in the matching `*.test.ts` next to the schema
2. Run `cd packages/shared && bun run test` and `bun run typecheck` from the root
3. Update `docs/DATA-MODEL.md` — the schema is executable, the markdown follows
4. Add a dated entry to `docs/CHANGES.md`

A schema without a co-located test will be blocked by the `check-zod-schema-test.sh` hook (Fase 0b).

### Strict subsets for client writes

When a document is partially client-writable, export a `.strict()` subset that mirrors `firestore.rules` immutability checks at the type layer:

```typescript
export const UserSchema = z.object({ /* full doc */ })
export const UserClientUpdateSchema = UserSchema.pick({
  displayName: true,
  // only client-mutable fields
}).strict()
```

`firestore.rules` enforces this at runtime; the strict subset enforces it at compile time on the client.

## Auth helpers

### `isAdminUser` (ADR-016)

```typescript
import { isAdminUser } from '@adsmart/shared'

const isAdmin = isAdminUser(request.auth.token, request.auth.token.email)
```

Custom claim `admin === true` is authoritative; the email allowlist is a transition fallback. **Do not** redeclare `ADMIN_EMAILS` arrays anywhere — five copies existed pre-ADR-016 and drifted.

### `validatePassword` (ADR-020)

```typescript
import { validatePassword } from '@adsmart/shared'

const { valid, errors } = validatePassword(pwd)
// errors is i18n-key array; use t() in the UI
```

Both `LoginPage` (signup) and `SettingsPage` (change password) consume this. Do not write a local validator.

## Adding a new schema

1. Create `packages/shared/src/schemas/foo.ts` with `FooSchema` + `export type Foo = z.infer<typeof FooSchema>`.
2. Create `packages/shared/src/schemas/foo.test.ts` with Vitest cases (happy path + at least one rejection).
3. Re-export from `packages/shared/src/index.ts`.
4. Run `cd packages/shared && bun run test` — must be green.
5. Run `bun run typecheck` from root — must be green.
6. Update `docs/DATA-MODEL.md` describing the document and its rules.
7. Add an entry to `docs/CHANGES.md` dated today.

The slash command `/new-zod-schema <name>` (Fase 0b) automates steps 1-3.

## Testing

```bash
cd packages/shared && bun run test    # 195/195 baseline (2026-05-19)
```

Tests are colocated next to source. No mocks needed — schemas are pure functions.

## What NOT to do

- **Do not hand-write parallel `interface`** for any Firestore document — use `z.infer` (ADR-009).
- **Do not use `z.string().email()` / `z.string().url()` / `z.string().datetime()`** — use `z.email()` / `z.url()` / `z.iso.datetime()` (Zod 4 idioms).
- **Do not use `z.unknown()` for Firestore timestamps** — use `zTimestamp()`.
- **Do not commit a schema without a co-located test** — the `check-zod-schema-test.sh` hook blocks this.
- **Do not redeclare `ADMIN_EMAILS`, `isAdminUser`, or `validatePassword`** elsewhere — single source ADR-016 / ADR-020.
- **Do not add Firebase SDK imports here** — `@adsmart/shared` is SDK-agnostic by design. `zTimestamp()` duck-types both Admin and Web SDK Timestamp shapes.
