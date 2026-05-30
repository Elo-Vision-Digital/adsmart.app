# Research — Firebase Stack (Cloud Functions v2, Firestore, Rules, Scheduler)

**Validado em**: 2026-05-19
**Fontes**: Firebase developerknowledge MCP (oficial Google), WebSearch sobre patterns 2026
**Aplicação**:  ()

---

## 1. Cloud Functions v2 — patterns validados

### Idempotência (obrigatória em callables que mutam estado)
- **Padrão Google**: usar `event.id` (webhook) ou parâmetro de cliente como **idempotency key**
- **Implementação**: transação Firestore lendo `processedEvents/{eventId}` antes de mutar; se já processado → return success sem repetir efeito
- **Combinar com retries**: at-least-once delivery + idempotent handler = safe
- **Aplicação **:
  - `createReport` callable: cliente envia `clientRequestId` UUID; backend cria `processedRequests/{clientRequestId}` em transação
  - `refreshReport`: idempotente via timestamp do último refresh + cooldown
  - Future Stripe webhooks: usar `event.id` do Stripe como key

### Structured logging
- **Padrão Google**: `firebase-functions/logger` SDK (não `console.log` cru)
- **Severity levels**: `logger.info / warn / error / debug` com structured data como último argumento
- **Aplicação**:
  ```ts
  import * as logger from 'firebase-functions/logger'
  logger.info('Report created', { reportId, userId, platforms, businessType, cost })
  ```
- **Princípio **: TODA callable nova usa `logger` + tags `feature`, `userId`, `requestId`

### Rate limits gen2 (importantes para dimensionar refresh)
| Operação | Limite gen2 | Pode aumentar? |
|---|---|---|
| READ API calls | 1200 / 60s | Sim |
| WRITE API calls (deploy/delete) | 60 / 60s | **Não** |
| CALL API calls | (sem limite gen2) | — |

**Implicação para refresh automático**: se tivermos 100 relatórios ativos refreshing a cada 30min, são 100 chamadas Google/Meta API por refresh — bem abaixo dos limites do Firebase, mas precisa cuidar do **rate limit da Google Ads/Meta** (que é mais apertado).

### Exponential backoff em retries
- Toda chamada externa (LLM, Google Ads, Meta Marketing) deve usar exponential backoff
- Lib: `p-retry` ou retry nativo do SDK do provider
- **Aplicação**: `analyzeCampaign`, `refreshReport`, `getGoogleAdsCampaigns`, `getMetaAdsCampaigns`

---

## 2. Cloud Functions Scheduled — refresh automático (INF-2)

### Padrão Firebase 2026
```ts
import { onSchedule } from 'firebase-functions/v2/scheduler'

export const refreshActiveReports = onSchedule({
  schedule: 'every 30 minutes',
  timeZone: 'America/Sao_Paulo',
  region: 'us-central1',
  memory: '512MiB',
  timeoutSeconds: 540,
}, async (event) => {
  // logic
})
```

### Como funciona internamente
- Firebase cria automaticamente: Cloud Scheduler job + Pub/Sub topic
- Cloud Scheduler envia mensagem ao Pub/Sub no horário; Pub/Sub dispara a function
- **Custo**: $0.10/mês por job (3 jobs grátis por projeto)

### Decisão: Cloud Scheduler vs Cloud Tasks vs Pub/Sub direto
- **Cloud Scheduler** (via `onSchedule`): recomendado para **refresh periódico fixo** (30min, 1h, etc.) — nosso caso (INF-2 auto)
- **Cloud Tasks**: melhor para **agendar tarefa única no futuro** (ex: "refresh este relatório em 30min se ninguém clicar Atualizar antes") — alternativa para o cooldown manual
- **Pub/Sub direto**: para arquiteturas event-driven (não aplicável aqui)

**Recomendação para INF-2**:
- Auto-refresh: `onSchedule('every X minutes')` que busca reports com `nextAutoRefreshAt <= now`
- Manual com cooldown: callable `refreshReport(reportId)` valida `lastRefreshAt + cooldown <= now`, dispara fetch, atualiza timestamps

---

## 3. Firestore data modeling — patterns validados

### Hard limits relevantes
- **Max 1MB por documento** — relatório com muitos dados precisa subcoleções
- **Subcoleções até 100 níveis** de profundidade
- **Document IDs aleatórios** (evitar IDs monotônicos para evitar hotspot)
- **Listas/queries não-filtradas em coleções grandes**: usar paginação + cursor

### Modelagem proposta para o 

```
users/{uid}
  ├── wallet/current               (saldo agregado)
  ├── transactions/{txId}          (write-only via Admin SDK)
  ├── adAccounts/{accountId}       (contas conectadas Google/Meta)
  └── reports/{reportId}           (metadata + status)
       ├── platforms/{platform}    (dados por plataforma — Google/Meta tabs)
       └── insights/{insightId}    (insights gerados pela LLM)

publicReportShares/{shareId}       (top-level, sem auth para read — ver 04-share-link-patterns)
  - reportId, ownerId, visibleMetrics[], createdAt, viewCount

processedRequests/{requestId}      (idempotência de callables)
processedWebhooks/{eventId}        (FUTURE: idempotência Stripe webhooks)

oauthStates/{stateId}              (já existe)
adminMetrics/{metricKey}           (já existe — getDashboardMetrics)
```

