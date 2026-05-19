# API Contracts

All Cloud Functions exported from `functions/src/index.ts`. Region: `us-central1`.

Callable functions use Firebase `httpsCallable` on the client. The framework wraps the call in `{ data: <input> }` and returns `{ data: <output> }`.

---

## verifyRecaptcha

**File:** `functions/src/recaptcha.ts`  
**Trigger:** `onCall`  
**Auth required:** No (anonymous allowed)  
**Secrets:** `recaptchaSecretKey`  
**Rate limit:** 10 attempts / 5 minutes per userId (or `"anonymous"` if unauthenticated)

**Input:**
```typescript
{ token: string }
```

**Output (success):**
```typescript
{
  success: true,
  verified: true
}
```

**Errors:**
- `invalid-argument` — token missing
- `internal` — reCAPTCHA API call failed
- `resource-exhausted` — rate limit exceeded

---

## checkRateLimit

**File:** `functions/src/rateLimiter.ts`  
**Trigger:** Utility (not directly exported as HTTP callable)  
**Called by:** Other functions internally

**Signature:**
```typescript
checkRateLimit(
  userId: string,
  action: string,
  maxAttempts?: number,  // default 5
  windowMinutes?: number // default 15
): Promise<boolean>
```

Throws `resource-exhausted` if blocked. Returns `true` if allowed.

---

## getProductPrices

**File:** `functions/src/priceManager.ts`
**Trigger:** `onCall` (firebase-functions v2, region `us-central1`)
**Auth required:** Yes + admin check (via `isAdminUser` from `@adsmart/shared`)
**Input schema:** none (empty payload)
**Output schema:** `ProductPriceSchema` array from `@adsmart/shared`

**Input:** `{}` (none)

**Output:**
```typescript
{
  success: true,
  prices: Array<ProductPrice>   // see @adsmart/shared/schemas/productPrice
}
```

If the `productPrices` collection is empty, returns `DEFAULT_PRODUCT_PRICES` (sourced from `@adsmart/shared`) with a synthetic `updatedAt`/`updatedBy: 'system'`.

---

## updateProductPrices

**File:** `functions/src/priceManager.ts`
**Trigger:** `onCall` (firebase-functions v2, region `us-central1`)
**Auth required:** Yes + admin check
**Input schema:** `UpdateProductPricesInputSchema` from `@adsmart/shared` (validated via `safeParse`)

**Input:**
```typescript
{
  prices: Array<{
    id: string,
    name: string,
    description: string,
    price: number,            // BRL, will be rounded to 2 decimals server-side
    category: "google" | "meta",
    type: "lancamento" | "negocio_local",
    isActive: boolean,
  }>  // 1..50 items
}
```

Server stamps `updatedAt` (server Timestamp) and `updatedBy` (admin email) — clients cannot set them.

**Output:**
```typescript
{
  success: true,
  message: string,
  updatedAt: string,   // ISO 8601
}
```

**Errors:**
- `unauthenticated` — not signed in
- `permission-denied` — caller is not admin
- `invalid-argument` — Zod validation failed; first issue message is returned

---

## initializeDefaultPrices

**File:** `functions/src/priceManager.ts`
**Trigger:** `onCall` (firebase-functions v2, region `us-central1`)
**Auth required:** Yes + admin check

Idempotent. Seeds the canonical `DEFAULT_PRODUCT_PRICES` catalog (from `@adsmart/shared`) into `productPrices/{id}`.

**Output:** `{ success: true, message: string, count: number }`

---

## getPublicProductPrices

**File:** `functions/src/getPublicProductPrices.ts`  
**Trigger:** `onCall` (firebase-functions v1 style)  
**Auth required:** No

Returns only `isActive: true` prices.

**Output:**
```typescript
{
  success: true,
  prices: Array<{
    id: string,
    name: string,
    description: string,
    price: number,
    category: string,
    type: string
  }>
}
```

---

## handleGoogleAdsCallbackWithSelection

