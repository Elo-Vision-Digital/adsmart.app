# Admin Panel IA Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single 569-line `AdminPanel.tsx` (3 internal tabs) into nested routes (`/admin/security`, `/admin/prices`, `/admin/wallet`) under a shared `AdminLayout`, add the `admin.*` i18n namespace, and drop Subprojeto 0 diagnostic UI. No new features.

**Architecture:** Type-first i18n (TypeScript catches missing translation keys at compile time), then per-page extraction with no behavior changes, then route surgery in `App.tsx`. Each commit leaves the build green and the admin functional — partial progress can be merged or paused safely.

**Tech Stack:** React 18.3 · TypeScript 5 · Vite 7 · `react-router-dom` 6.23 · Tailwind 3 · Vitest 4 · `@testing-library/react`. No new dependencies.

**Spec:** [docs/superpowers/specs/2026-04-26-admin-ia-refactor-design.md](../specs/2026-04-26-admin-ia-refactor-design.md)

**Acceptance:** the spec's "Acceptance checklist" (12 numbered criteria) is the source of truth — every task in this plan exists to satisfy at least one of them.

---

## Task 1: Pre-flight verification

**Files:**
- Read-only checks; nothing modified.

- [ ] **Step 1: Confirm no foreign import of `AdminPanel` exists outside `App.tsx`**

Run:
```bash
cd "/Users/eduardorodrigues/Downloads/Meus Projetos/adsmart-app"
grep -rn "from.*AdminPanel'" src/ || echo "no other importers"
```

Expected output: exactly one match — `src/App.tsx:8:import { AdminPanel } from '@/pages/AdminPanel'`. If anything else appears, stop and add a task to migrate that consumer before deletion in Task 12.

- [ ] **Step 2: Confirm baseline build/typecheck is green**

Run:
```bash
bun run typecheck
```

Expected output: `Tasks: 3 successful, 3 total` (web, shared, functions packages). If anything is red before the refactor begins, fix or revert that first — do not stack changes onto a broken baseline.

- [ ] **Step 3: Snapshot the locales file shape**

Run:
```bash
git diff --stat src/locales/
```

Expected: shows the user's pre-existing unstaged work in `en.json`, `es.json`, `pt-BR.json`, `types.ts`. Note that this plan only ADDS a new top-level `admin` key to those files — no existing keys are renamed or moved, so merge surface is minimal. If a conflict surfaces during the JSON edits in Tasks 3–5, resolve in favour of the user's existing keys.

- [ ] **Step 4: No commit. Pre-flight is verification only.**

---

## Task 2: Extend `Translations` type with the `Admin` interface

**Files:**
- Modify: `src/locales/types.ts:end-of-file`

- [ ] **Step 1: Open the file and locate the closing brace of `Translations`**

The interface ends at the file's last `}` (the one that closes `Translations`, not `settingsPage`). Insert a new `admin: { ... }` block as a sibling of `settingsPage`, immediately before the final closing brace.

- [ ] **Step 2: Insert the `Admin` block**

Edit `src/locales/types.ts`. Find:
```ts
    messages: {
      profileUpdated: string
      passwordChanged: string
      passwordsDoNotMatch: string
      passwordTooShort: string
      currentPasswordIncorrect: string
    }
  }
}
```

Replace with:
```ts
    messages: {
      profileUpdated: string
      passwordChanged: string
      passwordsDoNotMatch: string
      passwordTooShort: string
      currentPasswordIncorrect: string
    }
  }

  // Admin panel translations (Subprojeto 1)
  admin: {
    title: string
    welcomeBack: string
    nav: {
      security: string
      prices: string
      wallet: string
    }
    security: {
      title: string
      subtitle: string
      totalEvents: string
      criticalEvents: string
      byType: string
      bySeverity: string
      noEvents: string
      refresh: string
      loading: string
      lastDays: string
    }
    prices: {
      title: string
      subtitle: string
      save: string
      saving: string
      reload: string
      loading: string
      priceLabel: string
      categoryLabel: string
      typeLabel: string
      updatedAtLabel: string
      category: { google: string; meta: string }
      type: { lancamento: string; negocioLocal: string }
      currency: string
    }
    wallet: {
      title: string
      subtitle: string
      addCreditsTitle: string
      targetEmail: string
      targetEmailPlaceholder: string
      amount: string
      amountPlaceholder: string
      amountHint: string
      reason: string
      reasonPlaceholder: string
      reasonCounter: string
      addCredits: string
      adding: string
      limits: {
        title: string
        addsRealBalance: string
        affectsProduction: string
        perTx: string
        daily: string
        txCount: string
        reasonRequired: string
        loggedWithIp: string
        useResponsibly: string
      }
    }
    messages: {
      fillFields: string
      invalidAmount: string
      reasonTooShort: string
      loadError: string
      saveSuccess: string
      pricesLoaded: string
      pricesUpdated: string
      creditsAddedToUser: string
    }
  }
}
```

- [ ] **Step 3: Run typecheck — it WILL fail loudly**

Run:
```bash
bun run typecheck
```

