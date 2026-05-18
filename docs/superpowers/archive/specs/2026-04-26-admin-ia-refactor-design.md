# Subprojeto 1 — Admin Panel IA Refactor (design)

**Date:** 2026-04-26
**Status:** Draft — pending user review
**Branch target:** `develop`
**Predecessor:** Subprojeto 0 (`1c2b25e`) and 0.5 (`61329f6`)
**Successors:** Subprojetos 2 (Dashboard), 3 (Users), 4 (Wallet ops), 5 (Logs UX)

## Why

`src/pages/AdminPanel.tsx` is a 569-line single component with three tabs driven by internal state (`useState<TabType>`). Any new admin section the user requested (general dashboard, user management, bonus credits, global balance, etc.) would either pile onto the same monolith or fork into a parallel page. The 3-tab structure also can't deep-link — refreshing the page always lands on the security tab, regardless of which tab the admin had open. This refactor is the structural prerequisite for the four follow-up subprojects: each one needs a place to mount that doesn't bloat a single component.

## Non-goals

- No new admin features. Dashboard, user management, bonus credits, global balance, and security-log UX changes all live in subsequent subprojects with their own specs.
- No changes to the Cloud Functions called from the admin (`getSecurityStats`, `getProductPrices`, `updateProductPrices`, `addUserCredits`). The wire shape stays identical; only the React tree calling them changes.
- No changes to the global `Sidebar.tsx` (the project-wide left rail). The "Admin" entry there continues to point at `/admin`; the new redirect handles the rest.
- No installation of new shadcn primitives. Sub-nav inside admin is a small custom component using `NavLink` from `react-router-dom`.
- No design-system changes (no new colors, no new typography, no spacing tokens). Pure information-architecture refactor.

## What changes

### URL surface

| Before | After |
|---|---|
| `/admin` (single page, three internal tabs) | `/admin` → 302 to `/admin/security` |
| | `/admin/security` (new) |
| | `/admin/prices` (new) |
| | `/admin/wallet` (new) |

`/admin/security` is the default because it is what the admin opens most often (the operational health view). The four subprojects ahead reserve `/admin/dashboard` and `/admin/users` as future siblings; they are not mounted in this subproject.

The admin route is wrapped in `AdminRoute` once at the parent level; sub-routes inherit. No more duplicated guard.

### File tree

**New (4):**
- `src/pages/admin/AdminLayout.tsx` — wraps `MainLayout`, renders the page title, the sub-nav, and the React Router `<Outlet />`. About 50 lines.
- `src/pages/admin/SecurityLogsPage.tsx` — owns `securityStats`, calls `getSecurityStats`, renders the existing security UI.
- `src/pages/admin/PricesConfigPage.tsx` — owns `productPrices`, calls `getProductPrices`/`updateProductPrices`, renders the existing prices grid.
- `src/pages/admin/WalletAdminPage.tsx` — owns the wallet form state, calls `addUserCredits`, renders the existing form + warning box.

**Deleted (1):**
- `src/pages/AdminPanel.tsx` — its three sections move out into the per-page files above. The file disappears entirely; nothing else imports it (verified ahead of time).

**Modified (5):**
- `src/App.tsx` — replaces the single `<Route path="/admin">` with a parent `Route` plus four child routes (`index`, `security`, `prices`, `wallet`).
- `src/locales/pt-BR.json`, `src/locales/en.json`, `src/locales/es.json` — adds the `admin` namespace.
- `src/locales/types.ts` — adds the `Admin` interface and includes it on `Translations`.

### Sub-nav component

Inside `AdminLayout.tsx`, a small horizontal nav rendered above the `<Outlet />`. Each item is a `<NavLink to="security|prices|wallet">` from `react-router-dom`. The active item gets a `data-active="true"` attribute; styling is via Tailwind classes already used elsewhere (border-bottom emphasis, matching the current button-tab look). No external nav library.

