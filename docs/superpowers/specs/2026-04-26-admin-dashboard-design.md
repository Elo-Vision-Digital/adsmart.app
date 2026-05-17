# Subprojeto 2 — Admin Dashboard geral

**Status:** Approved (design phase)
**Date:** 2026-04-26
**Branch:** `develop`
**Owner:** Eduardo Rodrigues
**Predecessor:** Subprojeto 1 (admin IA refactor) — `1ebcfa7`
**Successor (planned):** Subprojeto 3 — Painel de usuários

---

## 1. Goal

Add a read-only admin dashboard at `/admin/dashboard` that surfaces three operational metrics — generated revenue, user counts, and top integrations — with date-range filtering. The page becomes the new landing page of the admin area and unblocks the rest of the admin overhaul roadmap.

## 2. Non-goals

- No write paths, no Firestore rules changes, no schema changes.
- No multi-currency. BRL only.
- No full timeline charts (kept to inline sparklines + one bar chart).
- No background pre-aggregation. On-demand aggregations only — pre-aggregation is a Subprojeto 4 concern if scale demands it.
- No CSV/PDF export. Defer until requested.

## 3. Requirements (locked decisions)

| # | Decision | Source |
|---|---|---|
| R1 | Revenue is shown as **two side-by-side metrics**: real revenue (paid) + granted credits (admin-issued). | User decision Q1 |
| R2 | User counts: **new in period + active in period + total snapshot** in the same card. | User decision Q2 |
| R3 | Top integrations measured by **distinct active users per platform**, snapshot (not range-filtered). | User decision Q3 |
| R4 | Visualization: **cards + sparklines/mini-charts** (not cards-only, not full dashboard). | User decision Q4 |
| R5 | Server aggregation: **on-demand Firestore aggregations + materialized day grouping for sparklines**, no cache. | User decision Q5 |
| R6 | One callable: `getDashboardMetrics({ startDate, endDate })`. | Q6 recommended |
| R7 | Filter UI: preset buttons (Today, 7d, 30d, 60, 90, 180, 365) + Custom dialog with `react-day-picker` range. | Q7 recommended |
| R8 | Default range on load: **30 days**. | Q8 recommended |
| R9 | Default `/admin` route now redirects to `/admin/dashboard` (was `/admin/security`). | Q9 recommended |
| R10 | Loading: per-card skeletons (no global spinner). Errors: per-card inline retry. | Q10 recommended |
| R11 | Currency: **BRL only**, formatted via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`. | Q11 recommended |
| R12 | i18n: extend `admin.dashboard.*` in `pt-BR`, `en`, `es`. | Q12 recommended |
| R13 | Tests: Vitest on web (page + filter + 3 cards) and functions (`getDashboardMetrics`). | Q13 recommended |
| R14 | Indexes declared in `firestore.indexes.json` and deployed to both targets. | Q14 recommended |
| R15 | Range cap: **365 days** (1 year, hard cap). Enforced both client-side (Custom dialog refuses Submit) and server-side (Zod refine in callable input). | User decision |

## 4. Architecture

### 4.1 Boundary

- **Server** is authoritative for the math. The client never composes Firestore queries for this dashboard.
- **Client** owns filter state and rendering only. Re-runs the callable when range changes.

### 4.2 Data flow

```
[AdminDashboardPage]
  ├── DateRangeFilter (preset buttons + Custom dialog) → state {startDate, endDate}
  ├── useEffect([startDate, endDate]) → httpsCallable('getDashboardMetrics')({startDate, endDate})
  └── Render cards:
      ├── RevenueCard       (real + créditos, sparkline diário)
      ├── UsersCard         (novos + ativos + total geral, sparkline novos)
      └── IntegrationsCard  (top platforms, bar chart horizontal)
