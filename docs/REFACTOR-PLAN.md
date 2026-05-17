# AdSmart — Plano de Padronização e Single Source of Truth

Status: **Completed (Phases A–E)** · Created: 2026-04-25 · Closed: 2026-04-26 · Branch: `migrate`

## Contexto

Durante o cleanup de mock data (commits `3d2480e`, `32b5f39`) descobrimos que o projeto não tem uma fonte da verdade executável para o schema dos documentos do Firestore. Sintomas observados:

- `Report.type: 'facebook_ads'` vs `AdAccount.platform: 'meta_ads'` — mesma plataforma, dois nomes (corrigido para `meta_ads`).
- `Report` declarava `lookerStudioUrl?: string` mas o backend nunca populava — UI exibia URL fake.
- `docs/DATA-MODEL.md` listava `reports.type: string` (genérico demais) sem refletir o schema real.
- Tipos só existem em `src/types/index.ts` (web); não há contrato compartilhado com `functions/src/`.
- Sem validação runtime — Firestore aceita qualquer formato, drift fica invisível até virar bug.

## Decisão de stack (validada via Context7, 2026-04-25)

- **Zod 4** como schema canônico. Padrão `z.object()` + `z.infer<typeof Schema>` para tipo + `Schema.parse()` para runtime. Zod 4 é o estável atual: 14× mais rápido em string parse, 7× em arrays, bundle menor, `zod/mini` tree-shakable disponível.
- **`FirestoreDataConverter` + `.withConverter()`** como ponte oficial entre Zod e Firestore (padrão recomendado pelo `firebase-js-sdk`). Validação roda em `fromFirestore`; converter é registrado em `DocumentReference`/`Query`.
- **`packages/shared`** dentro do monorepo Bun + Turborepo (já configurado na Phase 5) para schemas compartilhados entre `apps/web` (atual `src/`) e `functions/`.

## Princípios

1. **Schema é código executável**, não markdown. Markdown documenta; código valida.
2. **Uma definição, dois consumidores.** Web e Functions importam do mesmo `packages/shared`.
3. **Validação no boundary**, não em todo lugar. Roda em `fromFirestore` (leitura) e `toFirestore`/handlers (escrita); resto do app trabalha com tipos confiáveis.
4. **Migração defensiva primeiro**, destrutiva depois. Normalizar legado na leitura; só rewriter docs quando o normalizador estiver coberto por testes e a paridade verificada.

---

## Fases

### Fase A — Quick wins do cleanup atual (1–2h)

Cobrir o restante do inventário de mock data antes de refatorar fundação.

- [x] **A1.** Dedup `availableTemplates` em [src/pages/GenerateReportPage.tsx](../src/pages/GenerateReportPage.tsx) — importa `getTemplateById` de [src/components/templates/templateData.ts](../src/components/templates/templateData.ts); nome/descrição vêm de `useProductPrices` + i18n (mesmo padrão do `TemplateCard`).
- [x] **A2.** [src/hooks/useProductPrices.ts](../src/hooks/useProductPrices.ts): mensagem `console.error` explícita ("preços em modo degradado"), `error` propagado para [GenerateReportPage](../src/pages/GenerateReportPage.tsx) com Card-aviso, e correção de race-condition adicionando flag `ignore` no `useEffect` (padrão React 18 oficial validado via Context7). `refetch` (nunca consumido) removido.
- [x] **A3.** [src/pages/MetaReviewDemo.tsx](../src/pages/MetaReviewDemo.tsx): banner persistente "Demo mode — fictitious data" no topo da página, deixando explícito para qualquer reviewer/usuário que os números são mock para Meta App Review.
- [x] **A4.** [src/utils/mockTemplates.ts](../src/utils/mockTemplates.ts) era órfão (`grep -r mockTemplates src/ functions/src/` só achava a própria declaração) — removido.

**Critério de aceite:** nenhum array hardcoded de domínio renderiza em produção fora dos utilitários `dev-only`.

---

### Fase B — Migração one-shot `facebook_ads` → `meta_ads` no Firestore (1h)

