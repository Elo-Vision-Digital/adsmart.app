---
description: Cria versão nova de um prompt LLM em packages/shared/src/prompts/{name}/v{N}.ts mantendo histórico imutável. INF-1 + ADR-022 (a publicar em Fase 0d).
argument-hint: <prompt-name>
---

Você vai versionar um prompt LLM existente (ou criar novo).

## Args

- `<prompt-name>`: nome em kebab-case (ex: `report-summary`, `business-type-classifier`).

## Convenção (a estabelecer formalmente em ADR-022, Fase 0d)

```
packages/shared/src/prompts/
  <prompt-name>/
    v1.ts          # versão 1 (imutável após primeira call em prod)
    v2.ts          # versão 2 (próxima iteração)
    v{N}.ts
    index.ts       # re-exports + LATEST_VERSION constant
```

Cada versão exporta:

```typescript
export const PROMPT_V1 = {
  version: 1 as const,
  modelId: 'claude-opus-4-7',  // ou 'deepseek-chat'
  system: '...',
  templates: {
    user: (input: { ... }) => `...`,
  },
} as const
```

## Passos

### 1. Localizar prompt existente

```bash
find packages/shared/src/prompts -name "${name}" -type d
```

Se não existe, criar pasta nova.

### 2. Próxima versão

```bash
ls "packages/shared/src/prompts/${name}/" | grep -E "^v[0-9]+\.ts$" | sort -V | tail -1
# Se vN.ts é o último, próximo é v(N+1).ts
```

### 3. Criar v{N+1}.ts

Template:

```typescript
import type { PromptDefinition } from '../../types/prompt'

export const PROMPT_V{N+1}: PromptDefinition = {
  version: {N+1},
  modelId: 'claude-opus-4-7',
  system: '<refinado a partir de v{N}>',
  templates: {
    user: (input) => `...`,
  },
}
```

### 4. Update index

```typescript
// packages/shared/src/prompts/<name>/index.ts
export { PROMPT_V1 } from './v1'
export { PROMPT_V2 } from './v2'
export const LATEST_VERSION = PROMPT_V2
```

### 5. Teste co-located

```typescript
// packages/shared/src/prompts/<name>/v{N+1}.test.ts
import { describe, expect, it } from 'vitest'
import { PROMPT_V{N+1} } from './v{N+1}'

describe('PROMPT_V{N+1}', () => {
  it('tem modelId e system', () => {
    expect(PROMPT_V{N+1}.modelId).toBeDefined()
    expect(PROMPT_V{N+1}.system.length).toBeGreaterThan(50)
  })
})
```

### 6. Migrar caller para usar versão nova

Localizar:

```bash
grep -rn "PROMPT_V${N}\|prompts/${name}" functions/src/ src/
```

Update import:

```typescript
import { PROMPT_V{N+1} } from '@adsmart/shared'

const result = await callLlm({
  modelId: PROMPT_V{N+1}.modelId,
  system: PROMPT_V{N+1}.system,
  // ...
})

// Logger registra versão para tracing
logger.info('llm_call_completed', {
  ...
  promptName: '<name>',
  promptVersion: PROMPT_V{N+1}.version,
})
```

### 7. Tests + docs

```bash
cd packages/shared
bun run test
bun run typecheck
```

Update docs/CHANGES.md.

## Anti-patterns

- ❌ Editar v{N} existente (deve ser imutável após primeiro call em prod)
- ❌ Hardcodar version number nas calls (sempre via `LATEST_VERSION` ou ref explícita)
- ❌ Pular log da versão (perde rastreabilidade de qualidade)

## Referências

- ADR-022 (a publicar Fase 0d) — Prompt versioning convention
- [docs/research/02-llm-strategy.md](docs/research/02-llm-strategy.md)
- [.claude/skills/validate-llm-call/SKILL.md](.claude/skills/validate-llm-call/SKILL.md)