**File:** `functions/src/googleAdsOAuthV2.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes  
**Secrets:** `googleAdsClientSecret`, `googleAdsDeveloperToken`

Step 1 of Google Ads OAuth V2. Validates state token (CSRF), exchanges auth code for tokens, lists accessible ad accounts, stores temporary token.

**Input:**
```typescript
{ code: string, state: string }
```

**Output (success):**
```typescript
{
  success: true,
  accountsAvailable: Array<{
    id: string,
    name: string,
    currency: string,
    type: string,
    email: string
  }>,
  mainAccount: { name: string, email: string },
  temporaryToken: string   // use in confirmGoogleAdsAccountSelection
}
```

**Errors:**
- `unauthenticated` — not signed in
- `invalid-argument` — code/state missing or state not found in Firestore
- `permission-denied` — state belongs to different user
- `deadline-exceeded` — state expired (> 10 min)
- `internal` — token exchange or API failure

---

## confirmGoogleAdsAccountSelection

**File:** `functions/src/googleAdsOAuthV2.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes  
**Secrets:** `googleAdsClientSecret`, `googleAdsDeveloperToken`

Step 2 of Google Ads OAuth V2. Saves selected accounts + encrypted tokens, deletes temporary token.

**Input:**
```typescript
{
  temporaryToken: string,
  selectedAccountIds: string[]
}
```

**Output:**
```typescript
{ success: true, accountsConnected: number }
```

**Errors:**
- `unauthenticated`, `invalid-argument` — same guards as step 1
- `not-found` — temporary token expired or not found
- `permission-denied` — token belongs to different user
- `deadline-exceeded` — 30-minute temporary token expired

---

## handleMetaAdsCallbackWithSelection

**File:** `functions/src/metaAdsOAuthV2.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes  
**Secrets:** `metaAdsAppSecret`

Same two-step pattern as Google Ads. Step 1. Exchanges code for Meta long-lived token, lists Business ad accounts.

**Input:** `{ code: string, state: string }`

**Output:**
```typescript
{
  success: true,
  accountsAvailable: Array<{
    id: string,
    name: string,
    currency: string,
    accountStatus: number,
    businessName?: string
  }>,
  mainAccount: { name: string, email: string },
  temporaryToken: string
}
```

---

## confirmMetaAdsAccountSelection

**File:** `functions/src/metaAdsOAuthV2.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes  
**Secrets:** `metaAdsAppSecret`

Step 2 of Meta Ads OAuth V2.

**Input:** `{ temporaryToken: string, selectedAccountIds: string[] }`

**Output:** `{ success: true, accountsConnected: number }`

---

## addUserCredits

**File:** `functions/src/adminWalletManager.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes + admin check

Adds BRL centavos credits to any user's wallet. Admin-only.

**Input:**
```typescript
{
  targetEmail: string,
  amount: number,    // BRL centavos, positive integer, max 100000 (R$1000)
  reason: string     // min 10 chars
}
```

**Output:**
```typescript
{
  success: true,
  message: string,
  amountAdded: number,
  targetUserId: string,
  timestamp: string,
  adminLimits: {
    dailyTotalAfter: number,  // BRL float
    dailyCountAfter: number,
    maxDailyAmount: number,   // 5000 (R$5000)
    maxDailyTransactions: number  // 50
  }
}
```

**Errors:**
- `unauthenticated` — not signed in
- `permission-denied` — caller is not admin
- `invalid-argument` — bad email, non-positive amount, amount > 100000, reason < 10 chars
- `resource-exhausted` — daily limits exceeded
- `not-found` — target email not in Firebase Auth

---

## deleteUserData

**File:** `functions/src/deleteUserData.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes

**Status:** Placeholder implementation. Logs deletion intent but does not yet delete all subcollections. Full implementation deferred.

**Input:** `{}` (none — deletes data for the calling user)

---

## getDashboardMetrics

**File:** `functions/src/getDashboardMetrics.ts`
**Trigger:** `onCall({ memory: '512MiB' })`
**Auth required:** Yes + admin check (custom claim `admin === true` OR `ADMIN_EMAILS` allowlist)
**Schemas:** `GetDashboardMetricsInputSchema` / `GetDashboardMetricsOutputSchema` from `@adsmart/shared` (source of truth: [packages/shared/src/schemas/dashboardMetrics.ts](../packages/shared/src/schemas/dashboardMetrics.ts))