Eliminar a normalização defensiva no `useReports()` deixando o schema 100% canônico.

- [x] **B1.** [scripts/migrations/2026-04-meta-ads-rename.ts](../scripts/migrations/2026-04-meta-ads-rename.ts) — Admin SDK + `BulkWriter` (validado via Context7), defaults to dry-run, idempotente, exige `--write` explícito. Adiciona `firebase-admin` + `tsx` como devDeps na raiz (Bun isolated linker bloqueava resolução cross-workspace).
- [x] **B2.** Dry-run em `adsmart-web-dev` (2026-04-25): `facebook_ads=0, meta_ads=0` — projeto dev sem dados.
- [x] **B3.** Dry-run em `adsmart-web` (prod, 2026-04-25): `facebook_ads=0, meta_ads=1` — produção já 100% canônica. Write não executado por desnecessário (script é idempotente; rodar `--write` agora seria no-op).
- [x] **B4.** `normalizeType` removido de [src/hooks/useReports.ts](../src/hooks/useReports.ts).
- [x] **B5.** Nota de "Legacy" em [docs/DATA-MODEL.md](DATA-MODEL.md) atualizada com data e contagem real observada.

**Critério de aceite:** `grep -rn "facebook_ads" src/ functions/src/` retorna zero resultados ✓ (verificado pós-B4).

---

### Fase C — Introduzir Zod schemas (2–3h)

Schemas começam dentro de `src/schemas/` para validar ASAP, antes mesmo do monorepo `packages/shared`. Escopo inicial: collection `reports` (a mais crítica).

- [x] **C1.** `bun add zod` (instalou `zod@4.3.6`).
- [x] **C2.** Criado [src/schemas/report.ts](../src/schemas/report.ts) com `ReportTypeSchema`, `ReportStatusSchema`, `DateRangeSchema`, `ReportSchema` (e tipos derivados via `z.infer`). Exemplo da estrutura:
  ```ts
  import { z } from 'zod'

  export const ReportTypeSchema = z.enum(['google_ads', 'meta_ads'])
  export const ReportStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed'])

  export const DateRangeSchema = z.object({
    startDate: z.string(),  // ISO 8601
    endDate: z.string(),
  })

  export const ReportSchema = z.object({
    id: z.string(),
    userId: z.string(),
    type: ReportTypeSchema,
    templateId: z.string(),
    name: z.string(),
    status: ReportStatusSchema,
    campaignIds: z.array(z.string()).optional(),
    allCampaigns: z.boolean().default(false),
    dateRange: DateRangeSchema.default({ startDate: '', endDate: '' }),
    lookerStudioUrl: z.string().url().optional(),
    cost: z.number().int().nonnegative(),
    paidAt: z.date().optional(),
    createdAt: z.date(),
    completedAt: z.date().optional(),
    error: z.string().optional(),
  })

  export type Report = z.infer<typeof ReportSchema>
  ```
- [x] **C3.** Interface `Report` removida de [src/types/index.ts](../src/types/index.ts); o arquivo agora reexporta o tipo derivado do schema (`export type { Report } from '@/schemas/report'`).
- [x] **C4.** Criado [src/schemas/firestore-converter.ts](../src/schemas/firestore-converter.ts) com helpers genéricos `zodConverter<T>(schema, label)` e `zTimestamp()`. Estrutura:
  ```ts
  export function zodConverter<T>(schema: z.ZodType<T>): FirestoreDataConverter<T> {
    return {
      fromFirestore: (snap, opts) => {
        const data = { id: snap.id, ...snap.data(opts) }
        return schema.parse(normalizeTimestamps(data))
      },
      toFirestore: (model) => schema.parse(model),  // valida antes de gravar
    }
  }
  ```
  - `normalizeTimestamps` converte `Timestamp → Date` (lógica que hoje vive duplicada).
