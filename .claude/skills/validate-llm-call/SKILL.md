---
name: validate-llm-call
description: Valida que uma Cloud Function que chama LLM (Anthropic ou DeepSeek) segue INF-1 (observabilidade obrigatória) — structured logging com modelId/tokens/latency, cost tracking, idempotência, Zod IO, rate limit e error handling. Use quando o usuário pedir "review desta callable LLM", "checar se a função X tá em compliance", "validar a chamada do Claude/DeepSeek na função Y", ou referenciar INF-1.
---

# Validate LLM call — AdSmart INF-1 compliance

INF-1 (princípio 9 + observabilidade INF do roadmap): toda chamada LLM em produção é logada estruturadamente, com cost tracking, idempotência e Zod IO.

## When to invoke

Auto-invoke quando o usuário pedir review de função LLM:
- "Validar [callable]"
- "Esta função tá em compliance com INF-1?"
- "Review da chamada [Anthropic|DeepSeek]"
- "Tá registrando custo desta callable?"

NÃO use para: criar callable nova (use `functions-new-callable` skill — `.claude/commands/functions-new-callable.md`).

## Checklist (cada item PASS/FAIL)

### 1. Structured logging com modelo + tokens + latência

```typescript
import { logger } from 'firebase-functions/v2'

const startedAt = Date.now()
const response = await client.messages.create({ /* ... */ })
const latencyMs = Date.now() - startedAt

logger.info('llm_call_completed', {
  userId,
  requestId,
  modelId: 'claude-opus-4-7',           // OBRIGATÓRIO
  tokensIn: response.usage.input_tokens,  // OBRIGATÓRIO
  tokensOut: response.usage.output_tokens, // OBRIGATÓRIO
  latencyMs,                             // OBRIGATÓRIO
  feature: 'report_generation',           // OBRIGATÓRIO
})
```

PASS se grep da função encontra `logger.info` com os 5 campos acima.

### 2. Cost tracking

Salvar registro em `llmCalls/{id}` (schema `packages/shared/src/schemas/llmCall.ts`):

```typescript
import { LlmCallSchema } from '@adsmart/shared'

const calcCost = (modelId: string, tokensIn: number, tokensOut: number): number => {
  // tabela de preços de modelos (cents)
}

await db.collection('llmCalls').doc(requestId).set({
  id: requestId,
  userId,
  modelId,
  tokensIn,
  tokensOut,
  latencyMs,
  costCents: calcCost(modelId, tokensIn, tokensOut),
  feature: 'report_generation',
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
})
```

PASS se há `set` em `llmCalls/` com schema `LlmCallSchema`.

### 3. Idempotência

Padrão `processedRequests/{requestId}` (ver `functions/AGENTS.md § Idempotência`):

```typescript
const ref = db.collection('processedRequests').doc(requestId)
return db.runTransaction(async (tx) => {
  const snap = await tx.get(ref)
  if (snap.exists) return snap.data()!.result
  const result = await callLlm(...)
  tx.set(ref, { result, processedAt: FieldValue.serverTimestamp() })
  return result
})
```

PASS se há `processedRequests` ou equivalente.

### 4. Zod IO

```typescript
import { GenerateReportInputSchema, GenerateReportOutputSchema } from '@adsmart/shared'

const parsed = GenerateReportInputSchema.safeParse(request.data)
if (!parsed.success) throw new HttpsError('invalid-argument', parsed.error.message)

const output: z.infer<typeof GenerateReportOutputSchema> = { /* ... */ }
return output
```

PASS se input passa por `safeParse` E output tem type derivado de Zod.

### 5. Rate limit

```typescript
await checkRateLimit(userId, 'generate_report', 5, 60)  // 5 calls per 60min
```

PASS se há `checkRateLimit` antes da chamada LLM.

### 6. Error handling

```typescript
try {
  // call LLM
} catch (err: any) {
  logger.error('llm_call_failed', { userId, modelId, error: err.message, code: err.code })
  if (err instanceof HttpsError) throw err
  throw new HttpsError('internal', 'LLM call failed')
}
```

PASS se há catch com `logger.error` estruturado + re-throw de `HttpsError`.

### 7. Secrets via defineSecret

```typescript
import { anthropicApiKey } from './config'
// ...
export const generateReport = onCall(
  { secrets: [anthropicApiKey], region: 'us-central1' },
  async (request) => {
    const client = new Anthropic({ apiKey: anthropicApiKey.value() })
    // ...
  },
)
```

PASS se:
- API key vem de `defineSecret` em `config/index.ts`
- Função declara `secrets: [...]` no `onCall` options
- Lê via `.value()` (não `process.env`)

## Report format

| Item | Status | Observação |
|---|---|---|
| 1. Structured logging | ✅ / ❌ | linha XX |
| 2. Cost tracking | ✅ / ❌ | |
| 3. Idempotência | ✅ / ❌ | |
| 4. Zod IO | ✅ / ❌ | |
| 5. Rate limit | ✅ / ❌ | |
| 6. Error handling | ✅ / ❌ | |
| 7. Secret via defineSecret | ✅ / ❌ | |

**VERDICT**: PASS (7/7) ou FAIL (apontar items faltando, ordem de prioridade)

## Anti-patterns

- ❌ `console.log` em vez de `logger.info` (não aparece estruturado no Cloud Logging)
- ❌ Hardcodar `modelId: 'claude-opus-4-7'` em string solta — usar do schema/config
- ❌ Não salvar em `llmCalls/` — perde rastreabilidade de custo
- ❌ `apiKey: process.env.ANTHROPIC_KEY` — hook `check-no-process-env-secret.sh` bloqueia

## Referências

- [docs/research/02-llm-strategy.md](docs/research/02-llm-strategy.md) — combo Anthropic + DeepSeek
- [docs/redesign/FEATURES-INVENTORY.md § INF-1](docs/redesign/FEATURES-INVENTORY.md) — observabilidade
- [packages/shared/src/schemas/llmCall.ts](packages/shared/src/schemas/llmCall.ts)
- [functions/AGENTS.md § Structured logging](functions/AGENTS.md)