```

### 4.3 Stack alignment

- React 18 + shadcn/ui (Card, Button, Dialog, Calendar) + Tailwind 3 tokens (`bg-surface`, `text-foreground`, `text-muted-foreground`, `border-border`).
- **Recharts 3.3.0** for sparklines and the integrations bar (validated via Context7).
- **react-day-picker** as the calendar engine for the Custom range dialog (matches shadcn `<Calendar>` underlying lib, validated via Context7).
- **firebase-admin 12.7.0** (already in both `package.json` and `functions/package.json`) supports `AggregateField.count()` and `AggregateField.sum('field')` on collection-group queries — exactly what we need.
- Tipografia Montserrat herdada do `<body>`. All Recharts colors come from CSS vars (`hsl(var(--primary))`).

## 5. Server: `getDashboardMetrics`

**Location:** `functions/src/getDashboardMetrics.ts`, exported in `functions/src/index.ts`.

**Auth guard:** identical to `getSecurityStats` — custom claim `admin` OR email allowlist (`admin_claim_policy.md`).

### 5.1 Input schema

`packages/shared/src/schemas/dashboardMetrics.ts`:

```ts
export const GetDashboardMetricsInputSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine((v) => new Date(v.endDate) >= new Date(v.startDate), {
  message: 'endDate must be ≥ startDate',
}).refine((v) => {
  const days = (new Date(v.endDate).getTime() - new Date(v.startDate).getTime()) / 86_400_000;
  return days <= 365;
}, { message: 'range exceeds 365 days' });
```

Co-located Vitest covers happy path + invalid-range + > 365 days.

### 5.2 Output schema

```ts
GetDashboardMetricsOutputSchema = z.object({
  range: z.object({ startDate: z.string(), endDate: z.string(), days: z.number().int() }),
  revenue: z.object({
    realCents: z.number().int().nonnegative(),
    creditsCents: z.number().int().nonnegative(),
    sparkline: z.array(z.object({
      date: z.string(),       // YYYY-MM-DD in America/Sao_Paulo
      realCents: z.number().int().nonnegative(),
      creditsCents: z.number().int().nonnegative(),
    })),
  }),
  users: z.object({
    newCount: z.number().int().nonnegative(),
    activeCount: z.number().int().nonnegative(),
    totalCount: z.number().int().nonnegative(),
    sparkline: z.array(z.object({
      date: z.string(),
      newCount: z.number().int().nonnegative(),
    })),
  }),
  integrations: z.object({
    byPlatform: z.array(z.object({
      platform: z.enum(['google_ads', 'meta_ads']),
      distinctUserCount: z.number().int().nonnegative(),
    })),
  }),
  generatedAt: z.string().datetime(),
});
```

### 5.3 Server logic

1. **Real revenue** — collectionGroup `transactions` filter
   `type=='credit' AND status=='completed' AND createdAt in [start,end] AND adminAction!=true AND paymentId != null`.
   Sum: `aggregate({ realCents: AggregateField.sum('amount') }).get()`.

   *Note:* Firestore does not support `!=` and `==null` directly. Implementation: run two filtered aggregate queries — one with `where('adminAction','==',true)` for the credits sum, one across all completed credits (full sum), then `realCents = fullCents - creditsCents`. Two reads, deterministic.

2. **Granted credits** — same group filtered with `adminAction == true`. `aggregate({ creditsCents: sum('amount') })`.

3. **Sparklines (revenue)** — single materialized query of all completed credit txs in range; group by `YYYY-MM-DD` in `America/Sao_Paulo`; split each bucket into real vs credits using `adminAction` flag.

4. **New users** — `users.where('createdAt' in range)`:
   - aggregate `count()` for `newCount`.
   - materialized query (same range) for sparkline day-grouping.

5. **Total users** — `users` `count()` aggregate (1 read, snapshot).

6. **Active users** — collectionGroup `transactions.where('createdAt' in range)`. For each doc, `parent.parent.id` is uid. Build a `Set<uid>`, return `.size`. Materialized read.

7. **Integrations** — collectionGroup `adAccounts.where('isActive','==',true)`. For each doc, `(platform, parent.parent.id)`. Build `Map<platform, Set<uid>>`, return sizes. Materialized read; snapshot, range-independent.

**Cost analysis:** dominated by materialized reads (sparklines + active users + integrations). Linear in volume × range (capped at 365 days). At current scale this is negligible. If we hit performance pain later, Subprojeto 4 introduces cron infra that we can reuse for pre-aggregation buckets — out of scope here.

**Timezone:** all day-grouping uses `America/Sao_Paulo` to match Brazilian operations. Implementation via `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })` to get `YYYY-MM-DD` string buckets.

## 6. Client UI

### 6.1 New files

| File | Purpose |
|---|---|
| `src/pages/admin/AdminDashboardPage.tsx` | Top-level page, callable wiring, error/loading orchestration |
| `src/pages/admin/dashboard/DateRangeFilter.tsx` | Preset buttons + Custom dialog with `react-day-picker` |
| `src/pages/admin/dashboard/RevenueCard.tsx` | Two BRL numbers + sparkline AreaChart |
| `src/pages/admin/dashboard/UsersCard.tsx` | Three counts + sparkline AreaChart |
| `src/pages/admin/dashboard/IntegrationsCard.tsx` | Horizontal bar chart, max 5 rows |
| `src/pages/admin/dashboard/DashboardSkeleton.tsx` | `animate-pulse` placeholders for the 4-card grid |
| `src/components/ui/calendar.tsx` | shadcn `<Calendar>` (added if not present; uses `react-day-picker`) |

### 6.2 Page shape

```tsx
<div className="space-y-6">
  <DashboardHeader />
  <DateRangeFilter value={range} onChange={setRange} />
  {loading ? <DashboardSkeleton /> :
   error   ? <ErrorBanner onRetry={refetch} /> :
   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
     <RevenueCard data={data.revenue} />
     <UsersCard data={data.users} />
     <IntegrationsCard data={data.integrations} />
   </div>}
