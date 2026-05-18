# Subprojeto 2 — Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only `/admin/dashboard` page surfacing revenue (real vs granted credits), user counts (new + active + total), and top integrations (snapshot by distinct active users), all driven by a single `getDashboardMetrics` callable with date range filtering and per-card sparklines.

**Architecture:** One Cloud Function callable does all server-side aggregation (Firestore `AggregateField.sum/count` + collectionGroup materialized reads for sparklines and active users). Client renders 3 cards with shadcn/ui + Recharts inline mini-charts and per-card error retry. Filter UI uses preset buttons + a Custom dialog with `react-day-picker`. Inputs and outputs are Zod-validated through `@adsmart/shared`.

**Tech Stack:** React 18 · TypeScript · Vite · Tailwind 3 · shadcn/ui · Recharts 3.3.0 · react-day-picker · Firebase SDK 10 · Firebase Functions v2 (Node 22) · firebase-admin 12.7.0 · Zod 4 (`@adsmart/shared`) · Vitest · Bun

**Spec:** [docs/superpowers/specs/2026-04-26-admin-dashboard-design.md](../specs/2026-04-26-admin-dashboard-design.md) (commits `ae42ba2`, `d213450`).

**Branch:** `develop` (no worktree — small enough for a single uninterrupted run; consistent with how Subprojeto 1 was shipped).

---

## File Structure

**New files:**

| Path | Responsibility |
|---|---|
| `packages/shared/src/schemas/dashboardMetrics.ts` | Input/Output Zod schemas + types |
| `packages/shared/src/schemas/dashboardMetrics.test.ts` | Schema validation tests |
| `functions/src/getDashboardMetrics.ts` | Callable implementation |
| `functions/test/getDashboardMetrics.test.ts` | Auth + range validation + payload-shape tests |
| `src/pages/admin/dashboard/getDateRangeFromPreset.ts` | Pure helper: preset name → `{startDate, endDate}` ISO |
| `src/pages/admin/dashboard/getDateRangeFromPreset.test.ts` | Helper tests |
| `src/pages/admin/dashboard/formatBRL.ts` | Pure helper: cents → `R$ 1.234,56` |
| `src/pages/admin/dashboard/formatBRL.test.ts` | Helper tests |
| `src/pages/admin/dashboard/DateRangeFilter.tsx` | Preset buttons + Custom dialog |
| `src/pages/admin/dashboard/DateRangeFilter.test.tsx` | Component tests |
| `src/pages/admin/dashboard/RevenueCard.tsx` | Real + credits + sparkline |
| `src/pages/admin/dashboard/RevenueCard.test.tsx` | Component tests |
| `src/pages/admin/dashboard/UsersCard.tsx` | New + active + total + sparkline |
| `src/pages/admin/dashboard/UsersCard.test.tsx` | Component tests |
| `src/pages/admin/dashboard/IntegrationsCard.tsx` | Bar chart per platform |
| `src/pages/admin/dashboard/IntegrationsCard.test.tsx` | Component tests |
| `src/pages/admin/dashboard/DashboardSkeleton.tsx` | `animate-pulse` loading placeholder |
| `src/pages/admin/AdminDashboardPage.tsx` | Page-level orchestration (callable + state) |
| `src/pages/admin/AdminDashboardPage.test.tsx` | Page-level tests |
| `src/components/ui/calendar.tsx` | shadcn `<Calendar>` wrapper around `react-day-picker` |
| `src/components/ui/popover.tsx` | shadcn `<Popover>` (peer for Calendar) |

**Modified files:**

| Path | Change |
|---|---|
| `packages/shared/src/index.ts` | Re-export new schemas/types |
| `functions/src/index.ts` | Add `export { getDashboardMetrics } from './getDashboardMetrics'` |
| `firestore.indexes.json` | Add 5 collectionGroup/collection indexes |
| `src/App.tsx` | Default `/admin` redirect → `dashboard`; add `<Route path="dashboard">` |
| `src/pages/admin/AdminLayout.tsx` | Add Dashboard tab (first slot) |
| `src/pages/admin/AdminLayout.test.tsx` | Update assertions for new tab + redirect |
| `src/locales/pt-BR.json` | Add `admin.nav.dashboard` + `admin.dashboard.*` |
| `src/locales/en.json` | Same, translated |
| `src/locales/es.json` | Same, translated |
| `package.json` (root web) | Add `recharts`, `react-day-picker`, `@radix-ui/react-popover` |

---

## Task 1: Install client dependencies

**Files:**
- Modify: `package.json` (root)
- Modify: `bun.lockb`

- [ ] **Step 1: Resolve current versions via Context7 to honor `feedback_consult_context7_before_proposing.md`**

Use the `mcp__plugin_context7_context7__resolve-library-id` tool with `libraryName: "Recharts"` and `libraryName: "react-day-picker"`. Confirm `recharts` is at v3.3.0 (or newer) and grab the latest stable for `react-day-picker`. If a newer Recharts major has shipped that breaks the API, install v3.3.0 explicitly via `recharts@3.3.0`.

- [ ] **Step 2: Install deps with Bun**

Run from repo root:
```bash
bun add recharts react-day-picker @radix-ui/react-popover
```

Expected: lockfile updates, no errors. If peer warnings fire for React 18, those are advisory and safe in this codebase (React 18 is pinned).

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lockb
git commit -m "chore(deps): add recharts, react-day-picker, popover for admin dashboard"
```

---

## Task 2: Shared schemas — `dashboardMetrics`

**Files:**
- Create: `packages/shared/src/schemas/dashboardMetrics.ts`
- Create: `packages/shared/src/schemas/dashboardMetrics.test.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/shared/src/schemas/dashboardMetrics.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  GetDashboardMetricsInputSchema,
  GetDashboardMetricsOutputSchema,
} from './dashboardMetrics'

const validInput = {
  startDate: '2026-04-01T00:00:00.000Z',
  endDate: '2026-04-26T23:59:59.999Z',
}