Expected: typecheck reports errors in `src/locales/pt-BR.json`, `en.json`, `es.json` saying that `admin` is missing. This is intentional — Tasks 3–5 will satisfy them. Do NOT commit yet; the codebase is mid-edit.

---

## Task 3: Add `admin` namespace to `pt-BR.json`

**Files:**
- Modify: `src/locales/pt-BR.json:end-of-file`

- [ ] **Step 1: Insert the `admin` block**

Open `src/locales/pt-BR.json`. Find the final `}` that closes the top-level object. Add a new `"admin"` key as a sibling of `"settingsPage"`, with this exact content:

```json
,
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
      "totalEvents": "Total de Eventos",
      "criticalEvents": "Eventos Críticos",
      "byType": "Eventos por Tipo",
      "bySeverity": "Por Severidade",
      "noEvents": "Clique em \"Atualizar\" para carregar as estatísticas",
      "refresh": "Atualizar",
      "loading": "Carregando estatísticas...",
      "lastDays": "{days} dias"
    },
    "prices": {
      "title": "Configuração de Preços",
      "subtitle": "Gerencie os preços dos dashboards",
      "save": "Salvar Alterações",
      "saving": "Salvando...",
      "reload": "Recarregar",
      "loading": "Carregando preços...",
      "priceLabel": "Preço:",
      "categoryLabel": "Categoria",
      "typeLabel": "Tipo",
      "updatedAtLabel": "Atualizado",
      "category": { "google": "Google Ads", "meta": "Meta Ads" },
      "type": { "lancamento": "Lançamento", "negocioLocal": "Negócio Local" },
      "currency": "R$"
    },
    "wallet": {
      "title": "Gestão de Saldo",
      "subtitle": "Adicione créditos ao saldo de um usuário",
      "addCreditsTitle": "Adicionar Créditos a Usuário",
      "targetEmail": "Email do Usuário",
      "targetEmailPlaceholder": "usuario@exemplo.com",
      "amount": "Valor em Reais (R$)",
      "amountPlaceholder": "0,00",
      "amountHint": "Digite o valor em reais. Ex: 10.50 para R$ 10,50 (Máximo: R$ 1.000,00)",
      "reason": "Motivo",
      "reasonPlaceholder": "Descreva o motivo para adicionar créditos (mínimo 10 caracteres)",
      "reasonCounter": "{count}/10 caracteres mínimos",
      "addCredits": "Adicionar Créditos",
      "adding": "Adicionando...",
      "limits": {
        "title": "Atenção - Medidas de Segurança",
        "addsRealBalance": "Esta ação adiciona saldo real ao usuário",
        "affectsProduction": "O saldo adicionado afeta o ambiente de produção",
        "perTx": "Limite por transação: R$ 1.000,00",
        "daily": "Limite diário por admin: R$ 5.000,00",
        "txCount": "Máximo 50 transações por dia",
        "reasonRequired": "Motivo obrigatório (mínimo 10 caracteres)",
        "loggedWithIp": "Todas as ações são registradas com IP e timestamp",
        "useResponsibly": "Use com responsabilidade"
      }
    },
    "messages": {
      "fillFields": "Por favor, preencha todos os campos",
      "invalidAmount": "Por favor, insira um valor válido",
      "reasonTooShort": "O motivo deve ter pelo menos 10 caracteres",
      "loadError": "Erro ao carregar dados",
      "saveSuccess": "Alterações salvas com sucesso",
      "pricesLoaded": "Preços carregados com sucesso!",
      "pricesUpdated": "Preços atualizados com sucesso!",
      "creditsAddedToUser": "Créditos adicionados com sucesso para {email}! Limites diários: R$ {used} / R$ {max}"
    }
  }
```

(Note the leading comma — appended after the existing `settingsPage` block.)

- [ ] **Step 2: Run typecheck — pt-BR specifically should now pass**

Run:
```bash
bun run typecheck 2>&1 | grep -E "pt-BR\.json|Done|error" | head -20
```

Expected: no errors mentioning `pt-BR.json`. Errors for `en.json` and `es.json` still appear — they're handled by Tasks 4 and 5.

- [ ] **Step 3: No commit yet.** Locales are co-modified; commit at end of Task 5.

---

## Task 4: Add `admin` namespace to `en.json`

**Files:**
- Modify: `src/locales/en.json:end-of-file`

- [ ] **Step 1: Insert the `admin` block (English translations)**

Open `src/locales/en.json`. Append after the existing final block (sibling of `settingsPage`):

