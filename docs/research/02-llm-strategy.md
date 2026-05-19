# Research — LLM Strategy (Anthropic Claude + DeepSeek combo)

**Validado em**: 2026-05-19
**Fontes**: WebSearch — Anthropic pricing 2026, DeepSeek pricing 2026, Vercel AI SDK + OpenRouter routing
**Aplicação**: INF-1 do roadmap inicial (geração de relatório por tipo de negócio)

---

## 1. Pricing real validado (Maio 2026)

| Provider | Modelo | Input / 1M | Output / 1M | Cache input | Best for |
|---|---|---|---|---|---|
| Anthropic | Claude Sonnet 4.6 | $3.00 | $15.00 | $0.30 (write) / $0.03 (read) | **Anchor** — outputs user-facing, análises críticas |
| Anthropic | Claude Haiku 4.5 | $1.00 | $5.00 | $0.10 / $0.01 | Classificação, sumarização, alto volume |
| Anthropic | Claude Opus 4.7 | $15.00 | $75.00 | $1.50 / $0.15 | Apenas para casos críticos com Sonnet falhando |
| DeepSeek | V4 Flash (atual) | $0.14 | $0.28 | $0.0028 (cached) | **Bulk/parsing** — agregação, sumarização barata |
| DeepSeek | V3.2 | $0.14 | $0.28 | similar | Alternativa estável |

**Confirmação**: o combo **Anthropic + DeepSeek** que o usuário propôs é mais cost-efficient que single-provider:
- Sonnet 4.6 sozinho: $3/$15 (caro pra volume)
- Sonnet 4.6 + Haiku 4.5: redução de ~70% em tarefas de classificação
- Sonnet 4.6 (anchor) + DeepSeek V4 (volume): redução de ~95% em parsing/agregação, mantendo qualidade só no que é user-facing

---

## 2. Estratégia de roteamento recomendada

### Por tipo de tarefa

| Tarefa | Modelo recomendado | Justificativa |
|---|---|---|
| Geração de insight user-facing (texto que vai pro relatório) | **Sonnet 4.6** | Qualidade narrativa em PT-BR + structured output |
| Classificação de tipo de negócio (validação da escolha do usuário) | **Haiku 4.5** | Tarefa simples, baixo custo |
| Parsing/agregação de dados Google Ads + Meta | **DeepSeek V4 Flash** | Volume alto, estrutura simples |
| Geração de breakdown por campanha (texto) | **Sonnet 4.6 ou Haiku 4.5** | Depende da complexidade |
| Sumarização de período (X dias de dados → tl;dr) | **Haiku 4.5** | Sumarização é forte do Haiku |
| Validação de output (judge/verifier) | **Haiku 4.5** | Custo baixo para validar Sonnet |

### Padrão recomendado: roteador caseiro inicial → AI Gateway/OpenRouter depois

**Fase 1 (roadmap inicial)**: roteador caseiro simples em `functions/src/ai/router.ts`
```ts
const router = {
  async generate(task: 'insight' | 'classify' | 'parse' | 'summarize', input: ...) {
    const model = pickModel(task)
    return callProvider(model, input)
  }
}
```

**Fase futura** (quando volume crescer): migrar para AI Gateway/OpenRouter
- **Vercel AI Gateway**: melhor se hospedar frontend no Vercel — governance, budgets, fallbacks
- **OpenRouter**: melhor se quiser flexibilidade total — 300+ modelos, `models` array com fallback automático

### Por que NÃO usar AI Gateway/OpenRouter já agora
- Latência extra (proxy adicional)
- Complexidade desnecessária para 2 providers
- Custo de proxy (OpenRouter cobra 5% por padrão; Vercel AI Gateway cobra setup específico)
- Direct call para Anthropic + DeepSeek SDK é mais simples para começar

---

## 3. Structured output — crítico para relatório

### Padrão obrigatório
Toda chamada LLM no roadmap usa **structured output** (não free-text):
- **Anthropic**: `tool_use` com schema Zod via `@anthropic-ai/sdk`
- **DeepSeek**: `response_format: { type: 'json_object' }` + validação Zod no return
- **Validação**: Zod schema do `packages/shared/src/schemas/` valida o output antes de salvar no Firestore