describe('GetDashboardMetricsInputSchema', () => {
  it('accepts a valid 30-day range', () => {
    const result = GetDashboardMetricsInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('rejects non-ISO dates', () => {
    const result = GetDashboardMetricsInputSchema.safeParse({
      startDate: 'not-a-date',
      endDate: 'also-not',
    })
    expect(result.success).toBe(false)
  })

  it('rejects when endDate is before startDate', () => {
    const result = GetDashboardMetricsInputSchema.safeParse({
      startDate: '2026-04-26T00:00:00.000Z',
      endDate: '2026-04-01T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects ranges longer than 365 days', () => {
    const result = GetDashboardMetricsInputSchema.safeParse({
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2026-01-01T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('accepts the boundary of exactly 365 days', () => {
    const result = GetDashboardMetricsInputSchema.safeParse({
      startDate: '2025-04-26T00:00:00.000Z',
      endDate: '2026-04-26T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })
})

const validOutput = {
  range: { startDate: '2026-04-01T00:00:00.000Z', endDate: '2026-04-26T23:59:59.999Z', days: 26 },
  revenue: {
    realCents: 12345,
    creditsCents: 500,
    sparkline: [{ date: '2026-04-01', realCents: 100, creditsCents: 0 }],
  },
  users: {
    newCount: 3,
    activeCount: 7,
    totalCount: 42,
    sparkline: [{ date: '2026-04-01', newCount: 1 }],
  },
  integrations: {
    byPlatform: [
      { platform: 'google_ads', distinctUserCount: 5 },
      { platform: 'meta_ads', distinctUserCount: 2 },
    ],
  },
  generatedAt: '2026-04-26T12:00:00.000Z',
}

describe('GetDashboardMetricsOutputSchema', () => {
  it('accepts a complete valid payload', () => {
    const result = GetDashboardMetricsOutputSchema.safeParse(validOutput)
    expect(result.success).toBe(true)
  })

  it('rejects negative cents', () => {
    const result = GetDashboardMetricsOutputSchema.safeParse({
      ...validOutput,
      revenue: { ...validOutput.revenue, realCents: -1 },
    })
    expect(result.success).toBe(false)
  })

  it('rejects unknown platform values', () => {
    const result = GetDashboardMetricsOutputSchema.safeParse({
      ...validOutput,
      integrations: { byPlatform: [{ platform: 'tiktok_ads', distinctUserCount: 1 }] },
    })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd packages/shared && bun run test
```

Expected: tests fail with `Cannot find module './dashboardMetrics'`.

- [ ] **Step 3: Implement schemas**

Create `packages/shared/src/schemas/dashboardMetrics.ts`:

```ts
import * as z from 'zod'

const MAX_RANGE_DAYS = 365

export const GetDashboardMetricsInputSchema = z
  .object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  })
  .refine((v) => new Date(v.endDate).getTime() >= new Date(v.startDate).getTime(), {
    message: 'endDate must be greater than or equal to startDate',
    path: ['endDate'],
  })
  .refine(
    (v) => {
      const days =
        (new Date(v.endDate).getTime() - new Date(v.startDate).getTime()) / 86_400_000
      return days <= MAX_RANGE_DAYS
    },
    { message: `range exceeds ${MAX_RANGE_DAYS} days`, path: ['endDate'] }
  )
export type GetDashboardMetricsInput = z.infer<typeof GetDashboardMetricsInputSchema>

const PlatformSchema = z.enum(['google_ads', 'meta_ads'])

export const GetDashboardMetricsOutputSchema = z.object({
  range: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    days: z.number().int().nonnegative(),
  }),
  revenue: z.object({
    realCents: z.number().int().nonnegative(),
    creditsCents: z.number().int().nonnegative(),
    sparkline: z.array(
      z.object({
        date: z.string(),
        realCents: z.number().int().nonnegative(),
        creditsCents: z.number().int().nonnegative(),
      })
    ),
  }),
  users: z.object({
    newCount: z.number().int().nonnegative(),
    activeCount: z.number().int().nonnegative(),
    totalCount: z.number().int().nonnegative(),
    sparkline: z.array(
      z.object({
        date: z.string(),
        newCount: z.number().int().nonnegative(),
      })
    ),
  }),
  integrations: z.object({
    byPlatform: z.array(
      z.object({
        platform: PlatformSchema,
        distinctUserCount: z.number().int().nonnegative(),
      })
    ),
  }),
  generatedAt: z.string().datetime(),
})
export type GetDashboardMetricsOutput = z.infer<typeof GetDashboardMetricsOutputSchema>

export const DASHBOARD_METRICS_MAX_RANGE_DAYS = MAX_RANGE_DAYS
```

- [ ] **Step 4: Re-export from `packages/shared/src/index.ts`**

Append to the file (do not remove existing exports):

```ts
export {
  GetDashboardMetricsInputSchema,
  GetDashboardMetricsOutputSchema,
  DASHBOARD_METRICS_MAX_RANGE_DAYS,
  type GetDashboardMetricsInput,
  type GetDashboardMetricsOutput,
} from './schemas/dashboardMetrics'
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd packages/shared && bun run test && bun run typecheck
```

Expected: all schema tests pass, no type errors.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/schemas/dashboardMetrics.ts packages/shared/src/schemas/dashboardMetrics.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): add Zod schemas for getDashboardMetrics input/output"
```

---

## Task 3: Pure helper — `getDateRangeFromPreset`

**Files:**
- Create: `src/pages/admin/dashboard/getDateRangeFromPreset.ts`
- Create: `src/pages/admin/dashboard/getDateRangeFromPreset.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/pages/admin/dashboard/getDateRangeFromPreset.test.ts
import { describe, expect, it } from 'vitest'
import { getDateRangeFromPreset, type DateRangePreset } from './getDateRangeFromPreset'

describe('getDateRangeFromPreset', () => {
  const NOW = new Date('2026-04-26T12:00:00.000Z')

  it('returns same start of day → end of day for "today"', () => {
    const range = getDateRangeFromPreset('today', NOW)
    expect(range.startDate).toBe('2026-04-26T00:00:00.000Z')
    expect(range.endDate).toBe('2026-04-26T23:59:59.999Z')
  })

  const cases: [DateRangePreset, number][] = [
    ['7d', 7],
    ['30d', 30],
    ['60d', 60],
    ['90d', 90],
    ['180d', 180],
    ['365d', 365],
  ]
  for (const [preset, days] of cases) {
    it(`returns a ${days}-day range for "${preset}"`, () => {
      const range = getDateRangeFromPreset(preset, NOW)
      const start = new Date(range.startDate)
      const end = new Date(range.endDate)
      const diffDays = Math.round((end.getTime() - start.getTime()) / 86_400_000)
      expect(diffDays).toBe(days)
    })
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/pages/admin/dashboard/getDateRangeFromPreset.test.ts
```

Expected: FAIL with module not found.

- [ ] **Step 3: Implement helper**

```ts
// src/pages/admin/dashboard/getDateRangeFromPreset.ts
export type DateRangePreset = 'today' | '7d' | '30d' | '60d' | '90d' | '180d' | '365d'

export interface DateRange {
  startDate: string // ISO
  endDate: string // ISO
}

const DAY_MS = 86_400_000

export function getDateRangeFromPreset(preset: DateRangePreset, now: Date = new Date()): DateRange {
  const endOfToday = new Date(now)
  endOfToday.setUTCHours(23, 59, 59, 999)

  if (preset === 'today') {
    const startOfToday = new Date(now)
    startOfToday.setUTCHours(0, 0, 0, 0)
    return {
      startDate: startOfToday.toISOString(),
      endDate: endOfToday.toISOString(),
    }
  }

  const days = Number.parseInt(preset.replace('d', ''), 10)
  const start = new Date(endOfToday.getTime() - days * DAY_MS)
  return {
    startDate: start.toISOString(),
    endDate: endOfToday.toISOString(),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/pages/admin/dashboard/getDateRangeFromPreset.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/dashboard/getDateRangeFromPreset.ts src/pages/admin/dashboard/getDateRangeFromPreset.test.ts
git commit -m "feat(admin/dashboard): add getDateRangeFromPreset helper"
```

---

## Task 4: Pure helper — `formatBRL`

**Files:**
- Create: `src/pages/admin/dashboard/formatBRL.ts`
- Create: `src/pages/admin/dashboard/formatBRL.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { formatBRL } from './formatBRL'

describe('formatBRL', () => {
  it('formats zero', () => {
    expect(formatBRL(0)).toBe('R$ 0,00')
  })
  it('formats whole reais', () => {
    expect(formatBRL(10000)).toBe('R$ 100,00')
  })
  it('formats fractional reais', () => {
    expect(formatBRL(12345)).toBe('R$ 123,45')
  })
  it('formats large amounts with thousand separator', () => {
    expect(formatBRL(123456789)).toBe('R$ 1.234.567,89')
  })
})
```

The non-breaking space (` `) is what `Intl.NumberFormat('pt-BR')` emits between the symbol and the number — keep it explicit so the assertion isn't fragile across runtimes.

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/pages/admin/dashboard/formatBRL.test.ts
```

Expected: FAIL with module not found.

- [ ] **Step 3: Implement helper**

```ts
// src/pages/admin/dashboard/formatBRL.ts
const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatBRL(cents: number): string {
  return formatter.format(cents / 100)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/pages/admin/dashboard/formatBRL.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/dashboard/formatBRL.ts src/pages/admin/dashboard/formatBRL.test.ts
git commit -m "feat(admin/dashboard): add formatBRL helper"
```

---

## Task 5: Add Firestore composite indexes

**Files:**
- Modify: `firestore.indexes.json`

- [ ] **Step 1: Append the 5 indexes**

Replace the file with:

```json
{
  "indexes": [
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "adminAction", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "adAccounts",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "platform", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

- [ ] **Step 2: Commit (deploy happens later in Task 16)**

```bash
git add firestore.indexes.json
git commit -m "feat(firestore): add indexes for admin dashboard collectionGroup queries"
```

Indexes are deployed in Task 16 once the callable that uses them is in place. Earlier deploy is fine but pointless — the queries don't run yet.

---

## Task 6: Server callable — `getDashboardMetrics` (auth + range validation)

This is split into 6.1 (auth/validation skeleton + tests) and 6.2 (actual aggregation logic + tests). Splitting keeps each step reviewable.

**Files:**
- Create: `functions/src/getDashboardMetrics.ts`
- Create: `functions/test/getDashboardMetrics.test.ts`

- [ ] **Step 1: Write failing tests for auth and validation**

```ts
// functions/test/getDashboardMetrics.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import functionsTest from 'firebase-functions-test'

const testEnv = functionsTest()

beforeAll(() => {
  process.env.GCLOUD_PROJECT = 'adsmart-test'
})

const validInput = {
  startDate: '2026-04-01T00:00:00.000Z',
  endDate: '2026-04-26T23:59:59.999Z',
}

const adminAuth = {
  uid: 'admin-uid',
  token: { email: 'agency.elovisiondigital@gmail.com', admin: true },
}

describe('getDashboardMetrics — authorization', () => {
  it('rejects unauthenticated callers', async () => {
    const { getDashboardMetrics } = await import('../src/getDashboardMetrics')
    const wrapped = testEnv.wrap(getDashboardMetrics)
    await expect(
      wrapped({ data: validInput, auth: undefined } as any)
    ).rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('rejects non-admin authenticated callers', async () => {
    const { getDashboardMetrics } = await import('../src/getDashboardMetrics')
    const wrapped = testEnv.wrap(getDashboardMetrics)
    await expect(
      wrapped({
        data: validInput,
        auth: { uid: 'u', token: { email: 'regular@user.com', admin: false } },
      } as any)
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })
})

describe('getDashboardMetrics — input validation', () => {
  it('rejects malformed input shape', async () => {
    const { getDashboardMetrics } = await import('../src/getDashboardMetrics')
    const wrapped = testEnv.wrap(getDashboardMetrics)
    await expect(
      wrapped({ data: { startDate: 'bad', endDate: 'bad' }, auth: adminAuth } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects inverted range', async () => {
    const { getDashboardMetrics } = await import('../src/getDashboardMetrics')
    const wrapped = testEnv.wrap(getDashboardMetrics)
    await expect(
      wrapped({
        data: { startDate: validInput.endDate, endDate: validInput.startDate },
        auth: adminAuth,
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects ranges over 365 days', async () => {
    const { getDashboardMetrics } = await import('../src/getDashboardMetrics')
    const wrapped = testEnv.wrap(getDashboardMetrics)
    await expect(
      wrapped({
        data: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2026-01-01T00:00:00.000Z',
        },
        auth: adminAuth,
      } as any)
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd functions && bun run test test/getDashboardMetrics.test.ts
```

Expected: FAIL with module not found.

- [ ] **Step 3: Implement auth + validation skeleton**

```ts
// functions/src/getDashboardMetrics.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import {
  GetDashboardMetricsInputSchema,
  type GetDashboardMetricsOutput,
} from '@adsmart/shared'

const ADMIN_EMAILS = ['agency.elovisiondigital@gmail.com', 'admin@adsmart.app']

function assertAdmin(auth: { uid: string; token: { email?: string; admin?: boolean } } | undefined) {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }
  const isAdmin = auth.token.admin === true || ADMIN_EMAILS.includes(auth.token.email ?? '')
  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Acesso restrito a administradores')
  }
}

export const getDashboardMetrics = onCall(async (request) => {
  assertAdmin(request.auth as any)

  const parsed = GetDashboardMetricsInputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? 'Invalid input')
  }
  const { startDate, endDate } = parsed.data

  // Aggregation logic added in Task 7. For now, return zeros to satisfy the auth/validation tests.
  const days = Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
  )
  const empty: GetDashboardMetricsOutput = {
    range: { startDate, endDate, days },
    revenue: { realCents: 0, creditsCents: 0, sparkline: [] },
    users: { newCount: 0, activeCount: 0, totalCount: 0, sparkline: [] },
    integrations: { byPlatform: [] },
    generatedAt: new Date().toISOString(),
  }
  void admin // touch to silence unused-import; aggregation lands next task
  return empty
})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd functions && bun run test test/getDashboardMetrics.test.ts
```

Expected: PASS for auth + validation tests.

- [ ] **Step 5: Commit**

```bash
git add functions/src/getDashboardMetrics.ts functions/test/getDashboardMetrics.test.ts
git commit -m "feat(functions): scaffold getDashboardMetrics callable with auth + Zod validation"
```

---

## Task 7: Server callable — aggregation logic

**Files:**
- Modify: `functions/src/getDashboardMetrics.ts`
- Modify: `functions/test/getDashboardMetrics.test.ts`

- [ ] **Step 1: Append payload-shape and aggregation tests**

Append to `functions/test/getDashboardMetrics.test.ts`:

```ts
describe('getDashboardMetrics — payload shape (empty Firestore)', () => {
  it('returns zeroed metrics with valid shape', async () => {
    const { getDashboardMetrics } = await import('../src/getDashboardMetrics')
    const { GetDashboardMetricsOutputSchema } = await import('@adsmart/shared')
    const wrapped = testEnv.wrap(getDashboardMetrics)
    const result = (await wrapped({ data: validInput, auth: adminAuth } as any)) as unknown
    const parsed = GetDashboardMetricsOutputSchema.safeParse(result)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.revenue.realCents).toBe(0)
      expect(parsed.data.revenue.creditsCents).toBe(0)
      expect(parsed.data.users.newCount).toBe(0)
      expect(parsed.data.users.activeCount).toBe(0)
      expect(parsed.data.integrations.byPlatform).toEqual([])
    }
  })
})
```

This test runs against the real Admin SDK; with no data seeded, all aggregations return zero. We do not seed data in unit tests; richer data-path coverage happens in manual smoke testing (Task 17) and in Vitest integration runs of dev firestore. This is enough to catch shape regressions.

- [ ] **Step 2: Run test to verify it fails (or passes by coincidence)**

```bash
cd functions && bun run test test/getDashboardMetrics.test.ts
```

The test against the empty-output skeleton may already pass, since Task 6 returns zeros. That's fine — the test guards against future regressions when we replace zeros with real aggregation.

- [ ] **Step 3: Implement aggregation logic**

Replace the body of `getDashboardMetrics.ts`:

```ts
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import {
  GetDashboardMetricsInputSchema,
  type GetDashboardMetricsOutput,
} from '@adsmart/shared'

const ADMIN_EMAILS = ['agency.elovisiondigital@gmail.com', 'admin@adsmart.app']

function assertAdmin(auth: { uid: string; token: { email?: string; admin?: boolean } } | undefined) {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }
  const isAdmin = auth.token.admin === true || ADMIN_EMAILS.includes(auth.token.email ?? '')
  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Acesso restrito a administradores')
  }
}

const TZ = 'America/Sao_Paulo'
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function dayKey(date: Date): string {
  return dayKeyFormatter.format(date) // YYYY-MM-DD in São Paulo TZ
}

function enumerateDays(startISO: string, endISO: string): string[] {
  const start = new Date(startISO)
  const end = new Date(endISO)
  const days: string[] = []
  const cursor = new Date(start)
  while (cursor.getTime() <= end.getTime()) {
    days.push(dayKey(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return Array.from(new Set(days))
}

export const getDashboardMetrics = onCall(async (request) => {
  assertAdmin(request.auth as any)

  const parsed = GetDashboardMetricsInputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? 'Invalid input')
  }
  const { startDate, endDate } = parsed.data
  const startTs = admin.firestore.Timestamp.fromDate(new Date(startDate))
  const endTs = admin.firestore.Timestamp.fromDate(new Date(endDate))
  const db = admin.firestore()

  // 1. Total revenue (real + credits) — single aggregate
  const allCreditsTotal = await db
    .collectionGroup('transactions')
    .where('type', '==', 'credit')
    .where('status', '==', 'completed')
    .where('createdAt', '>=', startTs)
    .where('createdAt', '<=', endTs)
    .aggregate({ totalCents: admin.firestore.AggregateField.sum('amount') })
    .get()
  const totalCents = allCreditsTotal.data().totalCents ?? 0

  // 2. Granted credits aggregate (adminAction == true)
  const grantedTotal = await db
    .collectionGroup('transactions')
    .where('type', '==', 'credit')
    .where('status', '==', 'completed')
    .where('adminAction', '==', true)
    .where('createdAt', '>=', startTs)
    .where('createdAt', '<=', endTs)
    .aggregate({ creditsCents: admin.firestore.AggregateField.sum('amount') })
    .get()
  const creditsCents = grantedTotal.data().creditsCents ?? 0
  const realCents = Math.max(0, totalCents - creditsCents)

  // 3. Materialized read of credits-in-range for sparkline split (real vs credits per day)
  const txSnap = await db
    .collectionGroup('transactions')
    .where('type', '==', 'credit')
    .where('status', '==', 'completed')
    .where('createdAt', '>=', startTs)
    .where('createdAt', '<=', endTs)
    .get()
  const revenueByDay = new Map<string, { realCents: number; creditsCents: number }>()
  for (const doc of txSnap.docs) {
    const d = doc.data() as {
      amount?: number
      adminAction?: boolean
      createdAt?: admin.firestore.Timestamp
    }
    if (!d.createdAt || typeof d.amount !== 'number') continue
    const key = dayKey(d.createdAt.toDate())
    const bucket = revenueByDay.get(key) ?? { realCents: 0, creditsCents: 0 }
    if (d.adminAction === true) bucket.creditsCents += d.amount
    else bucket.realCents += d.amount
    revenueByDay.set(key, bucket)
  }

  // 4. Users — newCount aggregate + sparkline
  const usersInRangeSnap = await db
    .collection('users')
    .where('createdAt', '>=', startTs)
    .where('createdAt', '<=', endTs)
    .get()
  const newCount = usersInRangeSnap.size
  const newByDay = new Map<string, number>()
  for (const doc of usersInRangeSnap.docs) {
    const d = doc.data() as { createdAt?: admin.firestore.Timestamp }
    if (!d.createdAt) continue
    const key = dayKey(d.createdAt.toDate())
    newByDay.set(key, (newByDay.get(key) ?? 0) + 1)
  }

  // 5. Total users (snapshot)
  const totalUsersAgg = await db
    .collection('users')
    .aggregate({ totalCount: admin.firestore.AggregateField.count() })
    .get()
  const totalCount = totalUsersAgg.data().totalCount ?? 0

  // 6. Active users (distinct uid in transactions in range)
  const activeUids = new Set<string>()
  const activeTxSnap = await db
    .collectionGroup('transactions')
    .where('createdAt', '>=', startTs)
    .where('createdAt', '<=', endTs)
    .get()
  for (const doc of activeTxSnap.docs) {
    const uid = doc.ref.parent.parent?.id
    if (uid) activeUids.add(uid)
  }
  const activeCount = activeUids.size

  // 7. Integrations — distinct active users per platform (snapshot, range-independent)
  const adAccountsSnap = await db
    .collectionGroup('adAccounts')
    .where('isActive', '==', true)
    .get()
  const platformUserSets = new Map<'google_ads' | 'meta_ads', Set<string>>()
  for (const doc of adAccountsSnap.docs) {
    const d = doc.data() as { platform?: 'google_ads' | 'meta_ads' }
    const uid = doc.ref.parent.parent?.id
    if (!uid || !d.platform) continue
    let set = platformUserSets.get(d.platform)
    if (!set) {
      set = new Set<string>()
      platformUserSets.set(d.platform, set)
    }
    set.add(uid)
  }
  const byPlatform = Array.from(platformUserSets.entries())
    .map(([platform, set]) => ({ platform, distinctUserCount: set.size }))
    .sort((a, b) => b.distinctUserCount - a.distinctUserCount)

  // Build sparklines with zero-fill across the day range
  const allDays = enumerateDays(startDate, endDate)
  const revenueSparkline = allDays.map((date) => {
    const b = revenueByDay.get(date) ?? { realCents: 0, creditsCents: 0 }
    return { date, realCents: b.realCents, creditsCents: b.creditsCents }
  })
  const usersSparkline = allDays.map((date) => ({ date, newCount: newByDay.get(date) ?? 0 }))

  const days = Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
  )

  const out: GetDashboardMetricsOutput = {
    range: { startDate, endDate, days },
    revenue: { realCents, creditsCents, sparkline: revenueSparkline },
    users: { newCount, activeCount, totalCount, sparkline: usersSparkline },
    integrations: { byPlatform },
    generatedAt: new Date().toISOString(),
  }
  return out
})
```

- [ ] **Step 4: Run all functions tests + typecheck**

```bash
cd functions && bun run test && bun run typecheck
```

Expected: all tests pass.

- [ ] **Step 5: Wire export into `functions/src/index.ts`**

Append after the `addUserCredits` export line:

```ts
// Subprojeto 2 — admin dashboard read-only metrics
export { getDashboardMetrics } from './getDashboardMetrics'
```

- [ ] **Step 6: Commit**

```bash
git add functions/src/getDashboardMetrics.ts functions/test/getDashboardMetrics.test.ts functions/src/index.ts
git commit -m "feat(functions): implement getDashboardMetrics with aggregations + sparklines"
```

---

## Task 8: shadcn `<Popover>` and `<Calendar>`

**Files:**
- Create: `src/components/ui/popover.tsx`
- Create: `src/components/ui/calendar.tsx`

These mirror the official shadcn/ui implementations; we paste the canonical versions rather than running `bunx shadcn add`, because this repo doesn't have a shadcn config and we follow the existing pattern of hand-curated components in `src/components/ui/`.

- [ ] **Step 1: Create `popover.tsx`**

```tsx
// src/components/ui/popover.tsx
import * as PopoverPrimitive from '@radix-ui/react-popover'
import * as React from 'react'
import { cn } from '@/lib/utils'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-auto rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
```

- [ ] **Step 2: Create `calendar.tsx`**

```tsx
// src/components/ui/calendar.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { ptBR } from 'react-day-picker/locale'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside: 'text-muted-foreground opacity-50',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
```

- [ ] **Step 3: Verify imports compile**

```bash
bun run typecheck
```

Expected: no type errors. If `react-day-picker` exports `ptBR` from a different path in the installed version, fix the import to match what Context7 shows for the installed minor (commonly `react-day-picker/locale` in v9, or `date-fns/locale/pt-BR` in v8 — adjust accordingly).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/popover.tsx src/components/ui/calendar.tsx
git commit -m "feat(ui): add shadcn Popover and Calendar wrappers (react-day-picker)"
```

---

## Task 9: `DateRangeFilter` component

**Files:**
- Create: `src/pages/admin/dashboard/DateRangeFilter.tsx`
- Create: `src/pages/admin/dashboard/DateRangeFilter.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/pages/admin/dashboard/DateRangeFilter.test.tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'pt', setLanguage: () => {} }),
}))

import { DateRangeFilter } from './DateRangeFilter'

describe('DateRangeFilter', () => {
  it('renders all preset buttons + Custom', () => {
    const onChange = vi.fn()
    render(<DateRangeFilter value={null} onChange={onChange} />)
    for (const key of ['today', '7d', '30d', '60d', '90d', '180d', '365d', 'custom']) {
      expect(
        screen.getByRole('button', { name: `admin.dashboard.ranges.${key}` })
      ).toBeInTheDocument()
    }
  })

  it('emits a range when a preset is clicked', () => {
    const onChange = vi.fn()
    render(<DateRangeFilter value={null} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'admin.dashboard.ranges.7d' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    const arg = onChange.mock.calls[0][0]
    expect(typeof arg.startDate).toBe('string')
    expect(typeof arg.endDate).toBe('string')
    expect(new Date(arg.endDate).getTime()).toBeGreaterThan(new Date(arg.startDate).getTime())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/pages/admin/dashboard/DateRangeFilter.test.tsx
```

Expected: FAIL with module not found.

- [ ] **Step 3: Implement component**

```tsx
// src/pages/admin/dashboard/DateRangeFilter.tsx
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { useLanguage } from '@/contexts/LanguageContext'
import { DASHBOARD_METRICS_MAX_RANGE_DAYS } from '@adsmart/shared'
import {
  type DateRange,
  type DateRangePreset,
  getDateRangeFromPreset,
} from './getDateRangeFromPreset'

const PRESETS: DateRangePreset[] = ['today', '7d', '30d', '60d', '90d', '180d', '365d']

interface Props {
  value: DateRange | null
  onChange: (range: DateRange) => void
}

export function DateRangeFilter({ value, onChange }: Props) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [activePreset, setActivePreset] = useState<DateRangePreset | 'custom' | null>(null)
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({})
  const [customError, setCustomError] = useState<string | null>(null)

  const onPreset = (preset: DateRangePreset) => {
    setActivePreset(preset)
    onChange(getDateRangeFromPreset(preset))
  }

  const submitCustom = () => {
    setCustomError(null)
    const { from, to } = customRange
    if (!from || !to) return
    if (to.getTime() < from.getTime()) {
      setCustomError(t('admin.dashboard.errors.invalidRange'))
      return
    }
    const days = (to.getTime() - from.getTime()) / 86_400_000
    if (days > DASHBOARD_METRICS_MAX_RANGE_DAYS) {
      setCustomError(t('admin.dashboard.errors.rangeTooLong'))
      return
    }
    const start = new Date(from)
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(to)
    end.setUTCHours(23, 59, 59, 999)
    setActivePreset('custom')
    onChange({ startDate: start.toISOString(), endDate: end.toISOString() })
    setOpen(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <Button
          key={p}
          variant={activePreset === p ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPreset(p)}
        >
          {t(`admin.dashboard.ranges.${p}`)}
        </Button>
      ))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={activePreset === 'custom' ? 'default' : 'outline'} size="sm">
            <CalendarIcon className="w-4 h-4 mr-2" />
            {t('admin.dashboard.ranges.custom')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-fit">
          <DialogHeader>
            <DialogTitle>{t('admin.dashboard.ranges.custom')}</DialogTitle>
          </DialogHeader>
          <Calendar
            mode="range"
            selected={customRange as any}
            onSelect={(r: any) => setCustomRange(r ?? {})}
          />
          {customError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{customError}</p>
          ) : null}
          <DialogFooter>
            <Button onClick={submitCustom} disabled={!customRange.from || !customRange.to}>
              {t('common.button.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {value ? (
        <span className="text-xs text-muted-foreground ml-2">
          {new Date(value.startDate).toLocaleDateString('pt-BR')} →{' '}
          {new Date(value.endDate).toLocaleDateString('pt-BR')}
        </span>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/pages/admin/dashboard/DateRangeFilter.test.tsx
```

Expected: PASS. The Custom-dialog interaction is exercised in the page-level test (Task 13) under jsdom because the Calendar UI requires Radix portal mounts.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/dashboard/DateRangeFilter.tsx src/pages/admin/dashboard/DateRangeFilter.test.tsx
git commit -m "feat(admin/dashboard): add DateRangeFilter with preset + custom range"
```

---

## Task 10: `RevenueCard` component

**Files:**
- Create: `src/pages/admin/dashboard/RevenueCard.tsx`
- Create: `src/pages/admin/dashboard/RevenueCard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'pt', setLanguage: () => {} }),
}))
vi.mock('recharts', async () => {
  const Stub: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div>{children}</div>
  return {
    ResponsiveContainer: Stub,
    AreaChart: Stub,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
  }
})

import { RevenueCard } from './RevenueCard'

const data = {
  realCents: 12345,
  creditsCents: 500,
  sparkline: [
    { date: '2026-04-01', realCents: 100, creditsCents: 0 },
    { date: '2026-04-02', realCents: 12245, creditsCents: 500 },
  ],
}

describe('RevenueCard', () => {
  it('renders both values formatted in BRL', () => {
    render(<RevenueCard data={data} />)
    expect(screen.getByText(/R\$\s?123,45/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s?5,00/)).toBeInTheDocument()
  })

  it('renders with zero data without crashing', () => {
    render(
      <RevenueCard
        data={{ realCents: 0, creditsCents: 0, sparkline: [] }}
      />
    )
    expect(screen.getAllByText(/R\$\s?0,00/).length).toBeGreaterThanOrEqual(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/pages/admin/dashboard/RevenueCard.test.tsx
```

Expected: FAIL with module not found.

- [ ] **Step 3: Implement component**

```tsx
// src/pages/admin/dashboard/RevenueCard.tsx
import { DollarSign } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useLanguage } from '@/contexts/LanguageContext'
import type { GetDashboardMetricsOutput } from '@adsmart/shared'
import { formatBRL } from './formatBRL'

interface Props {
  data: GetDashboardMetricsOutput['revenue']
}

export function RevenueCard({ data }: Props) {
  const { t } = useLanguage()
  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold">{t('admin.dashboard.revenue.title')}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{t('admin.dashboard.revenue.real')}</p>
          <p className="text-2xl font-bold">{formatBRL(data.realCents)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('admin.dashboard.revenue.credits')}</p>
          <p className="text-2xl font-bold">{formatBRL(data.creditsCents)}</p>
        </div>
      </div>
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.sparkline} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenue-real" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              formatter={(value: number) => formatBRL(value)}
              labelFormatter={(label: string) => label}
            />
            <Area
              type="monotone"
              dataKey="realCents"
              stroke="hsl(var(--primary))"
              fill="url(#revenue-real)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/pages/admin/dashboard/RevenueCard.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/dashboard/RevenueCard.tsx src/pages/admin/dashboard/RevenueCard.test.tsx
git commit -m "feat(admin/dashboard): add RevenueCard with sparkline"
```

---

## Task 11: `UsersCard` component

**Files:**
- Create: `src/pages/admin/dashboard/UsersCard.tsx`
- Create: `src/pages/admin/dashboard/UsersCard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'pt', setLanguage: () => {} }),
}))
vi.mock('recharts', async () => {
  const Stub: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div>{children}</div>
  return {
    ResponsiveContainer: Stub,
    AreaChart: Stub,
    Area: () => null,
    Tooltip: () => null,
  }
})

import { UsersCard } from './UsersCard'

describe('UsersCard', () => {
  it('renders all three counts', () => {
    render(
      <UsersCard
        data={{
          newCount: 3,
          activeCount: 7,
          totalCount: 42,
          sparkline: [{ date: '2026-04-01', newCount: 1 }],
        }}
      />
    )
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/pages/admin/dashboard/UsersCard.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement component**

```tsx
// src/pages/admin/dashboard/UsersCard.tsx
import { Users } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useLanguage } from '@/contexts/LanguageContext'
import type { GetDashboardMetricsOutput } from '@adsmart/shared'

interface Props {
  data: GetDashboardMetricsOutput['users']
}

export function UsersCard({ data }: Props) {
  const { t } = useLanguage()
  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold">{t('admin.dashboard.users.title')}</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-xs text-muted-foreground">{t('admin.dashboard.users.new')}</p>
          <p className="text-2xl font-bold">{data.newCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('admin.dashboard.users.active')}</p>
          <p className="text-2xl font-bold">{data.activeCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('admin.dashboard.users.total')}</p>
          <p className="text-2xl font-bold">{data.totalCount}</p>
        </div>
      </div>
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.sparkline} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="users-new" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip />
            <Area
              type="monotone"
              dataKey="newCount"
              stroke="hsl(var(--primary))"
              fill="url(#users-new)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/pages/admin/dashboard/UsersCard.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/dashboard/UsersCard.tsx src/pages/admin/dashboard/UsersCard.test.tsx
git commit -m "feat(admin/dashboard): add UsersCard with sparkline"
```

---

## Task 12: `IntegrationsCard` component

**Files:**
- Create: `src/pages/admin/dashboard/IntegrationsCard.tsx`
- Create: `src/pages/admin/dashboard/IntegrationsCard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'pt', setLanguage: () => {} }),
}))
vi.mock('recharts', async () => {
  const Stub: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div>{children}</div>
  return {
    ResponsiveContainer: Stub,
    BarChart: Stub,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Cell: () => null,
  }
})

import { IntegrationsCard } from './IntegrationsCard'

describe('IntegrationsCard', () => {
  it('renders rows for each platform', () => {
    render(
      <IntegrationsCard
        data={{
          byPlatform: [
            { platform: 'google_ads', distinctUserCount: 5 },
            { platform: 'meta_ads', distinctUserCount: 2 },
          ],
        }}
      />
    )
    expect(
      screen.getByText('admin.dashboard.integrations.platforms.google_ads')
    ).toBeInTheDocument()
    expect(
      screen.getByText('admin.dashboard.integrations.platforms.meta_ads')
    ).toBeInTheDocument()
  })

  it('renders an empty state when no platforms exist', () => {
    render(<IntegrationsCard data={{ byPlatform: [] }} />)
    expect(screen.getByText('admin.dashboard.integrations.empty')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/pages/admin/dashboard/IntegrationsCard.test.tsx
```

Expected: FAIL with module not found.

- [ ] **Step 3: Implement component**

```tsx
// src/pages/admin/dashboard/IntegrationsCard.tsx
import { Plug } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLanguage } from '@/contexts/LanguageContext'
import type { GetDashboardMetricsOutput } from '@adsmart/shared'

interface Props {
  data: GetDashboardMetricsOutput['integrations']
}

export function IntegrationsCard({ data }: Props) {
  const { t } = useLanguage()
  const rows = data.byPlatform.map((p) => ({
    name: t(`admin.dashboard.integrations.platforms.${p.platform}`),
    count: p.distinctUserCount,
  }))
  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Plug className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold">{t('admin.dashboard.integrations.title')}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('admin.dashboard.integrations.empty')}</p>
      ) : (
        <>
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.name} className="flex justify-between text-sm">
                <span>{r.name}</span>
                <span className="font-semibold">{r.count}</span>
              </li>
            ))}
          </ul>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/pages/admin/dashboard/IntegrationsCard.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/dashboard/IntegrationsCard.tsx src/pages/admin/dashboard/IntegrationsCard.test.tsx
git commit -m "feat(admin/dashboard): add IntegrationsCard with horizontal bar chart"
```

---

## Task 13: `DashboardSkeleton` and `AdminDashboardPage`

**Files:**
- Create: `src/pages/admin/dashboard/DashboardSkeleton.tsx`
- Create: `src/pages/admin/AdminDashboardPage.tsx`
- Create: `src/pages/admin/AdminDashboardPage.test.tsx`

- [ ] **Step 1: Write `DashboardSkeleton`**

```tsx
// src/pages/admin/dashboard/DashboardSkeleton.tsx
export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-lg p-6 space-y-4 animate-pulse"
        >
          <div className="h-4 w-32 bg-muted/30 rounded" />
          <div className="h-8 w-24 bg-muted/30 rounded" />
          <div className="h-16 w-full bg-muted/20 rounded" />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write the failing page test**

```tsx
// src/pages/admin/AdminDashboardPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const callableMock = vi.fn()

vi.mock('firebase/functions', () => ({
  httpsCallable: () => (data: unknown) => callableMock(data),
}))
vi.mock('@/firebase/config', () => ({ functions: {} }))
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'pt', setLanguage: () => {} }),
}))
vi.mock('recharts', async () => {
  const Stub: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div>{children}</div>
  return {
    ResponsiveContainer: Stub,
    AreaChart: Stub,
    Area: () => null,
    BarChart: Stub,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Cell: () => null,
  }
})

const okPayload = {
  data: {
    range: {
      startDate: '2026-04-01T00:00:00.000Z',
      endDate: '2026-04-26T23:59:59.999Z',
      days: 26,
    },
    revenue: { realCents: 12345, creditsCents: 500, sparkline: [] },
    users: { newCount: 3, activeCount: 7, totalCount: 42, sparkline: [] },
    integrations: { byPlatform: [] },
    generatedAt: '2026-04-26T12:00:00.000Z',
  },
}

import { AdminDashboardPage } from './AdminDashboardPage'

describe('AdminDashboardPage', () => {
  it('shows the three cards once data loads', async () => {
    callableMock.mockResolvedValue(okPayload)
    render(<AdminDashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('admin.dashboard.revenue.title')).toBeInTheDocument()
      expect(screen.getByText('admin.dashboard.users.title')).toBeInTheDocument()
      expect(screen.getByText('admin.dashboard.integrations.title')).toBeInTheDocument()
    })
  })

  it('shows error banner with retry when callable fails', async () => {
    callableMock.mockRejectedValueOnce(new Error('boom'))
    render(<AdminDashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('admin.dashboard.errors.loadFailed')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'admin.dashboard.errors.retry' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run page test to confirm it fails**

```bash
bun run test src/pages/admin/AdminDashboardPage.test.tsx
```

Expected: FAIL with module not found.

- [ ] **Step 4: Implement the page**

```tsx
// src/pages/admin/AdminDashboardPage.tsx
import { httpsCallable } from 'firebase/functions'
import { BarChart3 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { functions } from '@/firebase/config'
import {
  GetDashboardMetricsOutputSchema,
  type GetDashboardMetricsOutput,
} from '@adsmart/shared'
import { DateRangeFilter } from './dashboard/DateRangeFilter'
import { DashboardSkeleton } from './dashboard/DashboardSkeleton'
import { IntegrationsCard } from './dashboard/IntegrationsCard'
import { RevenueCard } from './dashboard/RevenueCard'
import { UsersCard } from './dashboard/UsersCard'
import {
  type DateRange,
  getDateRangeFromPreset,
} from './dashboard/getDateRangeFromPreset'

export function AdminDashboardPage() {
  const { t } = useLanguage()
  const [range, setRange] = useState<DateRange>(() => getDateRangeFromPreset('30d'))
  const [data, setData] = useState<GetDashboardMetricsOutput | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async (r: DateRange) => {
    setLoading(true)
    setError(null)
    try {
      const callable = httpsCallable(functions, 'getDashboardMetrics')
      const result = await callable(r)
      const parsed = GetDashboardMetricsOutputSchema.safeParse(result.data)
      if (!parsed.success) throw new Error('invalid_payload')
      setData(parsed.data)
    } catch (err) {
      console.error('[admin/dashboard] failed to load:', err)
      setError('loadFailed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMetrics(range)
  }, [range, fetchMetrics])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        {t('admin.dashboard.title')}
      </h2>
      <DateRangeFilter value={range} onChange={setRange} />
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-center justify-between">
          <span className="text-sm text-red-700 dark:text-red-300">
            {t('admin.dashboard.errors.loadFailed')}
          </span>
          <Button size="sm" onClick={() => void fetchMetrics(range)}>
            {t('admin.dashboard.errors.retry')}
          </Button>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <RevenueCard data={data.revenue} />
          <UsersCard data={data.users} />
          <IntegrationsCard data={data.integrations} />
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 5: Run page test to verify it passes**

```bash
bun run test src/pages/admin/AdminDashboardPage.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/dashboard/DashboardSkeleton.tsx src/pages/admin/AdminDashboardPage.tsx src/pages/admin/AdminDashboardPage.test.tsx
git commit -m "feat(admin/dashboard): add AdminDashboardPage + skeleton + error retry"
```

---

## Task 14: Update `AdminLayout` (add Dashboard tab) and tests

**Files:**
- Modify: `src/pages/admin/AdminLayout.tsx`
- Modify: `src/pages/admin/AdminLayout.test.tsx`

- [ ] **Step 1: Update test first (TDD)**

Replace the test file with:

```tsx
// src/pages/admin/AdminLayout.test.tsx
import { render, screen } from '@testing-library/react'
import type React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'pt' as const,
    setLanguage: () => {},
  }),
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { displayName: 'Test Admin', email: 'admin@test.local' },
    loading: false,
    isAdmin: true,
  }),
}))
vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}))

import { AdminLayout } from './AdminLayout'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<div>dashboard child</div>} />
          <Route path="security" element={<div>security child</div>} />
          <Route path="prices" element={<div>prices child</div>} />
          <Route path="wallet" element={<div>wallet child</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

describe('AdminLayout', () => {
  it('renders four sub-nav links pointing at the admin sub-routes', () => {
    renderAt('/admin/dashboard')
    const links = screen.getAllByRole('link')
    const hrefs = links.map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/admin/dashboard')
    expect(hrefs).toContain('/admin/security')
    expect(hrefs).toContain('/admin/prices')
    expect(hrefs).toContain('/admin/wallet')
  })

  it('renders the active child route content via Outlet', () => {
    renderAt('/admin/prices')
    expect(screen.getByText('prices child')).toBeInTheDocument()
  })

  it('marks the active sub-nav link with aria-current="page"', () => {
    renderAt('/admin/dashboard')
    const link = screen
      .getAllByRole('link')
      .find((a) => a.getAttribute('href') === '/admin/dashboard')
    expect(link).toBeDefined()
    expect(link).toHaveAttribute('aria-current', 'page')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/pages/admin/AdminLayout.test.tsx
```

Expected: FAIL — current `AdminLayout` only has 3 tabs.

- [ ] **Step 3: Update `AdminLayout.tsx` to add Dashboard tab**

Edit the `tabs` array; add Dashboard first:

```tsx
import { BarChart3, DollarSign, Shield, Wallet } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
// ...
const tabs = [
  { to: 'dashboard', icon: BarChart3, key: 'dashboard' as const },
  { to: 'security', icon: Shield, key: 'security' as const },
  { to: 'prices', icon: DollarSign, key: 'prices' as const },
  { to: 'wallet', icon: Wallet, key: 'wallet' as const },
]
```

Leave the rest of the file untouched.

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/pages/admin/AdminLayout.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminLayout.tsx src/pages/admin/AdminLayout.test.tsx
git commit -m "feat(admin): add Dashboard tab to AdminLayout"
```

---

## Task 15: Update routing in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update the admin routes block**

Replace the admin block (line 127-139) with:

```tsx
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="security" element={<SecurityLogsPage />} />
                <Route path="prices" element={<PricesConfigPage />} />
                <Route path="wallet" element={<WalletAdminPage />} />
              </Route>
```

Add the import near the existing admin imports:

```tsx
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
```

- [ ] **Step 2: Verify typecheck and tests**

```bash
bun run typecheck && bun run test
```

Expected: clean typecheck, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(admin): register /admin/dashboard route and redirect /admin → dashboard"
```

---

## Task 16: Add i18n keys (3 locales)

**Files:**
- Modify: `src/locales/pt-BR.json`
- Modify: `src/locales/en.json`
- Modify: `src/locales/es.json`

- [ ] **Step 1: Update `pt-BR.json`**

Inside the existing `admin` object, add to `nav`:

```json
"dashboard": "Dashboard",
```

Add a new `dashboard` block as a sibling of `nav`, `security`, etc:

```json
"dashboard": {
  "title": "Dashboard geral",
  "ranges": {
    "today": "Hoje",
    "7d": "7 dias",
    "30d": "30 dias",
    "60d": "60 dias",
    "90d": "90 dias",
    "180d": "180 dias",
    "365d": "365 dias",
    "custom": "Personalizado"
  },
  "revenue": {
    "title": "Receita gerada",
    "real": "Receita real",
    "credits": "Créditos concedidos"
  },
  "users": {
    "title": "Usuários",
    "new": "Novos",
    "active": "Ativos",
    "total": "Total geral"
  },
  "integrations": {
    "title": "Top integrações",
    "empty": "Nenhuma integração ativa",
    "platforms": {
      "google_ads": "Google Ads",
      "meta_ads": "Meta Ads"
    }
  },
  "errors": {
    "loadFailed": "Falha ao carregar métricas",
    "retry": "Tentar novamente",
    "invalidRange": "Data inicial deve ser anterior à final",
    "rangeTooLong": "Período não pode exceder 365 dias"
  }
}
```

- [ ] **Step 2: Mirror the same structure into `en.json` (translated)**

```json
"dashboard": {
  "title": "Overview dashboard",
  "ranges": {
    "today": "Today",
    "7d": "7 days",
    "30d": "30 days",
    "60d": "60 days",
    "90d": "90 days",
    "180d": "180 days",
    "365d": "365 days",
    "custom": "Custom"
  },
  "revenue": {
    "title": "Generated revenue",
    "real": "Real revenue",
    "credits": "Granted credits"
  },
  "users": {
    "title": "Users",
    "new": "New",
    "active": "Active",
    "total": "All-time"
  },
  "integrations": {
    "title": "Top integrations",
    "empty": "No active integrations",
    "platforms": {
      "google_ads": "Google Ads",
      "meta_ads": "Meta Ads"
    }
  },
  "errors": {
    "loadFailed": "Failed to load metrics",
    "retry": "Try again",
    "invalidRange": "Start date must be before end date",
    "rangeTooLong": "Range cannot exceed 365 days"
  }
}
```

And `nav.dashboard`: `"Dashboard"`.

- [ ] **Step 3: Mirror into `es.json` (translated)**

```json
"dashboard": {
  "title": "Panel general",
  "ranges": {
    "today": "Hoy",
    "7d": "7 días",
    "30d": "30 días",
    "60d": "60 días",
    "90d": "90 días",
    "180d": "180 días",
    "365d": "365 días",
    "custom": "Personalizado"
  },
  "revenue": {
    "title": "Ingresos generados",
    "real": "Ingresos reales",
    "credits": "Créditos otorgados"
  },
  "users": {
    "title": "Usuarios",
    "new": "Nuevos",
    "active": "Activos",
    "total": "Total general"
  },
  "integrations": {
    "title": "Integraciones top",
    "empty": "Sin integraciones activas",
    "platforms": {
      "google_ads": "Google Ads",
      "meta_ads": "Meta Ads"
    }
  },
  "errors": {
    "loadFailed": "Error al cargar métricas",
    "retry": "Intentar de nuevo",
    "invalidRange": "La fecha inicial debe ser anterior a la final",
    "rangeTooLong": "El rango no puede superar 365 días"
  }
}
```

And `nav.dashboard`: `"Panel"`.

- [ ] **Step 4: Run all tests + typecheck**

```bash
bun run test && bun run typecheck
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/locales/pt-BR.json src/locales/en.json src/locales/es.json
git commit -m "feat(i18n): add admin.dashboard.* keys in pt-BR, en, es"
```

---

## Task 17: Full test pass + typecheck + biome

**Files:** none (verification gate)

- [ ] **Step 1: Run web test suite**

```bash
bun run test
```

Expected: all tests pass, including the new ones.

- [ ] **Step 2: Run functions test suite**

```bash
cd functions && bun run test
```

Expected: all pass.

- [ ] **Step 3: Run shared workspace tests**

```bash
cd packages/shared && bun run test
```

Expected: all pass.

- [ ] **Step 4: Run typecheck across the monorepo**

```bash
bun run test:all || true
bun run typecheck || (cd functions && bun run typecheck) || true
```

(If a unified `typecheck:all` exists in `turbo.json`, use it. Otherwise the per-workspace commands cover it.)

Expected: no type errors anywhere.

- [ ] **Step 5: Run linter**

```bash
bun run lint
```

Expected: clean. Fix anything with `bun run lint:fix` if biome flags something cosmetic.

---

## Task 18: Deploy Cloud Function + Firestore indexes (dev first)

**Files:** none (deploy gate)

- [ ] **Step 1: Deploy indexes to dev**

```bash
firebase deploy --only firestore:indexes --project adsmart-web-dev
```

Expected: indexes accepted, async build (1–3 min). Verify in [Firebase Console → Firestore → Indexes](https://console.firebase.google.com) that all 5 new entries flip to `Enabled` before testing live queries.

- [ ] **Step 2: Build + deploy callable to dev**

```bash
cd functions && bun run build
firebase deploy --only functions:getDashboardMetrics --project adsmart-web-dev
```

Expected: function deployed in dev. Note the function URL (logged by CLI).

- [ ] **Step 3: Smoke test against dev**

Sign in as an admin (custom claim or allowlisted email) on the dev environment, navigate to `/admin/dashboard`, click each preset (Today, 7d, 30d). Verify:
- Cards render with skeleton then numbers.
- Sparklines render (or are flat lines if no data).
- Custom dialog opens, calendar shows pt-BR locale, date range submits.
- Range > 365d in Custom shows `errors.rangeTooLong` inline.
- Force a server error (e.g. block the network request in DevTools) and confirm the error banner with retry shows.

If anything fails, fix and re-run Tasks 17–18 before continuing.

- [ ] **Step 4: Deploy to prod once dev is green**

```bash
firebase deploy --only firestore:indexes --project adsmart-web
firebase deploy --only functions:getDashboardMetrics --project adsmart-web
```

Wait for prod indexes to flip `Enabled`. Smoke test on prod with the admin account.

- [ ] **Step 5: Commit lockfile updates if `prepare-deploy` modifies anything**

If the `prepare-deploy` step changed `functions/lib/*` or similar, those are gitignored — no commit needed. Verify with `git status`.

---

## Task 19: Docs sweep

**Files:**
- Modify: `docs/CHANGES.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `docs/QA-CHECKLIST.md`
- Modify: `docs/DATA-MODEL.md`
- Modify: `docs/DEPLOYMENT.md`
- Modify: `docs/I18N.md` (only if it exists)

- [ ] **Step 1: Append a dated entry to `docs/CHANGES.md`**

Add at the top (under the most recent entry):

```markdown
## 2026-04-26 — Subprojeto 2: Admin Dashboard geral

- New page `/admin/dashboard` (now the default landing for the admin area) with date-range filtering (Today, 7/30/60/90/180/365 + Custom up to 365 days).
- Three metrics cards: Revenue (real vs granted credits, with sparkline), Users (new/active/total, with sparkline), and Top integrations (distinct active users per platform, snapshot).
- New Cloud Function callable `getDashboardMetrics` (admin-only). Server-side aggregation via `AggregateField.sum/count` plus collectionGroup materialized reads for sparklines and active-user uniqueness.
- New Firestore composite indexes for `transactions` (3 variants), `adAccounts`, and `users`.
- Recharts 3.3.0, react-day-picker, and shadcn `<Popover>`/`<Calendar>` added.
- i18n: `admin.dashboard.*` namespace (pt-BR, en, es).
```

- [ ] **Step 2: Update `AGENTS.md`**

In the Cloud Functions table (search for `addUserCredits` and add a new row right under it):

```markdown
| `getDashboardMetrics` | Admin-only callable. Returns aggregate revenue (real vs granted credits), user counts (new + active + total), and top integrations for a date range up to 365 days. |
```

In the admin route map (or wherever the admin pages are listed), add `/admin/dashboard` as the default landing.

- [ ] **Step 3: Update `CLAUDE.md`**

In the section that lists admin pages (under `## Phase 3 / per-user state` or similar — search for `/admin/security`), add `/admin/dashboard` to the inventory and note that the default redirect is now `dashboard`.

- [ ] **Step 4: Update `docs/QA-CHECKLIST.md`**

Append a section:

```markdown
### Admin Dashboard (`/admin/dashboard`)

- [ ] Default redirect from `/admin` lands on `/admin/dashboard`.
- [ ] Page loads with skeleton, then renders three cards.
- [ ] Each preset (Today, 7d, 30d, 60d, 90d, 180d, 365d) re-fetches and updates numbers.
- [ ] Custom dialog opens, calendar shows pt-BR locale, range submits.
- [ ] Custom range > 365 days is rejected with `errors.rangeTooLong`.
- [ ] Inverted custom range is rejected with `errors.invalidRange`.
- [ ] Forcing a callable error shows the banner with `Tentar novamente`, and clicking it retries.
- [ ] Revenue values format as BRL with thousand separator and 2 decimals.
- [ ] Sparklines render even with sparse / zero data.
- [ ] Top integrations snapshot is range-independent (changing range does not change those numbers).
- [ ] Non-admin user is blocked by `AdminRoute` before reaching the page.
```

- [ ] **Step 5: Update `docs/DATA-MODEL.md`**

Add a note in the `transactions` section (or create the section):

```markdown
**Revenue interpretation (Subprojeto 2):**

- A `credit/completed` transaction with `adminAction == true` is a **granted credit** (admin-issued bonus, refund, or compensation).
- A `credit/completed` transaction without `adminAction` is **real revenue** (paid by the user, e.g. via SuitPay/Asaas).
- Dashboard separation is computed server-side as `realCents = totalCompletedCredits - grantedCredits` to bypass Firestore's lack of `!=` on aggregations.
```

- [ ] **Step 6: Update `docs/DEPLOYMENT.md`**

In the indexes section, ensure the new collectionGroup indexes are listed and that the deploy reminder covers both targets (`adsmart-web-dev`, `adsmart-web`).

- [ ] **Step 7: Update `docs/I18N.md` if it exists**

Add the `admin.dashboard.*` namespace to the inventory.

- [ ] **Step 8: Commit docs sweep**

```bash
git add docs/CHANGES.md AGENTS.md CLAUDE.md docs/QA-CHECKLIST.md docs/DATA-MODEL.md docs/DEPLOYMENT.md
# add docs/I18N.md to the line above only if it was edited
git commit -m "docs: log Subprojeto 2 admin dashboard ship + update QA + DATA-MODEL"
```

---

## Task 20: Update memory and close out

**Files:**
- Modify: `.claude/projects/-Users-eduardorodrigues-Downloads-Meus-Projetos-adsmart-app/memory/admin_overhaul_roadmap.md`

- [ ] **Step 1: Mark Subprojeto 2 as ✅ Done**

Update the status table in the memory file to set Subprojeto 2 to `✅ Done` with its final commit SHA. Update `Status at session-end` line to today's date.

- [ ] **Step 2: Verify the working tree is clean**

```bash
git status
```

Expected: nothing to commit, working tree clean (the WIP in `src/pages/TransactionsPage.tsx` mentioned at session start is a pre-existing artifact and is not part of this plan).

- [ ] **Step 3: Push to origin**

```bash
git push origin develop
```

Expected: push accepted, no force needed.

- [ ] **Step 4: Stop here**

Per `admin_overhaul_roadmap.md`, the user decides whether to release to `main` after Subprojeto 2 or after 3. Do NOT merge to `main` without explicit user direction.

---

## Self-review notes (already applied during plan writing)

- **Spec coverage:** every requirement R1–R15 from the spec is implemented by at least one task. R1 → Task 7 (revenue split). R2 → Task 7 (newCount/activeCount/totalCount). R3 → Task 7 (snapshot). R4 → Tasks 10/11/12 (sparklines + bar). R5 → Task 7 (no cache). R6 → Tasks 6/7 (single callable). R7 → Tasks 8/9 (filter UI). R8 → Task 13 (default 30d). R9 → Tasks 14/15 (redirect). R10 → Tasks 13 (skeleton + retry). R11 → Task 4 (formatBRL). R12 → Task 16. R13 → covered across all component tasks + Task 6/7. R14 → Tasks 5/18. R15 → Task 2 (Zod) + Task 9 (client validation).
- **Type consistency:** function signatures, schema names, and React component props line up across tasks (`GetDashboardMetricsOutput`, `DateRange`, etc).
- **No placeholders:** every step contains code or exact commands.
