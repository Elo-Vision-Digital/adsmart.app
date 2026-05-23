---
name: new-report-business-type
description: Adiciona um novo tipo de negócio ao fluxo FLOW-3 (geração de relatório) da AdSmart. Use quando o usuário pedir "adicionar tipo de negócio X", "novo business type para relatório", "suportar [tipo de loja/serviço] no fluxo de relatório", ou referenciar FLOW-3. Cobre update do schema businessType, configuração no typesBusinessConfig, definição das métricas para render in-app (ADR-022), i18n nas 3 línguas e teste do fluxo.
---

# New report business type — AdSmart FLOW-3

Esta skill adiciona um novo `businessType` (ex: `ecommerce`, `service`, `local-business`) ao fluxo de geração de relatórios.

## When to invoke

Auto-invoke quando o usuário pedir:
- "Adicionar tipo de negócio [X] ao gerador de relatório"
- "Suportar [vertical] em FLOW-3"
- "Novo business type para [nicho]"

NÃO use para: criar novo componente de visualização in-app sem tipo de negócio (use `feature-dev:feature-dev`).

## Pré-requisitos

- Schema `businessType.ts` existe em `packages/shared/src/schemas/` (verificar)
- Configuração das métricas/seções a renderizar in-app (ADR-022) já foi definida (PM/usuário)
- Decisão sobre quais métricas o relatório vai mostrar (definido com PM/usuário)

## Workflow

### Passo 1 — Atualizar schema

```typescript
// packages/shared/src/schemas/businessType.ts
export const BusinessTypeSchema = z.enum([
  'ecommerce',
  'service',
  'local-business',
  // adicionar: 'new-type'
])
```

Update test co-located + run `cd packages/shared && bun run test`.

### Passo 2 — typesBusinessConfig

Localizar config de tipos:

```bash
grep -rn "typesBusinessConfig\|businessTypeConfig\|businessTypes" src/ packages/shared/src/
```

Adicionar entrada para o novo tipo:

```typescript
{
  id: 'new-type',
  i18nKey: 'reportTypes.newType',
  reportSections: ['overview', 'campaigns', 'performance'], // seções in-app (ADR-022)
  recommendedPlatforms: ['google-ads', 'meta-ads'],
  // metadados específicos
}
```

### Passo 3 — Configuração de métricas para render in-app (ADR-022)

Definir como o relatório vai renderizar in-app (substitui a etapa antiga de template Looker Studio, removido em Fase 0.5):
- Seções a renderizar (overview, campanhas, performance, comparativos)
- Métricas-chave por seção (CPA, ROAS, CTR, etc.)
- Componentes de visualização aplicáveis (tabela, gráfico, KPI card)

Documentar em `docs/REPORT-TEMPLATES.md` (criar se não existir).

### Passo 4 — i18n nas 3 línguas

Editar `src/locales/pt-BR.json` (source):

```json
{
  "reportTypes": {
    "newType": {
      "name": "Nome em português",
      "description": "Descrição PT",
      "icon": "lucide-icon-name"
    }
  }
}
```

Replicar em `en.json` + `es.json`. Hook `check-i18n` (Fase 0b) bloqueia ausência.

### Passo 5 — UI

Verificar TemplatesPage / GenerateReportPage absorvem automaticamente via config OU se precisa editar manualmente:

```bash
grep -rn "businessType\|reportType" src/pages/TemplatesPage.tsx src/pages/GenerateReportPage.tsx
```

Se a UI lê do config (typesBusinessConfig), nada a fazer. Se a UI tem switch hardcoded, refactor para ler do config primeiro.

### Passo 6 — Cloud Function (se necessário)

Se a geração precisa de processamento específico no backend (ex: agregação de métricas):
- Adicionar branch em `functions/src/{generateReport}.ts` (ou similar)
- Manter Zod validation no input
- Structured logging (`logger.info('report_generation_started', { businessType, userId, ... })`)

### Passo 7 — Teste E2E manual

```bash
bun run dev
# Login → /templates → selecionar "new-type" → /generate-report → confirmar fluxo até finalização
```

### Passo 8 — Docs sweep

- `docs/CHANGES.md` — entry com data
- `docs/REPORT-TEMPLATES.md` — adicionar tipo + template + métricas
- `docs/redesign/FEATURES-INVENTORY.md § FLOW-3` — atualizar lista

## Anti-patterns

- ❌ Hardcodar `reportType === 'new-type'` em vários lugares — sempre via config
- ❌ Pular i18n nas 3 línguas
- ❌ Não documentar as seções/métricas do tipo (vai virar tribal knowledge)
- ❌ Referenciar Looker Studio / lookerTemplateId — removido em Fase 0.5; in-app render via ADR-022

## Referências

- [docs/redesign/FEATURES-INVENTORY.md § FLOW-3](docs/redesign/FEATURES-INVENTORY.md) — geração de relatório
- [packages/shared/src/schemas/businessType.ts](packages/shared/src/schemas/businessType.ts)