</div>
```

### 6.3 Error handling

- Per-card error: callable failure shows inline message in each card with `Tentar novamente` button. Error does not blow up sibling cards.
- Filter validation (client-side, before callable): Custom dialog Submit refuses `endDate < startDate` (`errors.invalidRange`) AND `range > 365 days` (`errors.rangeTooLong`). Server still re-validates with the same Zod schema as a defense-in-depth boundary.
- Server returns Zod-validated payload; client re-validates on receipt with the same shared schema. Mismatch → top-level error banner.

### 6.4 Identidade visual

- Cards: `bg-surface`, `border-border`, `text-foreground`, captions `text-muted-foreground`. No raw hex.
- Recharts: `<Area fill="hsl(var(--primary))" stroke="hsl(var(--primary))" />` with low opacity gradient. Sparkline height 60px, no axes, no legend, tooltip showing day + value.
- Custom dialog: shadcn `<Dialog>` shell, `react-day-picker` styled with shadcn calendar overrides (locale `pt-BR`).

## 7. Routing changes

`src/App.tsx`:

```tsx
<Route element={<AdminRoute><AdminLayout /></AdminRoute>} path="/admin">
  <Route index element={<Navigate to="dashboard" replace />} />     {/* was: security */}
  <Route path="dashboard" element={<AdminDashboardPage />} />        {/* new */}
  <Route path="security" element={<SecurityLogsPage />} />
  <Route path="prices" element={<PricesConfigPage />} />
  <Route path="wallet" element={<WalletAdminPage />} />