- [x] **C5.** [src/hooks/useReports.ts](../src/hooks/useReports.ts) refatorado: `mapReport` manual removido; collection `reports` usa `.withConverter(zodConverter(ReportSchema, 'Report'))` e `snapshot.docs.map((doc) => doc.data())` retorna `Report` tipado e validado.
- [x] **C6.** Replicar para outros schemas críticos: `AdAccount`, `Campaign`, `Wallet`, `Transaction`, `ReportTemplate`. Um por commit.
  - [x] **C6.1.** [src/schemas/adAccount.ts](../src/schemas/adAccount.ts). Drift corrigido vs interface anterior: `userId` removido (redundante com path), `currency` (required) e `timezone` (optional) adicionados (eram escritos pelas Functions mas ausentes na interface). Consumers refatorados: [AccountsPage](../src/pages/AccountsPage.tsx), [Dashboard](../src/pages/Dashboard.tsx), [GenerateReportPage](../src/pages/GenerateReportPage.tsx). [mockAccounts.ts](../src/utils/mockAccounts.ts) atualizado para satisfazer schema (incluí `currency: 'BRL'`, dropei `userId`).
  - [x] **C6.2.** [src/schemas/campaign.ts](../src/schemas/campaign.ts) cobre `users/{uid}/campaigns/{platform_externalId}` (única collection viva). Drifts corrigidos vs interface anterior: `status` virou `z.string()` permissivo (TS antiga listava `'active' | 'paused' | 'ended'` mas Functions gravam o valor lowercased da API — Google Ads emite `enabled/removed/...`, Meta emite `archived/with_issues/...`); `objective` (Meta-only, escrito por [metaAdsOAuth.ts](../functions/src/metaAdsOAuth.ts) e ausente da interface) adicionado como `z.string().optional()`; `lastSyncAt` migrado para `zTimestamp()` (Functions usam `serverTimestamp()`, leitura vem como `Timestamp`); `budget/spend/impressions/clicks` mantidos opcionais (recusado `.default(0)` para não mascarar "campo ausente" como "valor zero"). Consumer refatorado: [GenerateReportPage:92-99](../src/pages/GenerateReportPage.tsx) usa `.withConverter(zodConverter(CampaignSchema, 'Campaign'))`. **Top-level `campaigns/{id}` (firestore.rules:49-65 + DATA-MODEL.md + backupScheduler.ts:28) confirmado como código morto** (zero reads/writes no app); cleanup adiado para tarefa pós-Fase D.
  - [x] **C6.3.** [src/schemas/userWallet.ts](../src/schemas/userWallet.ts) cobre `users/{uid}/wallet/current` (doc ID fixo). Drifts corrigidos vs interface anterior: `userId` removido (path encoda ownership; nenhuma das três superfícies de write — [useWallet.ts](../src/hooks/useWallet.ts), [adminWalletManager.ts](../functions/src/adminWalletManager.ts), [suitpayWebhook.ts](../functions/src/suitpayWebhook.ts) — escrevia o campo); `balance` apertado para `z.number().int().nonnegative()` (DATA-MODEL declarava integer mas TS aceitava float); `currency` virou `z.literal('BRL')` (estrito até multimoeda real); `updatedAt` migrado para `zTimestamp()`. Consumer refatorado: [useWallet.ts](../src/hooks/useWallet.ts) — `interface Wallet` local removida, todos os `walletRef` (linhas 44, 104, 140) usam `.withConverter(zodConverter(UserWalletSchema, 'UserWallet'))`. Functions intocadas (Admin SDK não usa converter; validação roda só no boundary cliente).
  - [x] **C6.4.** [src/schemas/transaction.ts](../src/schemas/transaction.ts) cobre `users/{uid}/transactions/{id}`. Drifts corrigidos vs interface anterior: `userId` removido (path encoda owner); `reference?` (genérico, nunca escrito) removido e substituído por `reportId?` (débito de relatório, escrito por [useWallet.debitAmount](../src/hooks/useWallet.ts)) e `paymentId?` (PIX, escrito por [suitpayWebhook.ts](../functions/src/suitpayWebhook.ts) e [suitpayPayment.ts](../functions/src/suitpayPayment.ts)); `amount` apertado para `z.number().int().nonnegative()`; `createdAt` migrado para `zTimestamp()`; `completedAt` adicionado (escrito em SuitPay flows); admin metadata (`adminAction/adminEmail/adminReason/adminIP`) e payer metadata SuitPay (`payerName/payerCpf` — deprecated) adicionados como opcionais. `TransactionTypeSchema` e `TransactionStatusSchema` exportados. Consumer refatorado: [useWallet.ts](../src/hooks/useWallet.ts) — `interface Transaction` local removida, observador de transações (linhas 64-72) usa `.withConverter(zodConverter(TransactionSchema, 'Transaction'))`. **Achado lateral:** os dois `addDoc` cliente em `addCredits`/`debitAmount` estão mortos por [firestore.rules:39-45](../firestore.rules) (Phase 3 bloqueia escrita cliente em `transactions`); marcados com `NOTE` no código e tipados com `Omit<Transaction, 'id'>`. Movê-los para callable function fica como tarefa separada. Bloco defensivo de `createdAt` em [TransactionsPage.tsx:107-153](../src/pages/TransactionsPage.tsx) pode simplificar agora que o converter normaliza para `Date` — TODO de UI cleanup, deixado fora deste commit.
  - [x] **C6.5.** **Re-escopado — não criado schema.** Mapeamento revelou que `reportTemplates/{id}` é código morto: zero readers/writers em todo o repo, e a `interface ReportTemplate` em [src/types/index.ts](../src/types/index.ts) tinha zero consumers. Templates são servidos por [src/components/templates/templateData.ts](../src/components/templates/templateData.ts) (array hardcoded com tipo `TemplateData` totalmente diferente — sem `lookerStudioTemplateId/description/isActive/createdAt`). Mesma classe de drift do top-level `campaigns/{id}` (visto em C6.2). Ações: (1) `interface ReportTemplate` removida; (2) DATA-MODEL marca `reportTemplates/{id}` como _dead code — pending removal_; (3) FK `templateId` em `reports` corrigida para apontar para `templateData.ts` em vez da Firestore inexistente; (4) cleanup da firestore.rules agrupado com `campaigns/{id}` na tarefa pós-Fase D.