```json
,
  "admin": {
    "title": "Admin Panel",
    "welcomeBack": "Welcome, {name}",
    "nav": {
      "security": "Security Logs",
      "prices": "Price Configuration",
      "wallet": "Wallet Management"
    },
    "security": {
      "title": "Security Logs",
      "subtitle": "Security events from the last {days} days",
      "totalEvents": "Total Events",
      "criticalEvents": "Critical Events",
      "byType": "Events by Type",
      "bySeverity": "By Severity",
      "noEvents": "Click \"Refresh\" to load statistics",
      "refresh": "Refresh",
      "loading": "Loading statistics...",
      "lastDays": "{days} days"
    },
    "prices": {
      "title": "Price Configuration",
      "subtitle": "Manage dashboard prices",
      "save": "Save Changes",
      "saving": "Saving...",
      "reload": "Reload",
      "loading": "Loading prices...",
      "priceLabel": "Price:",
      "categoryLabel": "Category",
      "typeLabel": "Type",
      "updatedAtLabel": "Updated",
      "category": { "google": "Google Ads", "meta": "Meta Ads" },
      "type": { "lancamento": "Launch", "negocioLocal": "Local Business" },
      "currency": "R$"
    },
    "wallet": {
      "title": "Wallet Management",
      "subtitle": "Add credits to a user's balance",
      "addCreditsTitle": "Add Credits to User",
      "targetEmail": "User Email",
      "targetEmailPlaceholder": "user@example.com",
      "amount": "Amount in BRL (R$)",
      "amountPlaceholder": "0.00",
      "amountHint": "Enter the amount in BRL. Ex: 10.50 for R$ 10.50 (Maximum: R$ 1,000.00)",
      "reason": "Reason",
      "reasonPlaceholder": "Describe the reason for adding credits (minimum 10 characters)",
      "reasonCounter": "{count}/10 minimum characters",
      "addCredits": "Add Credits",
      "adding": "Adding...",
      "limits": {
        "title": "Warning - Security Controls",
        "addsRealBalance": "This action adds real balance to the user",
        "affectsProduction": "Balance added affects production",
        "perTx": "Per-transaction limit: R$ 1,000.00",
        "daily": "Daily admin limit: R$ 5,000.00",
        "txCount": "Maximum 50 transactions per day",
        "reasonRequired": "Reason required (minimum 10 characters)",
        "loggedWithIp": "All actions are logged with IP and timestamp",
        "useResponsibly": "Use responsibly"
      }
    },
    "messages": {
      "fillFields": "Please fill in all fields",
      "invalidAmount": "Please enter a valid amount",
      "reasonTooShort": "Reason must be at least 10 characters",
      "loadError": "Error loading data",
      "saveSuccess": "Changes saved successfully",
      "pricesLoaded": "Prices loaded successfully!",
      "pricesUpdated": "Prices updated successfully!",
      "creditsAddedToUser": "Credits added successfully for {email}! Daily limits: R$ {used} / R$ {max}"
    }
  }
```

- [ ] **Step 2: No commit yet.** Continue to Task 5.

---

## Task 5: Add `admin` namespace to `es.json` and commit i18n foundation

**Files:**
- Modify: `src/locales/es.json:end-of-file`

- [ ] **Step 1: Insert the `admin` block (Spanish translations)**

Open `src/locales/es.json`. Append after the existing final block:

```json
,
  "admin": {
    "title": "Panel Administrativo",
    "welcomeBack": "Bienvenido, {name}",
    "nav": {
      "security": "Registros de Seguridad",
      "prices": "Configuración de Precios",
      "wallet": "Gestión de Saldo"
    },
    "security": {
      "title": "Registros de Seguridad",
      "subtitle": "Eventos de seguridad de los últimos {days} días",
      "totalEvents": "Eventos Totales",
      "criticalEvents": "Eventos Críticos",
      "byType": "Eventos por Tipo",
      "bySeverity": "Por Severidad",
      "noEvents": "Haga clic en \"Actualizar\" para cargar las estadísticas",
      "refresh": "Actualizar",
      "loading": "Cargando estadísticas...",
      "lastDays": "{days} días"
    },
    "prices": {
      "title": "Configuración de Precios",
      "subtitle": "Gestiona los precios de los dashboards",
      "save": "Guardar Cambios",
      "saving": "Guardando...",
      "reload": "Recargar",
      "loading": "Cargando precios...",
      "priceLabel": "Precio:",
      "categoryLabel": "Categoría",
      "typeLabel": "Tipo",
      "updatedAtLabel": "Actualizado",
      "category": { "google": "Google Ads", "meta": "Meta Ads" },
      "type": { "lancamento": "Lanzamiento", "negocioLocal": "Negocio Local" },
      "currency": "R$"
    },
    "wallet": {
      "title": "Gestión de Saldo",
      "subtitle": "Añadir créditos al saldo de un usuario",
      "addCreditsTitle": "Añadir Créditos a Usuario",
      "targetEmail": "Email del Usuario",
      "targetEmailPlaceholder": "usuario@ejemplo.com",
      "amount": "Valor en Reales (R$)",
      "amountPlaceholder": "0,00",
      "amountHint": "Ingrese el valor en reales. Ej: 10.50 para R$ 10,50 (Máximo: R$ 1.000,00)",
      "reason": "Motivo",
      "reasonPlaceholder": "Describe el motivo para añadir créditos (mínimo 10 caracteres)",
      "reasonCounter": "{count}/10 caracteres mínimos",
      "addCredits": "Añadir Créditos",
      "adding": "Añadiendo...",
      "limits": {
        "title": "Atención - Medidas de Seguridad",
        "addsRealBalance": "Esta acción añade saldo real al usuario",
        "affectsProduction": "El saldo añadido afecta el ambiente de producción",
        "perTx": "Límite por transacción: R$ 1.000,00",
        "daily": "Límite diario por admin: R$ 5.000,00",
        "txCount": "Máximo 50 transacciones por día",
        "reasonRequired": "Motivo obligatorio (mínimo 10 caracteres)",
        "loggedWithIp": "Todas las acciones se registran con IP y marca de tiempo",
        "useResponsibly": "Usar con responsabilidad"
      }
    },
    "messages": {
      "fillFields": "Por favor, complete todos los campos",
      "invalidAmount": "Por favor, ingrese un valor válido",
      "reasonTooShort": "El motivo debe tener al menos 10 caracteres",
      "loadError": "Error al cargar datos",
      "saveSuccess": "Cambios guardados con éxito",
      "pricesLoaded": "¡Precios cargados con éxito!",
      "pricesUpdated": "¡Precios actualizados con éxito!",
      "creditsAddedToUser": "¡Créditos añadidos con éxito para {email}! Límites diarios: R$ {used} / R$ {max}"
    }
  }
```