</Route>
```

`src/pages/admin/AdminLayout.tsx` tabs:

```tsx
const tabs = [
  { to: 'dashboard', icon: BarChart3, key: 'dashboard' as const },
  { to: 'security',  icon: Shield,    key: 'security'  as const },
  { to: 'prices',    icon: DollarSign, key: 'prices'   as const },
  { to: 'wallet',    icon: Wallet,    key: 'wallet'    as const },
]
```

`AdminLayout.test.tsx`: existing redirect test gets updated to assert `/admin/dashboard`.

## 8. i18n

Extend the `admin` namespace in `src/locales/pt-BR.json`, `en.json`, `es.json`:

```jsonc
"admin": {
  "nav": { "dashboard": "Dashboard", /* existing keys */ },
  "dashboard": {
    "title": "Dashboard geral",
    "ranges": {
      "today": "Hoje", "7d": "7 dias", "30d": "30 dias",
      "60d": "60 dias", "90d": "90 dias", "180d": "180 dias",
      "365d": "365 dias", "custom": "Personalizado"
    },
    "revenue": { "title": "Receita gerada",
                 "real": "Receita real", "credits": "Créditos concedidos" },
    "users":   { "title": "Usuários",
                 "new": "Novos", "active": "Ativos", "total": "Total geral" },
    "integrations": {
      "title": "Top integrações",
      "platforms": { "google_ads": "Google Ads", "meta_ads": "Meta Ads" }
    },
    "errors": { "loadFailed": "Falha ao carregar métricas",
                "retry": "Tentar novamente",
                "invalidRange": "Data inicial deve ser anterior à final",
                "rangeTooLong": "Período não pode exceder 365 dias" },
    "skeleton": { "loading": "Carregando..." }
  }
}
```

`en` and `es` mirror the structure with translated values.

## 9. Firestore indexes

Append to `firestore.indexes.json`:

```jsonc
{ "collectionGroup": "transactions", "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "type",      "order": "ASCENDING" },
    { "fieldPath": "status",    "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "ASCENDING" }
  ]
},
{ "collectionGroup": "transactions", "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "createdAt", "order": "ASCENDING" }
  ]
},
{ "collectionGroup": "transactions", "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "type",         "order": "ASCENDING" },
    { "fieldPath": "status",       "order": "ASCENDING" },
    { "fieldPath": "adminAction",  "order": "ASCENDING" },
    { "fieldPath": "createdAt",    "order": "ASCENDING" }
  ]
},
{ "collectionGroup": "adAccounts", "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "isActive", "order": "ASCENDING" },
    { "fieldPath": "platform", "order": "ASCENDING" }
  ]
},
{ "collectionGroup": "users", "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "createdAt", "order": "ASCENDING" }
  ]
}
```

Deploy to both targets:
- `firebase deploy --only firestore:indexes --project adsmart-web-dev`
- `firebase deploy --only firestore:indexes --project adsmart-web`

Index builds are async (1–3 min). Verify before testing live; queries fail with `FAILED_PRECONDITION` until `Enabled`.

## 10. Tests

### 10.1 Web (`bun run test`)

| File | Scope |
|---|---|
| `src/pages/admin/AdminDashboardPage.test.tsx` | Renders with mock callable; cards visible; range change re-fetches; error → retry path |
| `src/pages/admin/dashboard/DateRangeFilter.test.tsx` | Each preset emits correct `{startDate, endDate}`; Custom dialog opens; validates `start ≤ end` AND range ≤ 365 days |
| `src/pages/admin/dashboard/RevenueCard.test.tsx` | Render with zero data + with data; BRL formatted strings present |
| `src/pages/admin/dashboard/UsersCard.test.tsx` | Three numbers visible; sparkline renders |
| `src/pages/admin/dashboard/IntegrationsCard.test.tsx` | Empty state; bar chart with 1+ rows |
| `src/pages/admin/AdminLayout.test.tsx` (update) | Default redirect now `/admin/dashboard` |

### 10.2 Functions (`cd functions && bun run test`)

| File | Scope |
|---|---|
| `functions/test/getDashboardMetrics.test.ts` | Auth (no auth → unauthenticated; non-admin → permission-denied); range validation (invalid; > 365d); shape of payload; revenue split (real vs credits via `adminAction`); empty-period returns zeros |

### 10.3 Shared schemas

| File | Scope |
|---|---|
| `packages/shared/src/schemas/dashboardMetrics.test.ts` | Input schema rejects bad ISO; rejects inverted range; rejects > 365d. Output schema accepts shapes from server. |

## 11. Files touched

**Created:**
- `functions/src/getDashboardMetrics.ts`
- `functions/test/getDashboardMetrics.test.ts`
- `packages/shared/src/schemas/dashboardMetrics.ts`
- `packages/shared/src/schemas/dashboardMetrics.test.ts`
- `src/pages/admin/AdminDashboardPage.tsx` + `.test.tsx`
- `src/pages/admin/dashboard/DateRangeFilter.tsx` + `.test.tsx`
- `src/pages/admin/dashboard/RevenueCard.tsx` + `.test.tsx`
- `src/pages/admin/dashboard/UsersCard.tsx` + `.test.tsx`
- `src/pages/admin/dashboard/IntegrationsCard.tsx` + `.test.tsx`
- `src/pages/admin/dashboard/DashboardSkeleton.tsx`
- `src/components/ui/calendar.tsx` (shadcn add, if missing)

**Edited:**
- `src/pages/admin/AdminLayout.tsx` — add Dashboard tab
- `src/pages/admin/AdminLayout.test.tsx` — update redirect assertion
- `src/App.tsx` — route + redirect change
- `src/locales/pt-BR.json`, `en.json`, `es.json` — `admin.nav.dashboard` + `admin.dashboard.*`
- `firestore.indexes.json` — 5 new index entries
- `functions/src/index.ts` — re-export `getDashboardMetrics`
- `package.json` — `recharts`, `react-day-picker` (and shadcn-calendar peer deps as needed)

**NOT touched:**
- `firestore.rules` (read-only feature; no policy change)
- Any existing Cloud Function
- `packages/shared/src/schemas/transaction.ts` and other existing schemas
- Auth flows or any user-facing page outside `/admin/*`

## 12. Docs sweep (mandatory — `feedback_always_update_docs`)

| Doc | Update |
|---|---|
| `docs/CHANGES.md` | Dated entry 2026-04-26: Subprojeto 2 — admin dashboard + new callable + new indexes |
| `AGENTS.md` | Add `getDashboardMetrics` to Cloud Functions table; mention `/admin/dashboard` in admin route map |
| `CLAUDE.md` | Update admin pages list (now includes dashboard) |
| `docs/QA-CHECKLIST.md` | New section: dashboard filters, custom range, error retry, skeleton, BRL formatting |
| `docs/I18N.md` (if present) | Document `admin.dashboard.*` namespace |
| `docs/DATA-MODEL.md` | Note semantics: `transactions.adminAction === true` ⇒ "granted credit", otherwise (with `paymentId`) ⇒ "real revenue" |
| `docs/DEPLOYMENT.md` | Reminder to deploy indexes to both targets after merge |

## 13. Out of scope (reserved for later subprojetos)

- Drilldown into individual users → Subprojeto 3.
- Revenue by integration (requires `platform` denormalized on `reports`/`transactions`) → Subprojeto 3 once reports panel lands.
- Bonus credits configuration UI → Subprojeto 4.
- Cloud Logging deep-link from dashboard → Subprojeto 5.
- Pre-aggregation cron — only if performance demands.

## 14. Release strategy

Per `admin_overhaul_roadmap.md`: stay on `develop` after this ship. Next merge to `main` happens after Subprojeto 2 OR 3 (user choice), with a release window the user picks. No fast-forward to `main` from this spec alone.

## 15. Library validation summary

| Lib | Current version | Purpose | Validated via Context7 |
|---|---|---|---|
| `recharts` | 3.3.0 | Sparklines + bar chart | ✅ `/recharts/recharts/v3.3.0` |
| `react-day-picker` | latest stable | Custom range dialog | ✅ `/gpbl/react-day-picker` |
| `firebase-admin` | 12.7.0 (already installed) | Aggregations on collectionGroup | ✅ `/firebase/firebase-admin-node` (`AggregateField.sum/count`) |

All version pins to be confirmed at install time with Context7 to honor `feedback_consult_context7_before_proposing.md`.