- [x] **C7.** Testes Vitest **co-localizados** em `src/schemas/*.test.ts` (não em `__tests__/` — convenção do projeto documentada em [docs/TESTING.md](TESTING.md) prevalece). 6 arquivos cobrem `firestore-converter`, `report`, `adAccount`, `campaign`, `userWallet`, `transaction`. Cada schema testa: parse válido, defaults aplicados (quando aplicável), campo required faltando (assert via `error.issues[].path`), tipo errado, validações específicas (literais, enums, integer/non-negative), normalização de `Timestamp → Date` via `zTimestamp()`. `firestore-converter.test.ts` cobre o `zTimestamp()` standalone, o `fromFirestore` (válido + log estruturado em mismatch), e o `toFirestore` (strip `id` + throw em invalid). 47 novos testes (78 totais, antes eram 31).

**Critério de aceite:** todo `useState<any>` ou cast manual em hooks de Firestore foi substituído por `.withConverter()` + Zod. Documento mal-formado falha em desenvolvimento com erro claro.

---

### Fase D — Monorepo `packages/shared` (meio dia)

Quando os schemas estabilizarem na web, mover para package compartilhado e consumir em `functions/`.

- [x] **D1.** Criada [packages/shared/](../packages/shared/) com `package.json` (`@adsmart/shared`, `type: module`, exports apontando para `./src/index.ts` direto — sem build step), `tsconfig.json` standalone (não extends; web e functions têm targets diferentes — ESNext bundler vs CJS es2017), e `src/index.ts` reexportando schemas + `zTimestamp`.
- [x] **D2.** Workspaces na raiz expandidos para `[".", "functions", "packages/*"]`. Schemas movidos via `git mv` para [packages/shared/src/schemas/](../packages/shared/src/schemas/) (preserva history). Dependência `@adsmart/shared: workspace:*` adicionada ao [package.json](../package.json) da web. Bun isolated linker resolveu via symlink em `node_modules/@adsmart/shared`. **Decisão arquitetural:** o `firestore-converter.ts` permaneceu em [src/schemas/](../src/schemas/) (web-only) porque depende do tipo `FirestoreDataConverter` do web SDK; o `zTimestamp()` foi extraído para [packages/shared/src/firestore.ts](../packages/shared/src/firestore.ts) com detecção duck-typed (`{ toDate: () => Date }`) em vez de `instanceof Timestamp`, permitindo que ambos web SDK e Admin SDK funcionem (são classes distintas). `firestore-converter.ts` agora reexporta `zTimestamp` de `@adsmart/shared` para preservar o caller existente.
- [x] **D3.** Schemas existentes em [src/schemas/](../src/schemas/) movidos para [packages/shared/src/schemas/](../packages/shared/src/schemas/) junto com seus `*.test.ts`. Os testes precisaram do helper [test-helpers.ts](../packages/shared/src/schemas/test-helpers.ts) (`fakeTimestamp` duck-typed) já que o package shared não deve depender de `firebase/firestore`. [vitest.config.ts](../packages/shared/vitest.config.ts) local com `environment: 'node'` (sem happy-dom).
- [x] **D4.** Imports em [src/](../src) reescritos de `@/schemas/{report,adAccount,campaign,userWallet,transaction}` → `@adsmart/shared` em 6 arquivos: [types/index.ts](../src/types/index.ts), [hooks/useReports.ts](../src/hooks/useReports.ts), [hooks/useWallet.ts](../src/hooks/useWallet.ts), [pages/AccountsPage.tsx](../src/pages/AccountsPage.tsx), [pages/Dashboard.tsx](../src/pages/Dashboard.tsx), [pages/GenerateReportPage.tsx](../src/pages/GenerateReportPage.tsx).
- [x] **D5.** [functions/package.json](../functions/package.json) ganhou deps `@adsmart/shared: workspace:*` e `zod: ^4.3.6`; symlink resolveu em `functions/node_modules/@adsmart/shared`. CJS↔ESM interop passou no typecheck — Functions consegue importar Zod schemas mesmo com `module: "commonjs"`. **Não há write de `reports` no Functions** (atualmente Reports são criados pelo cliente via `addDoc` em [GenerateReportPage](../src/pages/GenerateReportPage.tsx); pipeline server-side de geração não foi construído ainda). Os 5 write sites com schema disponível foram hardenados com `Schema.omit({...}).parse(...)` no boundary: [adminWalletManager.ts:265-285](../functions/src/adminWalletManager.ts) (Transaction + UserWallet), [googleAdsOAuth.ts:208-227](../functions/src/googleAdsOAuth.ts) (Campaign), [metaAdsOAuth.ts:199-220](../functions/src/metaAdsOAuth.ts) (Campaign), [googleAdsOAuthV2.ts:372-389](../functions/src/googleAdsOAuthV2.ts) (AdAccount), [metaAdsOAuthV2.ts:347-368](../functions/src/metaAdsOAuthV2.ts) (AdAccount). `omit` necessário porque `serverTimestamp()` é um sentinel `FieldValue` (não-validável pelo schema) — fields temporais são omitidos do parse e adicionados de volta no `set` final. `interface Transaction` local em adminWalletManager removida (ficou desused). **SuitPay (suitpayWebhook.ts, suitpayPayment.ts) intencionalmente NÃO hardenado** — memory `suitpay_deprecated` + Asaas migration no roadmap; investir em validação ali é trabalho que vai ser jogado fora.
- [x] **D6.** [turbo.json](../turbo.json) atualizado: `build` agora depende de `^typecheck` (não só `^build`), `typecheck` ganhou `dependsOn: ['^typecheck']`, `test` ganhou `dependsOn: ['^typecheck']`. Resultado: ao mudar um schema em `@adsmart/shared`, Turbo invalida o cache de typecheck/test em web e functions. **Não foi adicionada dependência cruzada de `^build`** porque `@adsmart/shared` não tem build step (exporta TS source direto via `exports`); adicionar criaria dependência circular vazia. Verificado com `bunx turbo run typecheck` (3 packages, 3 successful) e `bunx turbo run test` (web 38/38, shared 40/40, functions falha pré-existente por emulator off — não introduzida por D6).