### Exemplo de schema (a criar)
```ts
// packages/shared/src/schemas/aiReportInsight.ts
export const AIReportInsightSchema = z.object({
  summary: z.string().min(50).max(500),
  topMetrics: z.array(z.object({
    name: z.string(),
    value: z.number(),
    delta: z.number().optional(),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
  })).min(1).max(8),
  recommendations: z.array(z.object({
    title: z.string(),
    rationale: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
  })).max(5),
})
```

---

## 4. Prompt caching — economia de 70-90%

### Anthropic prompt caching (lançado 2024, maduro em 2026)
- Cache de prompts repetidos (system prompt + few-shot) por **5 minutos** (default) ou **1 hora** (premium)
- **Custo**: 1.25× normal escrita, 0.10× leitura
- **Aplicação**: system prompt + few-shot examples por tipo de negócio são CACHEADOS
- Cada chamada subsequente paga só pelo input variável (dados do usuário)

### DeepSeek prefix caching
- Cache automático em prefixos compartilhados de prompt
- Custo cached: $0.0028 / 1M (vs $0.14 cache-miss) — **redução de 98%**
- Aplicação: idem Anthropic — system prompt fixo + dados variáveis

### Implicação no roadmap
- Em [functions/src/ai/prompts/](functions/src/ai/prompts/) (a criar), system prompts ficam **versionados e cacheados**
- Mudar system prompt = nova versão de cache → primeiros usuários pagam o overhead

---

## 5. Observabilidade obrigatória (princípio do roadmap)

### Por que
- LLM tem custo variável real
- Sem logs, impossível debugar respostas ruins
- Sem custo logged, impossível precificar GATE-2 (pacotes de crédito futuro) e GATE-1 (Premium credits FUTURE)

### O que logar (em `functions/src/logger.ts` wrapper)
```ts
logger.info('LLM call', {
  provider: 'anthropic',
  model: 'claude-sonnet-4-6',
  task: 'generate_report_insight',
  reportId,
  userId,
  inputTokens,
  outputTokens,
  cachedTokens,
  costUSD,
  latencyMs,
  promptVersion: 'insight-v1.2',
})
```

### Schema novo: `llmCalls` (coleção write-only Admin SDK)
- Para analytics agregadas: custo por usuário, por feature, por modelo
- Útil quando Stripe (FUTURE §8) entrar — preço por crédito calibrado a partir desses dados reais

---

## 6. Decisões pendentes (GATE-LLM-COMBO no roadmap)

| Decisão | Status | Quando fechar |
|---|---|---|
| Modelo exato Anthropic | Sonnet 4.6 anchor + Haiku 4.5 helper (provisório) | Validar em testes reais |
| Modelo exato DeepSeek | V4 Flash (provisório) | Validar latência PT-BR |
| Vai usar AI Gateway ou direct calls? | **Direct calls** (decisão deste research) | Reavaliar quando volume > 1k calls/dia |
| Prompt caching ativo? | **Sim** (Anthropic + DeepSeek) | Default desde dia 1 |
| Limit de tokens por chamada? | A definir | Fase de implementação |
| Timeout de chamada LLM? | 60s default Anthropic, 60s DeepSeek | Fase de implementação |
| Fallback chain? | **Não inicialmente** — usar try/catch + retry simples | Reavaliar após observabilidade |

### Sources

- [Anthropic API Pricing 2026](https://aicostcheck.com/provider/anthropic)
- [DeepSeek V4 Flash pricing](https://devtk.ai/en/blog/ai-api-pricing-comparison-2026/)
- [Vercel AI Gateway vs OpenRouter](https://www.truefoundry.com/blog/vercel-ai-gateway-vs-openrouter)
- [LLM API Pricing Comparison May 2026](https://costgoat.com/compare/llm-api)
- [Best AI LLM Routers 2026](https://pinggy.io/blog/best_ai_llm_routers_openrouter_alternatives/)