The sub-nav reads its labels from the new i18n namespace — `t('admin.nav.security')`, etc. — so adding a new admin section in a future subproject is two lines: append a `<NavLink>` and add a key to `admin.nav.*`.

### i18n namespace

A single `admin` top-level namespace, structured as nav + per-page + shared messages:

```jsonc
"admin": {
  "title": "Painel Administrativo",
  "welcomeBack": "Bem-vindo, {name}",
  "nav": {
    "security": "Logs de Segurança",
    "prices": "Configuração de Preços",
    "wallet": "Gestão de Saldo"
  },
  "security": {
    "title": "Logs de Segurança",
    "subtitle": "Eventos de segurança dos últimos {days} dias",
    "totalEvents": "Total de eventos",
    "criticalEvents": "Eventos críticos",
    "byType": "Por tipo",
    "bySeverity": "Por severidade",
    "noEvents": "Nenhum evento registrado",
    "refresh": "Atualizar",
    "lastDays": "{days} dias"
  },
  "prices": {
    "title": "Configuração de Preços",
    "subtitle": "Gerencie os preços dos dashboards",
    "save": "Salvar Alterações",
    "saving": "Salvando...",
    "category": { "google": "Google Ads", "meta": "Meta Ads" },
    "type": { "lancamento": "Lançamento", "negocioLocal": "Negócio Local" },
    "currency": "R$",
    "active": "Ativo",
    "inactive": "Inativo"
  },
  "wallet": {
    "title": "Gestão de Saldo",
    "subtitle": "Adicione créditos ao saldo de um usuário",
    "targetEmail": "Email do usuário",
    "amount": "Valor (em centavos)",
    "reason": "Motivo (mínimo 10 caracteres)",
    "addCredits": "Adicionar Créditos",
    "adding": "Adicionando...",
    "limits": {
      "title": "Limites de segurança",
      "perTx": "Máximo por transação: R$ {amount}",
      "daily": "Máximo diário: R$ {amount}",
      "txCount": "Máximo de transações por dia: {count}"
    }
  },
  "messages": {
    "fillFields": "Preencha todos os campos",
    "loadError": "Erro ao carregar dados",
    "saveSuccess": "Alterações salvas com sucesso",
    "creditsAdded": "Créditos adicionados com sucesso",
    "reasonTooShort": "O motivo deve ter no mínimo 10 caracteres"
  }
}
```

EN/ES locales mirror the structure; translations done in the same edit.

`src/locales/types.ts` grows an `Admin` interface that mirrors the JSON shape exactly. Every key used in the components is type-checked at compile time — typos surface immediately.

### Cleanup, taken alongside the move

