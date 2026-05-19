---
name: new-zod-schema
description: Cria um novo schema Zod em packages/shared/src/schemas/ seguindo a convenção source-of-truth do projeto (ADR-009). Use quando o usuário pedir "criar schema para X", "adicionar validação Zod para Y", "novo schema Firestore", "schema novo para callable Z", ou descrever uma nova coleção/contrato que precisa de validação. Cobre criação do .ts + .test.ts co-located, re-export no index, run tests, update de DATA-MODEL.md e entry em CHANGES.md.
---

# New Zod schema — AdSmart workflow

Esta skill garante que todo schema novo siga a convenção de source-of-truth de `packages/shared` (`packages/shared/AGENTS.md`).

## When to invoke

Auto-invoke quando o usuário descrever necessidade de novo schema:
- "Criar schema para [entidade]"
- "Adicionar validação Zod para [input/output]"
- "Novo schema Firestore para [coleção]"
- "Schema novo para callable [nome]"
- "Preciso validar [campo X] em [documento Y]"

NÃO use para: mudar schema existente (use diretamente o 4-step flow do `packages/shared/AGENTS.md`).

## Hard rules

- Schema vai em `packages/shared/src/schemas/{name}.ts` (sem exceção).
- Test co-located em `{name}.test.ts` no mesmo diretório (hook `check-zod-schema-test.sh` bloqueia commit sem ele).
- Type derivado via `export type Name = z.infer<typeof NameSchema>` — NUNCA `interface` paralelo.
- Re-export adicionado em `packages/shared/src/index.ts`.
- Zod 4 idioms: `z.email()`, `z.url()`, `z.iso.datetime()` (NÃO `z.string().email()`).
- Timestamps: `zTimestamp()` de `@adsmart/shared` (NÃO `z.unknown()` ou `z.date()`).

## Workflow

### Passo 1 — Definir contrato

Antes de criar arquivo, definir:

| Campo | Type | Origem | Notas |
|---|---|---|---|
| `id` | `string` | server-gen | `db.collection('x').doc().id` |
| `userId` | `string` | auth.uid | imutável |
| `createdAt` | `Timestamp` | server | `serverTimestamp()` |
| `…` | … | … | … |

Confirme com o usuário antes de gerar código se houver ambiguidade.

### Passo 2 — Criar arquivo

```typescript
// packages/shared/src/schemas/foo.ts
import { z } from 'zod'
import { zTimestamp } from '../utils/zTimestamp'

export const FooSchema = z.object({
  id: z.string(),
  userId: z.string(),
  createdAt: zTimestamp(),
  updatedAt: zTimestamp(),
  email: z.email().optional(),
  url: z.url().optional(),
  // ...
})

export type Foo = z.infer<typeof FooSchema>

// Se cliente puder atualizar parcialmente:
export const FooClientUpdateSchema = FooSchema.pick({
  // apenas campos client-mutable
}).strict()

export type FooClientUpdate = z.infer<typeof FooClientUpdateSchema>
```

### Passo 3 — Criar test co-located

```typescript
// packages/shared/src/schemas/foo.test.ts
import { describe, expect, it } from 'vitest'
import { FooSchema } from './foo'
import { Timestamp } from 'firebase-admin/firestore'

describe('FooSchema', () => {
  it('aceita doc válido', () => {
    const valid = {
      id: 'foo_123',
      userId: 'user_abc',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    expect(FooSchema.parse(valid)).toEqual(valid)
  })

  it('rejeita doc sem userId', () => {
    const invalid = {
      id: 'foo_123',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    expect(() => FooSchema.parse(invalid)).toThrow()
  })

  // Adicione casos de rejection específicos para cada constraint não-trivial
})
```

### Passo 4 — Re-export

Adicionar em `packages/shared/src/index.ts`:

```typescript
export { FooSchema, type Foo, FooClientUpdateSchema, type FooClientUpdate } from './schemas/foo'
```

### Passo 5 — Verificar

```bash
cd packages/shared
bun run test       # deve incluir os novos casos e passar
bun run typecheck  # exit 0
```

### Passo 6 — Docs

Update `docs/DATA-MODEL.md` com:
- Estrutura do documento
- Coleção (se Firestore)
- Permissions (link para `firestore.rules`)
- Lifecycle (criado por X, lido por Y, mutado por Z)

Add entry em `docs/CHANGES.md`:

```markdown
## [YYYY-MM-DD] — Novo schema Foo

- `packages/shared/src/schemas/foo.ts` criado
- 4 casos de teste co-located
- Documentado em docs/DATA-MODEL.md
```

### Passo 7 — Se Firestore

Se o schema é uma coleção Firestore nova:
- Adicionar regra em `firestore.rules` (default deny + permissions específicas — princípio 10)
- Test em `functions/test/firestore-rules.test.ts`
- Run `/firestore-rules-test` antes de deploy

## Anti-patterns

- ❌ `interface Foo` paralelo — sempre `z.infer`
- ❌ `z.string().email()` — use `z.email()`
- ❌ `z.unknown()` para Timestamp — use `zTimestamp()`
- ❌ Schema sem test co-located — hook bloqueia
- ❌ Commit sem update de DATA-MODEL.md + CHANGES.md

## Referências

- [packages/shared/AGENTS.md](packages/shared/AGENTS.md) — convenção full
- [ADR-009](docs/Decisions.md) — Schemas como source of truth
- [docs/DATA-MODEL.md](docs/DATA-MODEL.md) — onde registrar