Powers `/admin/dashboard`. Runs 7 reads in parallel via `Promise.allSettled` over labelled queries (Q1–Q7). On any rejection, throws `internal` with `Dashboard query failures: Q<n>[, Q<m>...]` so Cloud Logging surfaces which read failed instead of collapsing into an opaque `INTERNAL`. Day buckets for sparklines use `America/Sao_Paulo` via a BRT-anchored `enumerateDays`. `realCents = max(0, totalCents - grantedCents)` derives real revenue (Firestore lacks a `!=` aggregation operator).

**Input:**
```typescript
{
  startDate: string,  // ISO 8601 datetime
  endDate: string     // ISO 8601 datetime; must be >= startDate; range capped at 365 days
}
```

**Output:**
```typescript
{
  range: { startDate: string, endDate: string, days: number },
  revenue: {
    realCents: number,        // integer >= 0 (BRL centavos)
    creditsCents: number,     // integer >= 0 (admin-issued)
    sparkline: Array<{ date: string /* YYYY-MM-DD */, realCents: number, creditsCents: number }>
  },
  users: {
    newCount: number,
    activeCount: number,
    totalCount: number,
    sparkline: Array<{ date: string /* YYYY-MM-DD */, newCount: number }>
  },
  integrations: {
    byPlatform: Array<{ platform: 'google_ads' | 'meta_ads', distinctUserCount: number }>
  },
  generatedAt: string         // ISO 8601 datetime
}
```

**Errors:**
- `unauthenticated` — not signed in
- `permission-denied` — caller is not admin
- `invalid-argument` — bad ISO datetime, `endDate < startDate`, or range > 365 days (server-side guard mirrors the client guard for defense-in-depth)
- `internal` — labelled as `Dashboard query failures: Q<n>[, Q<m>...]` when one or more reads reject (typically a missing composite index or `fieldOverride`); see Cloud Logging for the per-query `[dashboard:fail:Q<n>]` rows

**Required indexes / overrides** (in [firestore.indexes.json](../firestore.indexes.json)):
- `transactions` (collection group) — composite indexes for the aggregate-sum queries (Q1, Q2): `status + type + createdAt + amount` and `adminAction + status + type + createdAt + amount`; field overrides for `createdAt` (ASC + DESC, COLLECTION + COLLECTION_GROUP) and `amount`
- `adAccounts.isActive` — single-field override at COLLECTION (ASC + DESC) and COLLECTION_GROUP (ASC) scopes for Q7
- `users.createdAt` — ASC for Q4 (users-in-range)

---

## Payment callables — removed

