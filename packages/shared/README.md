# `@adsmart/shared`

Pacote workspace com **schemas Zod** compartilhados entre o app web (`src/`) e as Cloud Functions (`functions/`). É a fonte de verdade para formatos de documentos Firestore que precisam ser validados ou tipados nos dois lados.

## Consumidores

| Workspace | Dependência |
|-----------|-------------|
| Raiz (`@adsmart/web`) | `"@adsmart/shared": "workspace:*"` |
| `functions/` | mesmo padrão (via workspace) |

Tipos são inferidos com `z.infer`; não duplique interfaces à mão em outros pacotes — estenda ou exporte a partir daqui.

## Layout

```
packages/shared/
  src/
    index.ts           # Reexports públicos
    firestore.ts       # zTimestamp() e helpers de campo Firestore
    schemas/           # Um arquivo por domínio (report, transaction, …)
      *.test.ts        # Vitest — colocado junto ao schema
  package.json
  tsconfig.json
  tsconfig.build.json
  vitest.config.ts
```

## Alterar um documento Firestore

1. Editar o schema em `src/schemas/<domínio>.ts` (não tipar “no feeling” em `src/types` ou só no Functions).
2. Ajustar ou acrescentar caso em `*.test.ts` correspondente.
3. `cd packages/shared && bun run test && bun run typecheck`
4. Na raiz: `bun run typecheck` (Turbo valida web e functions).
5. Atualizar [docs/DATA-MODEL.md](../../docs/DATA-MODEL.md) e uma entrada datada em [docs/CHANGES.md](../../docs/CHANGES.md).

Detalhes e racional: [CLAUDE.md](../../CLAUDE.md) (seção *Editing Firestore document shapes*) e [ADR-009](../../docs/Decisions.md).

## Comandos (neste diretório)

| Comando | Ação |
|---------|------|
| `bun run build` | Emite `dist/` via `tsconfig.build.json` |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Vitest (suites em `src/schemas/`) |
| `bun run test:watch` | Vitest em modo watch |
| `bun run clean` | Remove `dist` e artefatos de build |

Na raiz do monorepo, `bun run test:all` / `bun run type-check` também incluem este pacote via Turbo.

## Importação no app

```ts
import { ReportSchema, type Report, zTimestamp } from '@adsmart/shared'
```

Em desenvolvimento o bundler resolve tipicamente `src/`; o campo `exports` em `package.json` cobre build e tipos para publicação/consistência.

## Leitura relacionada

- [AGENTS.md](../../AGENTS.md) — visão geral do monorepo e convenções
- [docs/DATA-MODEL.md](../../docs/DATA-MODEL.md) — coleções e campos no Firestore
- [docs/REFACTOR-PLAN.md](../../docs/REFACTOR-PLAN.md) — evolução de padronização Zod + converters no web