**Critério de aceite:** `grep "interface Report\b" src/ functions/src/ packages/shared/src/` retorna apenas o reexport. Mudar um campo no schema causa type error em ambos os lados.

---

### Fase E — Tooling de prevenção contínua (1–2h)

Garantir que o drift não volte.

- [x] **E1.** Auditoria de drift em `docs/`: `DATA-MODEL.md` tinha 5 referências stale a `src/schemas/...` (paths antigos pré-Fase D) — todas reescritas para `packages/shared/src/schemas/...`. `DOMAIN.md` já alinhado em commit `5699aec`. Decisão: markdown segue manual com link explícito ao schema (.ts) — caminho gerado (Zod→JSON Schema→Markdown) adicionaria infra desproporcional para 5 docs, fica como evolução opcional.
- [x] **E2.** [lefthook.yml](../lefthook.yml) ganhou step `typecheck-shared` (`root: packages/shared/`, `bun run typecheck`) executando em paralelo com `typecheck-web` e `typecheck-functions` no pre-push. Schemas válidos antes de push é barato (~1s).
- [x] **E3.** ADR-009 adicionado em [docs/Decisions.md](Decisions.md): "Zod 4 + FirestoreDataConverter as the data contract". Cobre contexto (sintomas de drift acumulados), decisão (Zod canônico + `@adsmart/shared` + validação no boundary), 5 consequências práticas para autores de código (incluindo o pattern `omit().parse()` para `serverTimestamp()`), alternativas consideradas (TS interfaces, io-ts, Valibot, codegen) e trade-offs (12 KB gz, CJS↔ESM interop em Functions, três localizações por intent).
- [x] **E4.** [CLAUDE.md](../CLAUDE.md) ganhou seção "Editing Firestore document shapes": instrui editar `packages/shared/src/schemas/` primeiro, lista os 4 follow-up steps (Vitest case → typecheck via Turbo → DATA-MODEL → CHANGES), e linka para ADR-009. Stack quick reference atualizada com "Zod 4 (`@adsmart/shared`)".