- The "Debug Info" `<div>` in `AdminPanel.tsx` (the visible block showing email, UID, provider, etc.) is dropped. It was diagnostic for the Subprojeto 0 bug and serves no purpose in the refactored panel.
- The verbose `console.log('🔍 === DEBUG SECURITY STATS ===')` and similar lines are dropped. Per project convention (Biome `noConsole` warn, plus the project's general "no debug logging unless it earns its keep" stance), they go.
- The "Acesso Negado" inline guard inside the page becomes redundant once `AdminRoute` wraps the parent route — it is dropped. Defense-in-depth still holds because `AdminRoute` is the actual guard; the inline check was a duplicate.

## What stays the same

- All Firebase callable invocations (`httpsCallable(functions, 'getSecurityStats' | 'getProductPrices' | 'updateProductPrices' | 'addUserCredits')`) keep their argument shape and return-handling. The change is purely where the call lives in the React tree.
- All current admin UI behaviors keep working: the user can refresh stats, edit prices, add credits to a user. No regression.
- `firestore.rules` are untouched.
- `src/contexts/AuthContext.tsx` and `src/components/AdminRoute.tsx` are untouched.

## Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Bookmarks pointing at `/admin` break | High before mitigation, low after | `/admin` `index` route does `<Navigate to="security" replace />` |
| Translation typos cause raw keys to render | Medium | New `Admin` interface in `types.ts` makes typos compile errors |
| Active sub-nav state desyncs from URL | Low | `NavLink` derives active state from URL — no manual state |
| `AdminPanel.tsx` import lingers somewhere | Low | Pre-flight `grep -r "from.*AdminPanel" src/` runs before deletion; expected zero hits outside `App.tsx` |
| Pre-existing unstaged i18n work conflicts | Medium | Pre-flight `git diff src/locales/` is reviewed; new `admin` namespace is purely additive (no rename of existing keys), so merge surface is minimal |

## Out of scope (will not be touched)

- The user's pre-existing unstaged changes to `src/locales/{en,es,pt-BR}.json`, `src/locales/types.ts`, and `src/pages/TransactionsPage.tsx` (visible in git status from session start). The refactor's locale edits will land cleanly on top of those because they only add a new top-level key.
- The `Sidebar.tsx` global rail. Possibly worth adding a sub-list under "Admin" once subprojects 2–5 land (5+ admin sub-pages benefit from in-rail navigation), but doing it now is premature.
- The `BottomNavigation.tsx` (mobile bottom bar visible in the user's screenshot). Admin is desktop-targeted; no admin entry needed on the mobile bar.

## Docs and conventions to update

Per the project rule "always update documentation and conventions before advancing":

- `docs/CHANGES.md` — entry `[2026-04-26] — Admin panel IA refactor (Subprojeto 1)` describing the move + cleanup.
- `docs/I18N.md` — short paragraph showing the new `admin.*` namespace as the canonical example for "feature-scoped namespaces". (Existing doc has examples; this just adds one.)
- `CLAUDE.md` and `AGENTS.md` — the `Read-first map` table gains a row: `Add an admin sub-page → src/pages/admin/AdminLayout.tsx, src/App.tsx, src/locales/*.json admin namespace, src/locales/types.ts`. Both files are updated since the read-first map is intentionally duplicated.

No ADR. The refactor is mechanical IA cleanup with no novel architectural decision — `Decisions.md` would be noise.

## Acceptance checklist (for the implementation plan to satisfy)

The plan that follows this spec must produce changes that pass each of these gates:

1. `bun run build` succeeds — no TypeScript errors from the new `Admin` interface or the page extractions.
2. `bun run typecheck` (Turbo, all packages) succeeds.
3. Visiting `/admin` redirects to `/admin/security` with a 302 (or React Router equivalent — `<Navigate replace />`).
4. Each of `/admin/security`, `/admin/prices`, `/admin/wallet` renders the same content as the corresponding tab in the deleted page.
5. Sub-nav active state matches the URL (clicking another tab updates the URL; pasting a tab URL into a fresh window highlights the right tab).
6. Refreshing on a sub-route stays on that sub-route — no redirect-on-reload behavior.
7. Browser DevTools console shows zero `console.log`/`console.error` from admin pages during normal navigation. Errors during failed callables still surface (via `console.error` in the catch handlers — that is the project convention for caught errors).
8. The user signed in as a non-admin attempting `/admin/security` directly is bounced to `/dashboard` by `AdminRoute`. Same for the other sub-routes.
9. The "Debug Info" block does not appear anywhere on the page.
10. `grep -rn "from.*AdminPanel'" src/` returns zero results after the refactor.
11. New `admin.*` keys exist in all three locales with matching shape — `bun run typecheck` enforces this via the `Admin` interface.
12. `docs/CHANGES.md` has the dated entry, `CLAUDE.md` and `AGENTS.md` have the new read-first row, `docs/I18N.md` mentions the new namespace.

## Open questions resolved

| Question (asked in design discussion) | Answer |
|---|---|
| Default sub-route for `/admin` | `/admin/security` — operational view first |
| Sub-nav style | Top tabs (horizontal `NavLink` row) inside `AdminLayout`; no secondary sidebar |
| Drop the "Debug Info" block | Yes, drop it; was Subprojeto 0 diagnostic |
| New ADR? | No |
| New shadcn primitive? | No |