### Por que subcoleção `platforms/` em vez de field no doc principal
- Cada plataforma pode ter MB de dados (campanhas, métricas, breakdown)
- Doc principal de `report` fica leve (< 100KB) → list queries rápidas
- Tab UI faz fetch on-demand do dado da plataforma específica

### Composite indexes necessários (precisam ir em firestore.indexes.json)
- `users/{uid}/reports` ordenado por `createdAt desc` + filtro por `status` → composite
- `users/{uid}/reports` filtrado por `businessType` + ordenado por `createdAt`
- `publicReportShares` por `ownerId` + `createdAt` (para listar shares do usuário)

---

## 4. Firestore Security Rules — patterns validados

### Princípios fundamentais (Google docs)
- **Rules são NÃO filtros**: se query pode retornar doc proibido, **falha inteira**
- **Rules têm limites de `exists()`, `get()`, `getAfter()`** por request (consumir com parcimônia)
- **Rules DON'T support rate limiting** — precisa App Check ou Cloud Function intermediária
- **Rules DON'T support URL token validation** diretamente — segurança vem do **ID imprevisível**

### Pattern crítico: público + dono escreve
```javascript
match /publicReportShares/{shareId} {
  // public read — segurança via shareId imprevisível (UUID v4 = 122 bits entropia)
  allow get: if true;
  // sem list — ninguém pode enumerar shares (mesmo se descobrir collection name)
  allow list: if false;
  // só dono cria/revoga; e nunca via cliente direto — só via callable
  allow create, update, delete: if false;
}

match /users/{uid}/reports/{reportId} {
  // dono lê
  allow get: if request.auth.uid == uid;
  // list só do dono
  allow list: if request.auth.uid == uid;
  // sem write do cliente — só via callable createReport (Admin SDK)
  allow create, update, delete: if false;
}
```

### Anti-enumeração
- `allow list: if false` em coleções públicas — só `get` permitido
- Tokens com entropia alta (UUID v4 ou crypto random 32 bytes hex)
- Defense-in-depth: adicionar `visibility == 'public'` field check no `get`

### Validação de `resource.data` (campo-a-campo)
```javascript
// Função reutilizável
function isValidShareCreate() {
  return request.resource.data.keys().hasAll(['reportId', 'ownerId', 'visibleMetrics', 'createdAt'])
      && request.resource.data.ownerId == request.auth.uid
      && request.resource.data.visibleMetrics is list;
}
```

### Phase 3 baseline já no projeto (manter)
- `wallet/*` e `transactions/*`: cliente NÃO escreve (já bloqueado)
- `rateLimits / securityLogs / backupMetadata`: write-only Admin SDK
- `userDocuments`: write-only via `reserveUserDocument`

### Aplicação 
- Toda nova coleção entra com rule restritiva por default (allow read/write: if false)
- Cliente nunca escreve em `reports/*` direto — sempre via `createReport` callable
- Share-link público segue pattern acima

---

## 5. Secrets management

### Padrão do projeto (manter)
- `defineSecret('SECRET_NAME')` em [functions/src/config/index.ts](functions/src/config/index.ts)
- Acesso: `secret.value()` dentro da function
- **NUNCA** `process.env.X_SECRET` direto — bloqueado por hook `check-no-process-env-secret.sh`

### Novos secrets para o 
| Secret | Uso |
|---|---|
| `ANTHROPIC_API_KEY` | LLM combo (INF-1) |
| `DEEPSEEK_API_KEY` | LLM combo (INF-1) |
| `OPENROUTER_API_KEY` (opcional) | Se decidirmos pelo OpenRouter como gateway |

### Secrets FUTURE (§8 Stripe)
- `STRIPE_SECRET_KEY` (test + prod)
- `STRIPE_WEBHOOK_SECRET` (test + prod)
- `STRIPE_PUBLISHABLE_KEY` (frontend via Vite env, não defineSecret)

---

## 6. Aplicação concreta 

### Princípios novos para os princípios do 
- **Todo callable usa `firebase-functions/logger`** (não `console.log`)
- **Todo callable mutativo é idempotente** (transação + `processedRequests/{id}`)
- **Todo callable usa `checkRateLimit`** ([functions/src/rateLimiter.ts](functions/src/rateLimiter.ts) já existe)
- **Toda chamada externa usa exponential backoff**
- **Toda nova coleção tem rule explícita** (default deny + permissions específicas)
- **Toda mudança em `firestore.rules` é testada** via `/firestore-rules-test` antes de deploy (hook bloqueia se não testou)

### Sources

- [Firebase Functions v2 docs (Google)](https://firebase.google.com/docs/functions)
- [Firestore security rules conditions](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Schedule functions](https://firebase.google.com/docs/functions/schedule-functions)
- [Firebase developerknowledge MCP — consulta direta]