**Critério de aceite:** novo contributor consegue, sem perguntar, identificar onde adicionar/modificar um campo de domínio.

---

## Cronograma sugerido

| Fase | Esforço | Bloqueia próxima? |
|---|---|---|
| A — Quick wins | 1–2h | Não (paralelo com B) |
| B — Migração `meta_ads` | 1h | Sim para C5 final |
| C — Zod schemas em `src/` | 2–3h | Sim para D |
| D — `packages/shared` | meio dia | Sim para E2 |
| E — Tooling | 1–2h | — |

**Total:** ~1,5 dia útil. Pode ser quebrado em PRs pequenos: A em um, B em outro, C em PRs por schema, D em um, E em um.

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Migração B corrompe docs em prod | Dry-run em projeto `dev` primeiro. Script idempotente. Backup `gcloud firestore export` antes. |
| Zod parse falha em produção e quebra UX | `safeParse()` com fallback gracioso na primeira semana; após estabilidade trocar por `parse()`. |
| Refactor de hooks acumula em PR gigante | Um schema por commit; cada PR independente. |
| `packages/shared` complica imports e CI | Turbo já está configurado (Phase 5). Validar com PR de teste antes de mover schemas reais. |

## Decisões em aberto

- **Zod 4 vs Zod 3:** Zod 4 confirmado pelo Context7 como estável e recomendado. Sem motivo para 3.
- **`zod` vs `zod/mini`:** começar com `zod` (full); avaliar `zod/mini` se bundle ficar pesado (improvável — bundle web atual já é 1.1MB, Zod adiciona ~12KB gz).
- **Validação em escrita (`toFirestore`) — strict ou permissive?** Strict (parse). Falhar cedo é melhor que gravar lixo e descobrir depois.
- **Quem possui o markdown `docs/DATA-MODEL.md` após D?** Decidir entre (a) gerado automaticamente por script a partir dos schemas, ou (b) manual com link explícito ao arquivo de schema. Recomendo (b) por simplicidade.