SuitPay was removed end-to-end in [ADR-021](Decisions.md#adr-021-remove-suitpay-end-to-end--harden-prepare-deploy-against-secretenv-overlap) (2026-05-18). The callables `suitpayWebhook`, `createPixPayment`, and `checkPaymentStatus` no longer exist. Asaas replacement is planned but not yet wired — see [PAYMENTS.md](PAYMENTS.md).

---

## getGoogleAdsAuthUrl (V1 — deprecated)

**File:** `functions/src/googleAdsOAuth.ts`  
**Status:** V1 deprecated. Use V2 flow (`handleGoogleAdsCallbackWithSelection`).

## getGoogleAdsCampaigns (V1 — deprecated)

**File:** `functions/src/googleAdsOAuth.ts`

## getMetaAdsAuthUrl (V1 — deprecated)

**File:** `functions/src/metaAdsOAuth.ts`

## getMetaAdsCampaigns (V1 — deprecated)

**File:** `functions/src/metaAdsOAuth.ts`

---

# Foundation Callables — Planned (FOUND-1)

> Callables planejados para o redesign (referência [docs/redesign/FEATURES-INVENTORY.md FOUND-2](redesign/FEATURES-INVENTORY.md)). Schemas Zod source-of-truth já criados em [packages/shared/src/schemas/](../packages/shared/src/schemas/) na Sprint -1. Implementação concreta vem nas Fases 0a (harness) e 3.5 (novo fluxo de relatório).

Padrões obrigatórios para TODA callable nova (princípios 9-12 + 13-16 do roadmap):

- `firebase-functions/logger` estruturado em todas as branches (não `console.log`)
- Idempotência via `processedRequests/{clientRequestId}` em transação Firestore
- `checkRateLimit(uid, action, max, window)` chamado antes da lógica de negócio
- Exponential backoff em chamadas externas (Google Ads API, Meta Marketing API, LLM providers)
- Zod parse no input do request + no output (quando aplicável)
- Secrets via `defineSecret` em `functions/src/config/index.ts` (nunca `process.env.X_SECRET`)
- Validator agent (subagent separado em processo isolado) audita o output antes do commit

## createReport

**File:** `functions/src/reports/createReport.ts` (planned)
**Trigger:** `onCall`
**Auth required:** Yes (request.auth.uid)
**Rate limit:** 5 reports / 5 minutes per uid
**Idempotency:** via `clientRequestId` UUID v4 do cliente

Substitui o `addDoc(collection(db, 'reports'), ...)` atualmente feito direto no [src/pages/GenerateReportPage.tsx](../src/pages/GenerateReportPage.tsx) (FLOW-4 do roadmap). Server-side fica responsável por validar, debitar créditos, criar o `report` e subcoleções de `platforms`, e disparar a callable interna `analyzeReportData` para gerar insights via LLM.

**Input** (Zod `CreateReportInputSchema` a ser criado):
```typescript
{
  clientRequestId: string,            // UUID v4 do cliente
  platforms: AdPlatform[],            // ['google_ads'] ou ['google_ads', 'meta_ads'] etc.
  businessType: BusinessType,         // 'launch' | 'local' | 'evergreen' | ...
  accountIds: Record<AdPlatform, string>,
  campaignIds: Record<AdPlatform, string[]>,
  dateRange: { startDate: string, endDate: string },
  name: string,
}
```

**Output:**
```typescript
{ reportId: string, cost: number }   // cost em créditos (1 por plataforma)
```

**Errors:**
- `unauthenticated`
- `permission-denied` — usuário não tem créditos suficientes
- `failed-precondition` — conta de anúncios não conectada para alguma plataforma
- `invalid-argument` — período sem dados / payload inválido
- `resource-exhausted` — rate limit

**Side-effects:**
- Cria `users/{uid}/reports/{reportId}`
- Cria `processedRequests/{clientRequestId}` (idempotência)
- Debita créditos em `users/{uid}/wallet/current` (em transação)
- Cria `users/{uid}/transactions/{txId}` com `type: 'debit'`
- Dispara processing async para popular `users/{uid}/reports/{reportId}/platforms/{platform}` + `insights/`

## refreshReport

**File:** `functions/src/reports/refreshReport.ts` (planned)
**Trigger:** `onCall`
**Auth required:** Yes
**Rate limit:** cooldown manual configurável (GATE-REFRESH — provisional 5min)

Re-fetches dados das APIs Google/Meta para um relatório já gerado e atualiza subcoleção `platforms/`. Não debita créditos (refresh é gratuito).

**Input:** `{ reportId: string }`
**Output:** `{ refreshedAt: Timestamp, platformsUpdated: AdPlatform[] }`
**Errors:** `unauthenticated`, `not-found`, `permission-denied`, `resource-exhausted` (cooldown)

## refreshActiveReports (scheduled)

**File:** `functions/src/reports/refreshActiveReports.ts` (planned)
**Trigger:** `onSchedule('every X minutes')` — GATE-REFRESH define X
**Region:** `us-central1`

Busca reports com `nextAutoRefreshAt <= now` e re-fetches dados em background. Idempotente via timestamps no doc.

## createReportShare

**File:** `functions/src/reports/createReportShare.ts` (planned)
**Trigger:** `onCall`
**Auth required:** Yes (must be owner of reportId)
**Rate limit:** 10 shares / minute per uid

Cria share-link público com UUID v4 (122 bits entropia). Snapshot dos dados renderizáveis copiado para subcoleção `publicReportShares/{shareId}/snapshot/data` — link estável mesmo se owner re-gerar.

**Input:** `CreateReportShareInputSchema` (já criado em FOUND-1 — ver `packages/shared/src/schemas/publicReportShare.ts`)
**Output:** `{ shareId: string, shareUrl: string }`

## revokeReportShare

**File:** `functions/src/reports/revokeReportShare.ts` (planned)
**Trigger:** `onCall`
**Auth required:** Yes (owner only)

Marca `revokedAt` em `publicReportShares/{shareId}` — `firestore.rules` nega get após isso.

**Input:** `{ shareId: string }`
**Output:** `{ ok: true }`

## listReportShares

**File:** `functions/src/reports/listReportShares.ts` (planned)
**Trigger:** `onCall`
**Auth required:** Yes

Lista shares ativos do usuário (com viewCount). Composite index em `(ownerId, createdAt desc)`.

**Input:** `{ reportId?: string }`
**Output:** `{ shares: PublicReportShare[] }`

## recordShareView

**File:** `functions/src/reports/recordShareView.ts` (planned)
**Trigger:** `onCall` ou `onRequest` (pixel-style)
**Auth required:** No (público)
**Rate limit:** por IP — 60 req/min

Incrementa `viewCount` em `publicReportShares/{shareId}` com rate-limit anti-abuse. App Check recomendado.

## exportReportPDF

**File:** `functions/src/reports/exportReportPDF.ts` (planned)
**Trigger:** `onCall`
**Auth required:** Yes (owner only)
**Memory:** 2GiB · **CPU:** 1 · **Timeout:** 120s
**Rate limit:** 10 PDFs/min, 100 PDFs/dia per uid

Playwright + `@sparticuz/chromium` (research/05). Navega para `/reports/:id/render?token={signedJWT}`, gera PDF, sobe para Cloud Storage `gs://adsmart-pdf-exports/pdfs/{uid}/{reportId}/{ts}.pdf` (lifecycle 24h), retorna signed URL com 1h de validade.

**Input:** `{ reportId: string }`
**Output:** `{ downloadUrl: string, expiresAt: Timestamp }`

## analyzeReportData (internal)

**File:** `functions/src/ai/analyzeReportData.ts` (planned)
**Trigger:** Função interna (não exportada como callable)
**Chamada por:** `createReport` (async após gerar dados) e `refreshReport`

LLM call combo Anthropic + DeepSeek (research/02). Roteamento:
- DeepSeek V4 Flash: parsing/sumarização de dados brutos
- Claude Sonnet 4.6: geração final do `AIReportInsight` (user-facing)

Output validado contra `AIReportInsightSchema` antes do save. Registra `llmCalls/{callId}` com tokens/custo/latência.

**Input (interno):** `{ uid, reportId, platform, businessType, platformData }`
**Side-effects:**
- Cria/atualiza `users/{uid}/reports/{reportId}/insights/{platform}`
- Cria `llmCalls/{callId}` (1+ por chamada, dependendo do roteamento)

## getAvailableDataPeriods

**File:** `functions/src/reports/getAvailableDataPeriods.ts` (planned)
**Trigger:** `onCall`
**Auth required:** Yes
**Rate limit:** 30 req/min per uid

Consulta APIs Google Ads / Meta Marketing para descobrir quais períodos têm dados disponíveis para as contas+campanhas selecionadas. Retorna lista usada pelo date picker do FLOW-2 (decisão do usuário: detecção automática).

**Input:**
```typescript
{
  platform: AdPlatform,
  accountId: string,
  campaignIds: string[]
}
```
**Output:**
```typescript
{
  availableDays: string[],            // ['2026-05-01', '2026-05-02', ...]
  earliestData: string | null,        // ISO date ou null se nunca houve dados
  latestData: string | null
}
```

---

## Stripe webhook (FUTURE §8 — NÃO entra no roadmap inicial)

Documentado em [docs/research/08-stripe-future.md](research/08-stripe-future.md) para referência futura. Quando FUTURE §8 entrar, callable `stripeWebhook` (onRequest com signature verify) + idempotência via `processedRequests/{event.id}`.