- [ ] **Step 2: Run typecheck — must be green now**

Run:
```bash
bun run typecheck
```

Expected: `Tasks: 3 successful, 3 total`. The `Admin` interface plus all three locales are aligned.

- [ ] **Step 3: Commit i18n foundation**

```bash
git add src/locales/types.ts src/locales/pt-BR.json src/locales/en.json src/locales/es.json
git commit -m "feat(i18n): add admin namespace to locales and Translations type

Subprojeto 1 step 1 of 5. New top-level admin.* namespace covering
nav, security/prices/wallet sub-pages, and shared messages — wired
in pt-BR, en, es with matching shape. Zero call sites reference
the new keys yet; subsequent tasks port AdminPanel.tsx to consume
them."
```

---

## Task 6: Create `AdminLayout.tsx` with sub-nav and Outlet

**Files:**
- Create: `src/pages/admin/AdminLayout.tsx`
- Test: `src/pages/admin/AdminLayout.test.tsx`

- [ ] **Step 1: Write the failing test**

`AdminLayout` consumes `useLanguage()` and `useAuth()`, plus `MainLayout` (which transitively pulls in more contexts). Mock those at the module boundary so the test is hermetic.

Create `src/pages/admin/AdminLayout.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
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
          <Route path="security" element={<div>security child</div>} />
          <Route path="prices" element={<div>prices child</div>} />
          <Route path="wallet" element={<div>wallet child</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('AdminLayout', () => {
  it('renders three sub-nav links pointing at the admin sub-routes', () => {
    renderAt('/admin/security')

    const links = screen.getAllByRole('link')
    const hrefs = links.map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/admin/security')
    expect(hrefs).toContain('/admin/prices')
    expect(hrefs).toContain('/admin/wallet')
  })

  it('renders the active child route content via Outlet', () => {
    renderAt('/admin/prices')
    expect(screen.getByText('prices child')).toBeInTheDocument()
  })

  it('marks the active sub-nav link with aria-current="page"', () => {
    renderAt('/admin/wallet')
    const walletLink = screen
      .getAllByRole('link')
      .find((a) => a.getAttribute('href') === '/admin/wallet')
    expect(walletLink).toBeDefined()
    expect(walletLink).toHaveAttribute('aria-current', 'page')
  })
})
```

Note: the third test selects the wallet link by `href` rather than by accessible name — the mocked `t()` returns the i18n key (`admin.nav.wallet`), so name-based selectors would be fragile. `aria-current="page"` is set by `NavLink` automatically when its route matches.

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
bun run test -- src/pages/admin/AdminLayout.test.tsx 2>&1 | tail -20
```

Expected: failure with `Cannot find module './AdminLayout'` or equivalent.

- [ ] **Step 3: Create the layout component**

Create `src/pages/admin/AdminLayout.tsx`:

```tsx
import { DollarSign, Shield, Wallet } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

const tabs = [
  { to: 'security', icon: Shield, key: 'security' as const },
  { to: 'prices', icon: DollarSign, key: 'prices' as const },
  { to: 'wallet', icon: Wallet, key: 'wallet' as const },
]

export function AdminLayout() {
  const { user } = useAuth()
  const { t } = useLanguage()

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('admin.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('admin.welcomeBack', { name: user?.displayName || user?.email || '' })}
            </p>
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map(({ to, icon: Icon, key }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `py-2 px-1 border-b-2 font-medium text-sm ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 inline mr-2" />
                  {t(`admin.nav.${key}`)}
                </NavLink>
              ))}
            </nav>
          </div>

          <Outlet />
        </div>
      </div>
    </MainLayout>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
bun run test -- src/pages/admin/AdminLayout.test.tsx
```

Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminLayout.tsx src/pages/admin/AdminLayout.test.tsx
git commit -m "feat(admin): introduce AdminLayout shell with NavLink sub-nav

Subprojeto 1 step 2 of 5. AdminLayout wraps MainLayout and renders
the page title, three NavLink tabs (security/prices/wallet), and
an Outlet for the child route. NavLink active state is the source
of truth — no internal tab state. Three Vitest tests cover the
href contract, the Outlet rendering, and the active aria-current."
```

---

## Task 7: Create `SecurityLogsPage.tsx`

**Files:**
- Create: `src/pages/admin/SecurityLogsPage.tsx`

- [ ] **Step 1: Create the page**

Create `src/pages/admin/SecurityLogsPage.tsx`:

```tsx
import { httpsCallable } from 'firebase/functions'
import { Activity, AlertTriangle, RefreshCw, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { functions } from '@/firebase/config'

interface SecurityStats {
  total: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  criticalEvents: unknown[]
}

export function SecurityLogsPage() {
  const { t } = useLanguage()
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void load()
    // biome-ignore lint/correctness/useExhaustiveDependencies: load reads only setters and stable refs
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const fn = httpsCallable(functions, 'getSecurityStats')
      const result = await fn({ days: 7 })
      const data = result.data as { success?: boolean; stats?: SecurityStats }
      if (data.success && data.stats) {
        setStats(data.stats)
      } else {
        setError(t('admin.messages.loadError'))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('admin.messages.loadError')
      console.error('[admin] failed to load security stats:', err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          {t('admin.security.title')} ({t('admin.security.lastDays', { days: '7' })})
        </h2>
        <Button onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.security.refresh')}
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-100 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>{t('admin.security.loading')}</p>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="font-semibold">{t('admin.security.totalEvents')}</h3>
                <p className="text-2xl font-bold">{stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <h3 className="font-semibold">{t('admin.security.criticalEvents')}</h3>
                <p className="text-2xl font-bold">{stats.criticalEvents?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-3">{t('admin.security.bySeverity')}</h3>
            <div className="space-y-2">
              {stats.bySeverity &&
                Object.entries(stats.bySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between">
                    <span className="capitalize">{severity}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow md:col-span-2 lg:col-span-3">
            <h3 className="font-semibold mb-3">{t('admin.security.byType')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.byType &&
                Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {type.replace(/_/g, ' ').toLowerCase()}
                    </p>
                    <p className="font-bold">{count}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">{t('admin.security.noEvents')}</div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run:
```bash
bun run typecheck
```

Expected: green.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/SecurityLogsPage.tsx
git commit -m "feat(admin): extract SecurityLogsPage from AdminPanel

Subprojeto 1 step 3 of 5. Owns its own load/state — auto-loads on
mount (parity with the previous useEffect path). Verbose console.log
debug from AdminPanel dropped; only console.error in catch survives,
matching project convention."
```

---

## Task 8: Create `PricesConfigPage.tsx` and `WalletAdminPage.tsx`

**Files:**
- Create: `src/pages/admin/PricesConfigPage.tsx`
- Create: `src/pages/admin/WalletAdminPage.tsx`

- [ ] **Step 1: Create `PricesConfigPage.tsx`**

```tsx
import { httpsCallable } from 'firebase/functions'
import { DollarSign, RefreshCw, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { functions } from '@/firebase/config'

interface ProductPrice {
  id: string
  name: string
  description: string
  price: number
  category: 'google' | 'meta'
  type: 'lancamento' | 'negocio_local'
  isActive: boolean
  updatedAt?: { seconds: number }
  updatedBy?: string
}

export function PricesConfigPage() {
  const { t } = useLanguage()
  const [prices, setPrices] = useState<ProductPrice[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    void load()
    // biome-ignore lint/correctness/useExhaustiveDependencies: load reads only setters and stable refs
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      setMessage('')
      const fn = httpsCallable(functions, 'getProductPrices')
      const result = await fn()
      const data = result.data as { success?: boolean; prices?: ProductPrice[] }
      if (data.success && data.prices) {
        setPrices(data.prices)
      }
    } catch (err) {
      console.error('[admin] failed to load prices:', err)
      const msg = err instanceof Error ? err.message : t('admin.messages.loadError')
      setMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  const updatePrice = (id: string, newPrice: number) => {
    setPrices((current) =>
      current.map((p) => (p.id === id ? { ...p, price: newPrice } : p)),
    )
  }

  const save = async () => {
    try {
      setSaving(true)
      setMessage('')
      const fn = httpsCallable(functions, 'updateProductPrices')
      const result = await fn({ prices })
      const data = result.data as { success?: boolean }
      if (data.success) {
        setMessage(t('admin.messages.pricesUpdated'))
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (err) {
      console.error('[admin] failed to save prices:', err)
      const msg = err instanceof Error ? err.message : t('admin.messages.loadError')
      setMessage(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          {t('admin.prices.title')}
        </h2>
        <div className="flex gap-2">
          <Button onClick={load} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.prices.reload')}
          </Button>
          <Button onClick={save} disabled={saving}>
            <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
            {saving ? t('admin.prices.saving') : t('admin.prices.save')}
          </Button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-lg bg-green-100 text-green-800 border border-green-200">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>{t('admin.prices.loading')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prices.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{product.description}</p>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{t('admin.prices.priceLabel')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{t('admin.prices.currency')}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={product.price}
                    onChange={(e) =>
                      updatePrice(product.id, Number.parseFloat(e.target.value) || 0)
                    }
                    className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                <p>
                  {t('admin.prices.categoryLabel')}: {t(`admin.prices.category.${product.category}`)}
                </p>
                <p>
                  {t('admin.prices.typeLabel')}:{' '}
                  {t(
                    `admin.prices.type.${product.type === 'negocio_local' ? 'negocioLocal' : 'lancamento'}`,
                  )}
                </p>
                {product.updatedAt && (
                  <p>
                    {t('admin.prices.updatedAtLabel')}:{' '}
                    {new Date(product.updatedAt.seconds * 1000).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `WalletAdminPage.tsx`**

```tsx
import { httpsCallable } from 'firebase/functions'
import { Plus, RefreshCw, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { functions } from '@/firebase/config'

interface AddCreditsResponse {
  success?: boolean
  adminLimits?: { dailyTotalAfter: number; maxDailyAmount: number }
}

export function WalletAdminPage() {
  const { t } = useLanguage()
  const [targetEmail, setTargetEmail] = useState('')
  const [amountReais, setAmountReais] = useState('')
  const [reason, setReason] = useState('')
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async () => {
    if (!targetEmail || !amountReais || !reason) {
      setMessage(t('admin.messages.fillFields'))
      return
    }
    const amount = Number.parseFloat(amountReais)
    if (Number.isNaN(amount) || amount <= 0) {
      setMessage(t('admin.messages.invalidAmount'))
      return
    }
    if (reason.length < 10) {
      setMessage(t('admin.messages.reasonTooShort'))
      return
    }
    try {
      setAdding(true)
      setMessage('')
      const fn = httpsCallable(functions, 'addUserCredits')
      const result = await fn({
        targetEmail,
        amount: Math.round(amount * 100),
        reason,
      })
      const data = result.data as AddCreditsResponse
      if (data.success && data.adminLimits) {
        setMessage(
          t('admin.messages.creditsAddedToUser', {
            email: targetEmail,
            used: String(data.adminLimits.dailyTotalAfter),
            max: String(data.adminLimits.maxDailyAmount),
          }),
        )
        setTargetEmail('')
        setAmountReais('')
        setReason('')
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (err) {
      console.error('[admin] failed to add credits:', err)
      const msg = err instanceof Error ? err.message : t('admin.messages.loadError')
      setMessage(msg)
    } finally {
      setAdding(false)
    }
  }

  const isError = message.toLowerCase().includes('erro') || message.toLowerCase().includes('error')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Wallet className="w-6 h-6" />
        {t('admin.wallet.title')}
      </h2>

      {message && (
        <div
          className={`p-4 rounded-lg border ${
            isError
              ? 'bg-red-100 text-red-800 border-red-200'
              : 'bg-green-100 text-green-800 border-green-200'
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow max-w-2xl">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {t('admin.wallet.addCreditsTitle')}
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="targetEmail"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('admin.wallet.targetEmail')}
            </label>
            <input
              id="targetEmail"
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder={t('admin.wallet.targetEmailPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
            />
          </div>

          <div>
            <label
              htmlFor="amountReais"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('admin.wallet.amount')}
            </label>
            <input
              id="amountReais"
              type="number"
              step="0.01"
              min="0"
              value={amountReais}
              onChange={(e) => setAmountReais(e.target.value)}
              placeholder={t('admin.wallet.amountPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">{t('admin.wallet.amountHint')}</p>
          </div>

          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('admin.wallet.reason')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.wallet.reasonPlaceholder')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('admin.wallet.reasonCounter', { count: String(reason.length) })}
            </p>
          </div>

          <Button
            onClick={submit}
            disabled={adding || !targetEmail || !amountReais || !reason || reason.length < 10}
            className="w-full"
          >
            {adding ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {t('admin.wallet.adding')}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                {t('admin.wallet.addCredits')}
              </>
            )}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            {t('admin.wallet.limits.title')}
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• {t('admin.wallet.limits.addsRealBalance')}</li>
            <li>• {t('admin.wallet.limits.affectsProduction')}</li>
            <li>• {t('admin.wallet.limits.perTx')}</li>
            <li>• {t('admin.wallet.limits.daily')}</li>
            <li>• {t('admin.wallet.limits.txCount')}</li>
            <li>• {t('admin.wallet.limits.reasonRequired')}</li>
            <li>• {t('admin.wallet.limits.loggedWithIp')}</li>
            <li>• {t('admin.wallet.limits.useResponsibly')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run typecheck and tests**

Run:
```bash
bun run typecheck && bun run test -- src/pages/admin/
```

Expected: typecheck green; AdminLayout's 3 tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/PricesConfigPage.tsx src/pages/admin/WalletAdminPage.tsx
git commit -m "feat(admin): extract PricesConfigPage and WalletAdminPage

Subprojeto 1 step 4 of 5. Both pages own their own state, consume
the admin.* i18n namespace, and call the same Firebase functions
as the previous AdminPanel tabs (getProductPrices/updateProductPrices/
addUserCredits) with identical argument shapes. No behavior change."
```

---

## Task 9: Wire the nested routes in `App.tsx` and delete `AdminPanel.tsx`

**Files:**
- Modify: `src/App.tsx:1-145`
- Delete: `src/pages/AdminPanel.tsx`

- [ ] **Step 1: Replace the import in `App.tsx`**

In `src/App.tsx`, find:
```ts
import { AdminPanel } from '@/pages/AdminPanel'
```

Replace with:
```ts
import { Navigate } from 'react-router-dom'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { PricesConfigPage } from '@/pages/admin/PricesConfigPage'
import { SecurityLogsPage } from '@/pages/admin/SecurityLogsPage'
import { WalletAdminPage } from '@/pages/admin/WalletAdminPage'
```

(Keep `BrowserRouter`, `Route`, `Routes` on the existing `react-router-dom` import — only `Navigate` is new.)

- [ ] **Step 2: Replace the `/admin` route block**

Find:
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

Replace with:
```tsx
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<Navigate to="security" replace />} />
                <Route path="security" element={<SecurityLogsPage />} />
                <Route path="prices" element={<PricesConfigPage />} />
                <Route path="wallet" element={<WalletAdminPage />} />
              </Route>
```

- [ ] **Step 3: Verify the merged `react-router-dom` import is correct**

The line at the top of `App.tsx` should now look like:
```ts
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
```

If it didn't get merged automatically, fix it manually.

- [ ] **Step 4: Run typecheck and tests**

Run:
```bash
bun run typecheck && bun run test -- src/pages/admin/
```

Expected: green.

- [ ] **Step 5: Delete `AdminPanel.tsx`**

```bash
rm "src/pages/AdminPanel.tsx"
```

- [ ] **Step 6: Verify nothing else imports it**

Run:
```bash
grep -rn "from.*AdminPanel'" src/ || echo "no remaining importers — good"
```

Expected: `no remaining importers — good`. If anything appears, stop and remediate.

- [ ] **Step 7: Run full build to be safe**

```bash
bun run build
```

Expected: build succeeds. Output `dist/` written.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/pages/AdminPanel.tsx
git commit -m "feat(admin): swap /admin to nested routes; delete AdminPanel.tsx

Subprojeto 1 step 5 of 5. /admin now redirects to /admin/security
and renders sub-pages via AdminLayout's <Outlet />. The Subprojeto 0
diagnostic 'Debug Info' block goes away with the deleted file. Sub-
sequent admin features (dashboard, users, etc.) plug into the same
nested-route pattern."
```

---

## Task 10: Update docs and conventions

**Files:**
- Modify: `docs/CHANGES.md`
- Modify: `docs/I18N.md`
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Append a `[2026-04-26]` entry to `docs/CHANGES.md`**

Open `docs/CHANGES.md`. Add this entry as the new top-most entry (above the existing 2026-04-26 entries):

```markdown
## [2026-04-26] — Admin panel IA refactor (Subprojeto 1)

Single-page tabbed `AdminPanel.tsx` (569 lines) replaced by nested routes under a shared `AdminLayout`. Same Cloud Function calls, same UI behavior — IA prep for the four follow-up admin features (dashboard, users, wallet ops, logs UX).

- **`/admin` → nested routes.** [src/App.tsx](../src/App.tsx) declares a parent `<Route path="/admin">` guarded by `AdminRoute` once at the parent level. Children: `index → Navigate to="security"`, `security`, `prices`, `wallet`. Bookmarks at `/admin` keep working via the redirect.
- **Per-page extraction.** New [src/pages/admin/AdminLayout.tsx](../src/pages/admin/AdminLayout.tsx) owns the page title, the `NavLink`-based sub-nav, and `<Outlet />`. New [SecurityLogsPage](../src/pages/admin/SecurityLogsPage.tsx), [PricesConfigPage](../src/pages/admin/PricesConfigPage.tsx), [WalletAdminPage](../src/pages/admin/WalletAdminPage.tsx) each own their own state + Firebase callable. Old `AdminPanel.tsx` deleted (`grep` confirmed zero remaining importers).
- **i18n `admin.*` namespace landed in pt-BR/en/es** with a typed [src/locales/types.ts](../src/locales/types.ts) `Admin` interface. Every key consumed in the new pages is type-checked at compile time.
- **Cleanup.** The "Debug Info" block (email/UID/provider/displayName) and verbose `console.log('🔍 === DEBUG SECURITY STATS ===')` lines that were diagnostic for Subprojeto 0's CORS/404 incident are removed. `console.error` in catch handlers stays — that's the project convention for failed callables.
- **Test coverage.** New `src/pages/admin/AdminLayout.test.tsx` (3 cases) covers the NavLink hrefs, the `<Outlet />` rendering, and the active `aria-current="page"` attribute. Behaviour-preserving extracts (`SecurityLogsPage`, `PricesConfigPage`, `WalletAdminPage`) are not unit-tested — the underlying functions weren't tested before either, and typecheck plus manual smoke covers the regression surface.
- **No new dependencies, no functions changes, no DB changes.**
```

- [ ] **Step 2: Add a small reference to `admin.*` in `docs/I18N.md`**

Open `docs/I18N.md`. Find the section that lists existing namespaces (e.g. `dashboard`, `sidebar`, `loginPage`). Append `admin` to that list with a one-line description: `admin — administrative panel pages (security, prices, wallet)`. If `docs/I18N.md` doesn't have such a list yet, just append a new sub-section at the end:

```markdown
### Feature-scoped namespaces

The locales root is organised by feature surface, not by language convention. Each top-level key maps to a single product area: `dashboard`, `sidebar`, `loginPage`, `settingsPage`, `admin`, etc. New features get a new top-level namespace (do NOT bolt onto `common` unless the strings are genuinely cross-cutting).

The `admin` namespace, added 2026-04-26, is the canonical example: it nests `nav`, three per-page sub-namespaces (`security`, `prices`, `wallet`), and a shared `messages` block. The shape is mirrored in `src/locales/types.ts`'s `Admin` interface so missing keys are TypeScript errors.
```

- [ ] **Step 3: Add a row to the Read-first map in `CLAUDE.md`**

Open `CLAUDE.md`. The file does not currently have a Read-first map (that one lives in `AGENTS.md`). Skip this step for `CLAUDE.md`. Move to Step 4.

- [ ] **Step 4: Add a row to the Read-first map in `AGENTS.md`**

Open `AGENTS.md`. Find the Read-first map table (`| Task type | Read these files first |`). Add this row:

```markdown
| Add an admin sub-page | `src/pages/admin/AdminLayout.tsx`, `src/App.tsx` (admin nested routes), `src/locales/pt-BR.json` admin namespace, `src/locales/types.ts` `Admin` interface |
```

Place it under the existing "Add a new page" row.

- [ ] **Step 5: Commit**

```bash
git add docs/CHANGES.md docs/I18N.md AGENTS.md
git commit -m "docs: log Subprojeto 1 admin IA refactor

CHANGES.md gets the dated entry; I18N.md picks up admin.* as the
canonical example of feature-scoped namespaces; AGENTS.md Read-first
map gains a row for admin sub-page work."
```

---

## Task 11: Manual smoke test (user-facing verification)

**Files:**
- Read-only verification.

This task is the only one that cannot be automated by the executing engineer alone — it requires a logged-in admin browsing the running dev server. The acceptance criteria #3, #4, #5, #6, #8, #9 from the spec live here.

- [ ] **Step 1: Start the dev server (if not already running)**

```bash
bun run dev
```

Expected: Vite serves on `http://localhost:5173`.

- [ ] **Step 2: Hand off to the user with the smoke checklist**

Tell the user (verbatim):

> Subprojeto 1 está pronto para verificação visual. Por favor, com o admin logado, faça os seguintes checks no navegador (`localhost:5173`):
>
> 1. Abrir `localhost:5173/admin` — deve redirecionar para `/admin/security` e mostrar a aba de Logs com cards.
> 2. Clicar em "Configuração de Preços" no sub-nav — URL muda para `/admin/prices`, mostra os 4 produtos com inputs de preço.
> 3. Clicar em "Gestão de Saldo" — URL muda para `/admin/wallet`, mostra o formulário de adicionar créditos + caixa amarela de avisos.
> 4. **Refresh (Cmd+R)** em qualquer das três sub-páginas — deve continuar na mesma aba (não voltar para security).
> 5. Console (DevTools) — deve estar limpo durante a navegação (sem `=== DEBUG SECURITY STATS ===` ou similar).
> 6. A caixa azul "Debug Info" com Email/UID/Provider — não deve mais aparecer em lugar nenhum.
> 7. Trocar de idioma (header) — labels do sub-nav e títulos das páginas devem traduzir para EN/ES.
> 8. (Opcional) Logar com conta NÃO-admin e tentar `/admin/wallet` direto — deve cair em `/dashboard`.
>
> Se algum item falhar, reporta qual e eu conserto antes do commit final.

- [ ] **Step 3: After user confirms green, mark Subprojeto 1 closed.**

Update `TodoWrite` to set Subprojeto 1 as completed and Subprojeto 2 as `in_progress`.

---

## Self-review (engineer should do this before opening a PR)

After completing all tasks, run this checklist against the spec's "Acceptance checklist":

| # | Criterion | How to verify |
|---|---|---|
| 1 | `bun run build` succeeds | Last line of `bun run build` output is no error |
| 2 | `bun run typecheck` succeeds | `Tasks: 3 successful, 3 total` |
| 3 | `/admin` redirects to `/admin/security` | Browser smoke (Task 11) |
| 4 | Each sub-route renders the expected content | Browser smoke (Task 11) |
| 5 | Sub-nav active state matches URL | Browser smoke + AdminLayout test 3 |
| 6 | Refresh stays on sub-route | Browser smoke (Task 11) |
| 7 | DevTools console clean during normal nav | Browser smoke (Task 11) |
| 8 | Non-admin bounced from sub-routes | Browser smoke (Task 11), optional |
| 9 | "Debug Info" block gone | Browser smoke (Task 11), and `grep -rn "Debug Info" src/` returns 0 |
| 10 | No leftover `AdminPanel` imports | `grep -rn "from.*AdminPanel'" src/` returns 0 |
| 11 | All three locales have the `admin` namespace with matching shape | Typecheck enforces this; manual `jq 'keys' src/locales/{pt-BR,en,es}.json` shows `admin` in each |
| 12 | Docs updated | `git log --oneline` shows the docs commit; `grep -l "Subprojeto 1" docs/CHANGES.md` returns the file |

If any row is unchecked, finish that work before claiming the subproject done.
