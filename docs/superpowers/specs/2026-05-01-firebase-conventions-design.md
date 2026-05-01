# Firebase Conventions Pack — AdSmart

**Status:** Approved (design phase)
**Date:** 2026-05-01
**Branch:** `develop`
**Owner:** Eduardo Rodrigues
**Scope:** B (Recomendado) — `.claude/commands` + `.claude/agents` + `.claude/settings.json` hooks + `.cursor/rules/*.mdc` + 2 helper scripts em `scripts/firebase/`

---

## 1. Goal

Mover o máximo possível das convenções Firebase já documentadas em [AGENTS.md](../../../AGENTS.md), [CLAUDE.md](../../../CLAUDE.md) e ADRs (010, 012) de **documentação passiva** → **tooling ativo**. Cada convenção crítica passa a ter um enforcement mechanism (hook que bloqueia, agent que revisa, ou slash command que scaffolda o caminho correto). Cursor recebe regras espelhadas em MDC para que ambas IDEs reforcem o mesmo padrão.

Cada padrão prescrito abaixo foi cross-checked contra a doc oficial (Firebase Functions v2 SDK + Firestore Security Rules + index docs) via Context7 + Firebase developerknowledge MCP em 2026-05-01.

## 2. Non-goals

- **Não** alterar `firestore.rules` em si — Phase 3 baseline já está correto.
- **Não** mudar `lefthook.yml` — fica para PR separado de CI/tooling.
- **Não** reescrever AGENTS.md/CLAUDE.md — esses estão bons; o pack apenas cria automação que reforça o que eles dizem.
- **Não** criar comandos para SuitPay (deprecated em favor de Asaas — ver `suitpay_deprecated.md` memory).
- **Não** adicionar dependências novas (nenhum novo pacote npm/bun precisa entrar).

## 3. Requirements (locked decisions)

| # | Decisão | Origem |
|---|---|---|
| R1 | Escopo B: Claude Code commands + agents + hooks **e** Cursor `.cursor/rules/*.mdc` espelhados | Confirmação do usuário |
| R2 | SuitPay fica **completamente fora** do pack — Asaas é o único gateway prescrito | Reforço do usuário |
| R3 | 4 slash commands: `firestore-new-query`, `functions-new-callable`, `firestore-rules-test`, `firebase-deploy`. **`/schema-update` cortado** — CLAUDE.md já documenta o fluxo + a Cursor rule `firestore-schemas.mdc` + o PostToolUse hook `schema-edited-reminder` cobrem o caso sem indirection nova. | Self-review §10 |
| R4 | 6 hooks: 3 PreToolUse (block) + 2 PostToolUse (warn) + 1 UserPromptSubmit (inject) | Design aprovado §4 |
| R5 | 3 agents: `firestore-rules-reviewer`, `functions-security-reviewer`, `firestore-query-reviewer` | Design aprovado §5 |
| R6 | 7 Cursor rules em formato MDC, com globs alinhados aos hooks/agents | Design aprovado §6 |
| R7 | Scripts em `scripts/firebase/`: 2 principais (`test-rules.sh`, `safe-deploy.sh`) + 3 hook helpers (`check-no-process-env-secret.sh`, `check-no-client-wallet-write.sh`, `check-rules-tested.sh`) + 1 snippet texto (`context-snippet.txt`) | Necessário pelos commands e hooks |
| R8 | Hook `secrets-no-process-env` usa regex **estreito**: apenas suffixo `_SECRET` (não `_KEY`/`_TOKEN`). Razão: `FIREBASE_API_KEY`, `RECAPTCHA_SITE_KEY`, `GTM_TOKEN` são valores **públicos** legítimos; `_SECRET` é universalmente sensível. | Self-review §10 |
| R9 | Documentar o pack em uma nova seção `## Firebase Conventions Pack` no fim do CLAUDE.md (apêndice, não reescrita) | Implícito — descoberta para futuros agentes |
| R10 | **App Check NÃO é prescrito como default** em `/functions-new-callable` ou no `functions-security-reviewer` agent. Razão: AdSmart ainda não inicializa App Check no client (`initializeAppCheck` ausente). Doc Firebase recomenda fase de "instalar SDK + monitorar métricas" antes de enforcement. O agent **flagga** como advisory para funções de alto risco de abuso, com pointer para [docs/SECURITY.md](../../SECURITY.md). | Self-review §10 + research Context7 (Firebase App Check enforcement docs) |
| R11 | **Region default = `us-central1`** (Firebase default) — o template `/functions-new-callable` **omite** `region` da `onCall` options. Razão: real config em [functions/src/config/index.ts:33](../../../functions/src/config/index.ts#L33) usa `us-central1`; nenhuma callable atual sobrescreve region. Se alguma function precisar de outra region (latência), usa `setGlobalOptions` no entrypoint, não opção por-function. | Self-review §10 + research Context7 (firebase-functions setGlobalOptions docs) |
| R12 | Hook `wallet-no-client-write` cobre **ambas** as formas que o Firestore JS v10 modular SDK aceita: (a) string-path `setDoc(doc(db, '...wallet/current...'))` e (b) modular `setDoc(doc(db, 'users', uid, 'wallet', 'current'), ...)`. Regex precisa duas alternativas. | Self-review §10 |
| R13 | Rate limit (`checkRateLimit`) e `securityLogger.logEvent` são **condicionais**, não universais. AGENTS.md prescreve para "funções sensíveis" — em getDashboardMetrics (read-only admin) e bootstrapUser (blocking trigger) eles **não** são chamados, e isso é correto. Reviewer agent precisa diferenciar. | Self-review do código real |

## 4. Architecture

### 4.1 Layout final

```
.claude/
├── settings.json             # MOD: adicionar bloco "hooks"
├── commands/                 # NOVO (4 commands)
│   ├── firestore-new-query.md
│   ├── functions-new-callable.md
│   ├── firestore-rules-test.md
│   └── firebase-deploy.md
└── agents/                   # NOVO
    ├── firestore-rules-reviewer.md
    ├── functions-security-reviewer.md
    └── firestore-query-reviewer.md

.cursor/
├── settings.json             # NÃO MUDA
└── rules/                    # NOVO
    ├── firebase-secrets.mdc
    ├── firestore-schemas.mdc
    ├── firestore-rules.mdc
    ├── firestore-indexes.mdc
    ├── functions-callable.mdc
    ├── wallet-immutability.mdc
    └── payments-asaas.mdc

scripts/firebase/             # NOVO
├── test-rules.sh             # firebase emulators:exec --only firestore "vitest run firestore-rules"
└── safe-deploy.sh            # wrapper sobre firebase deploy com confirm gate de target

CLAUDE.md                     # MOD: adicionar seção "Firebase Conventions Pack" no final
```

### 4.2 Princípios de enforcement

- **Hooks bloqueantes** existem só para erros que **firestore.rules ou Firebase já rejeitam em runtime** — o hook só antecipa o erro pra dev-time. Ex: client `setDoc(wallet/current)` falha em prod (rules bloqueiam); o hook bloqueia já no Edit, antes de salvar o arquivo.
- **Hooks advisory** (PostToolUse) **não bloqueiam** — só lembram dos passos seguintes. Devem ser leves para evitar fadiga de notificação.
- **Slash commands** são **opcionais** — usuário pode sempre fazer manual. Eles existem para o caso comum, não para forçar.
- **Agents** rodam sob demanda do usuário (`Use the X agent`) ou são sugeridos pelos hooks.
- **Cursor rules** usam `applyType: "auto"` com globs específicos para que o Cursor injete o contexto somente quando relevante (não polui prompts não relacionados).

## 5. Slash commands

Cada arquivo em `.claude/commands/` segue o formato Markdown frontmatter padrão Claude Code:

```markdown
---
description: <one-line, ≤80 chars>
argument-hint: <opcional, hint do argument>
model: sonnet
---

<corpo do prompt em PT-BR, instruções para o agente>
```

### 5.1 `/firestore-new-query`

**Descrição:** Adiciona query Firestore + composite index, validado pela doc.

**Fluxo prescrito (no corpo do prompt):**
1. Pergunta a coleção e os filtros (where + orderBy).
2. Valida se precisa de composite index: `1+ where` + `orderBy`, OU `2+ range filters` em campos diferentes.
3. Se precisa: abre `firestore.indexes.json`, adiciona entry com **equalities-first → range/inequality por seletividade decrescente** (validado pela doc Firebase de index optimization).
4. Decide query scope (`COLLECTION` vs `COLLECTION_GROUP`).
5. Roda `firebase deploy --only firestore:indexes --project <target>` em ambos targets (dev + prod).
6. Lembra: index build é async (1–3 min); query fica vermelha até `Enabled`.
7. Cria/atualiza teste co-located.
8. Adiciona entry datada em `docs/CHANGES.md`.

### 5.2 `/functions-new-callable`

**Descrição:** Scaffolda Cloud Function v2 callable seguindo o padrão real do projeto (verificado contra [reserveUserDocument.ts](../../../functions/src/reserveUserDocument.ts) e [getDashboardMetrics.ts](../../../functions/src/getDashboardMetrics.ts)).

**Template prescrito (no corpo do prompt):**

```ts
import * as admin from 'firebase-admin'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { /* MyInputSchema, type MyOutput */ } from '@adsmart/shared'
// import { mySecret } from './config'  // se a function usa secret externo
// import { checkRateLimit } from './rateLimiter'  // se sensível/write
// import { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger'  // se sensível

if (!admin.apps.length) {
  admin.initializeApp()
}

export const myCallable = onCall<MyInput, Promise<MyOutput>>(
  // Options bloco (omitir totalmente se não há necessidade especial):
  //   { memory: '512MiB' }    se a function processa volume
  //   { secrets: [mySecret] } se importa secret via defineSecret
  // NÃO setar `region` aqui — projeto usa default us-central1 (R11).
  // NÃO setar `enforceAppCheck` aqui — App Check ainda não inicializado no client (R10).
  async (request) => {
    // 1. Auth guard (sempre)
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuário não autenticado')
    }
    const uid = request.auth.uid

    // 2. Input validation via Zod do @adsmart/shared (sempre)
    const parsed = MyInputSchema.safeParse(request.data)
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    // 3. Rate limit — APENAS se sensível/write (condicional R13)
    // await checkRateLimit(uid, 'myAction')

    // 4. Lógica. Para writes atômicos, use runTransaction (ver reserveUserDocument).
    // Para conflitos: throw new HttpsError('already-exists', ...)
    // Para regras de negócio: throw new HttpsError('failed-precondition', ...)

    // 5. Security log — APENAS se sensível (condicional R13)
    // await securityLogger.logEvent(SecurityEventType.X, uid, { ... }, SecuritySeverity.INFO)

    // 6. Return tipado
    return { /* ... */ }
  }
)
```

**Regras embebidas no prompt:**
- Secret externo? Importar via `defineSecret` em `functions/src/config/index.ts` — **nunca** `process.env.XXX_SECRET` (R8).
- `createdAt`/`updatedAt`: usar `admin.firestore.Timestamp.now()` ou `FieldValue.serverTimestamp()`, nunca `Date.now()`.
- HttpsError codes: `unauthenticated` (sem auth) · `invalid-argument` (input ruim) · `failed-precondition` (regra de negócio) · `already-exists` (conflito) · `permission-denied` (não autorizado, ex: não-admin).
- Atomic write multi-doc → `db.runTransaction(async (tx) => { ... })`.
- Export em `functions/src/index.ts`.
- Teste em `functions/test/<name>.test.ts` com `firebase-functions-test` ou emulator.
- Para functions admin-only: helper `assertAdmin(request.auth)` (ver getDashboardMetrics linha 14) — checa custom claim `admin === true` OU email allowlist.
- **Advisory App Check**: se a function tem alto risco de abuso (write público, OAuth callback, payment) e o client já passar a inicializar App Check, considerar `enforceAppCheck: true` no futuro (R10). Linkar [docs/SECURITY.md](../../SECURITY.md) na resposta.

### 5.3 `/firestore-rules-test`

**Descrição:** Roda emulator + rules unit tests antes de deploy.

**Fluxo:**
1. Verifica que `@firebase/rules-unit-testing` está instalado em `functions/package.json` (instala se não estiver).
2. Roda `bash scripts/firebase/test-rules.sh` (`firebase emulators:exec --only firestore "vitest run firestore-rules"`).
3. Se houver tests/firestore-rules*.test.ts, roda; senão, sugere criar.
4. Reporta resultado e bloqueia se falhar.

### 5.4 `/firebase-deploy`

**Descrição:** Deploy seguro multi-target com confirm gate.

**Fluxo:**
1. Pergunta target: `adsmart-web-dev` ou `adsmart-web-prod`.
2. Pergunta o que deployar: `rules`, `indexes`, `functions`, `hosting`, ou múltiplos.
3. Se inclui `rules`: pré-condição executa `/firestore-rules-test` automaticamente; aborta se falhar.
4. Se inclui `indexes`: mostra o diff do `firestore.indexes.json` vs último deployed.
5. Se target = prod: pede confirmação explícita "type 'prod' to confirm".
6. Roda `bunx firebase deploy --only <X> --project <target>` via `scripts/firebase/safe-deploy.sh`.
7. Para indexes: aguarda status `Enabled` antes de retornar (poll `firestore_list_indexes` MCP a cada 30s, máx 5 min).

## 6. Hooks (`.claude/settings.json` → `hooks`)

Schema da config segue [Claude Code Hooks docs](https://docs.claude.com/en/docs/claude-code/hooks). Cada hook tem `matcher` (regex), `command` (shell que retorna 0=permitir, ≠0=bloquear) e `description` para o usuário.

### 6.1 PreToolUse (bloqueiam)

#### `secrets-no-process-env`

```jsonc
{
  "matcher": { "tool": "Edit|Write", "path_glob": "functions/src/**/*.ts" },
  "command": "scripts/firebase/check-no-process-env-secret.sh",
  "description": "Bloqueia process.env.XXX_SECRET em functions/. Use defineSecret."
}
```

**Regex no script (estreito, R8):** `process\.env\.[A-Z_]+_SECRET\b`. **Apenas o suffixo `_SECRET`** — não `_KEY` ou `_TOKEN`, que podem ser valores públicos legítimos (`FIREBASE_API_KEY`, `RECAPTCHA_SITE_KEY`, `GTM_TOKEN`). Mensagem de bloqueio aponta para [functions/src/config/index.ts](../../../functions/src/config/index.ts) (onde `defineSecret` é declarado) e [docs/SECURITY.md](../../SECURITY.md).

**Allowlist explícita** no script (caso novo padrão de nome surja e gere falso-positivo): vazia por enquanto. Se aparecer, adicionar como `grep -v` no script.

#### `wallet-no-client-write`

```jsonc
{
  "matcher": { "tool": "Edit|Write", "path_glob": "src/**/*.{ts,tsx}" },
  "command": "scripts/firebase/check-no-client-wallet-write.sh",
  "description": "Bloqueia setDoc client em wallet/current ou transactions/. firestore.rules rejeita em runtime."
}
```

**Regex no script (dual, R12)** — verifica AMBAS as formas que o Firestore JS v10 modular SDK aceita:

1. **String-path:** `setDoc\([^)]*['\"][^'\"]*\b(wallet/current|transactions/)`
2. **Modular SDK:** `setDoc\(\s*doc\([^)]*['\"]wallet['\"]\s*,\s*['\"]current['\"]` **OU** `setDoc\(\s*doc\([^)]*['\"]transactions['\"]\s*,`

Bloqueio se qualquer um match. Mensagem: aponta para [ADR-010](../../Decisions.md#adr-010-per-user-state-bootstrap-moved-to-server-side-auth-blocking-trigger) (wallet) e [firestore.rules:51-58](../../../firestore.rules#L51) (rules que rejeitam em runtime). Sugere usar `updateDoc` em `users/{uid}` para campos permitidos (name/phone) ou Cloud Function para wallet/transactions.

#### `rules-no-direct-deploy`

```jsonc
{
  "matcher": { "tool": "Bash", "command_regex": "firebase\\s+deploy.*firestore:rules" },
  "command": "scripts/firebase/check-rules-tested.sh",
  "description": "Exige teste de rules antes de deploy. Use /firestore-rules-test."
}
```

Verifica timestamp de `.firebase/rules-last-tested.txt` (criado por `/firestore-rules-test`); se >10min ou ausente, bloqueia.

### 6.2 PostToolUse (avisam)

#### `rules-edited-reminder`

```jsonc
{
  "matcher": { "tool": "Edit|Write", "path_glob": "firestore.rules" },
  "command": "echo 'firestore.rules editada. Próximos passos: /firestore-rules-test → firestore-rules-reviewer agent → /firebase-deploy.'",
  "description": "Avisa próximos passos após editar rules."
}
```

#### `schema-edited-reminder`

```jsonc
{
  "matcher": { "tool": "Edit|Write", "path_glob": "packages/shared/src/schemas/**" },
  "command": "echo 'Schema editado. CLAUDE.md exige: teste co-located + DATA-MODEL.md + entry em CHANGES.md. ADR-009.'",
  "description": "Lembra dos 4 passos do fluxo Zod-first."
}
```

### 6.3 UserPromptSubmit (injeta contexto)

#### `firebase-context-injector`

```jsonc
{
  "matcher": { "prompt_regex": "(?i)(deploy|firestore\\.rules|cloud function|callable|firebase-admin|process\\.env)" },
  "command": "cat scripts/firebase/context-snippet.txt",
  "description": "Injeta contexto Firebase no prompt quando palavras-chave são detectadas."
}
```

`context-snippet.txt`: lembrete inline de Functions v2, Admin SDK, custom claims, defineSecret, e ponteiro para skill `firebase-operations`.

## 7. Agents (`.claude/agents/`)

Cada agent é um arquivo Markdown com frontmatter `name`, `description`, `tools`, `model`. O usuário invoca via `Use the X agent` ou Claude Code sugere automaticamente quando o `description` casa.

### 7.1 `firestore-rules-reviewer`

**Tools:** Read, Grep, Glob, Bash.
**Description (para auto-trigger):** "Use this agent when reviewing changes to firestore.rules or before deploying rules. Validates against Phase 3 baseline + Firebase best practices."

**Checklist embebido:**
- Deny-by-default: toda coleção declarada tem `allow read/write: if false` ou rule explícita; nenhum `match /{document=**}` aberto.
- Immutability via helper `unchanged()` ou `documentLocked()` para campos críticos (email, createdAt, userId, documentNumber, documentType).
- `request.resource.data.userId == request.auth.uid` em creates onde aplicável.
- Phase 3 invariants: wallet/transactions deny client write; rateLimits/securityLogs/backupMetadata deny client write.
- Ausência de `allow read, write` aberto em qualquer coleção.
- Sintaxe `keys().hasAll(...)` em creates obrigatórios.
- Roda `bash scripts/firebase/test-rules.sh` se solicitado.

### 7.2 `functions-security-reviewer`

**Tools:** Read, Grep, Glob, Bash.
**Description:** "Use this agent after substantive changes to a Cloud Function (new function, security guard changes, secret usage). Validates against AdSmart's actual patterns in [reserveUserDocument.ts](../../../functions/src/reserveUserDocument.ts), [getDashboardMetrics.ts](../../../functions/src/getDashboardMetrics.ts), [bootstrapUser.ts](../../../functions/src/bootstrapUser.ts)."

**Checklist embebido (alinhado ao código real):**

- **Secrets (mandatório):** zero ocorrências de `process.env.[A-Z_]+_SECRET` (R8). Secrets via `defineSecret` em [config/index.ts](../../../functions/src/config/index.ts), passados em `secrets: [...]` quando a function os usa. `process.env` não-secret (project ID, region, OAuth client IDs, redirect URIs) é **OK** — config/index.ts já usa esse pattern legitimamente.

- **HttpsError codes corretos (mandatório):**
  - `unauthenticated`: ausência de `request.auth`.
  - `invalid-argument`: input validation falha (preferir Zod safeParse com mensagem do issue).
  - `failed-precondition`: violação de regra de negócio (ex: doc imutável já preenchido).
  - `already-exists`: conflito de uniqueness (ex: CPF/CNPJ já reservado).
  - `permission-denied`: usuário autenticado mas não autorizado (ex: não-admin chamando função admin).

- **Rate limiting (condicional, R13):** `await checkRateLimit(uid, '<action>')` é exigido **apenas** em funções que: (a) fazem write user-triggered, OU (b) consomem recursos custosos (ex: chamadas de OAuth, geração de relatório). Read-only admin queries (getDashboardMetrics, getSecurityStats) **não** precisam. Blocking triggers (bootstrapUser) **não** precisam (rate-limited pelo Auth).

- **Security logging (condicional, R13):** `securityLogger.logEvent(...)` em: auth events, payments, admin actions (creditar wallet, mudar role), document reservation, OAuth token storage. Read-only queries **não** precisam.

- **Server timestamps (mandatório):** `createdAt` / `updatedAt` via `admin.firestore.Timestamp.now()` ou `FieldValue.serverTimestamp()`. Nunca `Date.now()` ou `new Date()`.

- **Idempotência em blocking triggers (mandatório):** `beforeUserCreated` deve ser idempotente. Pattern canônico do projeto: `batch.set(ref, data, { merge: true })` (ver [bootstrapUser.ts:35-44](../../../functions/src/bootstrapUser.ts#L35)). Se rodar 2× (retry), não duplica.

- **Region (informativo, R11):** templates novos **omitem** `region` da `onCall` options — projeto usa default `us-central1` ([config/index.ts:33](../../../functions/src/config/index.ts#L33)). Se uma function nova precisa de outra region, é decisão arquitetural — flagar no review.

- **App Check (advisory, R10):** App Check **não** está ativado no projeto hoje (sem `initializeAppCheck` no client). Reviewer **não bloqueia** ausência de `enforceAppCheck`, mas para funções de alto risco de abuso (write público, OAuth callback, payment intent) **sugere** considerar adoção futura — apontando para o roadmap em [docs/SECURITY.md](../../SECURITY.md). Doc Firebase: `docs/app-check/cloud-functions` recomenda fase de monitor antes de enforce.

- **Admin guard:** funções admin-only usam o pattern `assertAdmin(request.auth)` que checa `auth.token.admin === true || ADMIN_EMAILS.includes(email)` (ver [getDashboardMetrics.ts:14](../../../functions/src/getDashboardMetrics.ts#L14)). Custom claim é o caminho preferido; allowlist é fallback documentado em `admin_claim_policy.md`.

- **Zod validation:** input via schemas de `@adsmart/shared` (ver [getDashboardMetrics.ts:5](../../../functions/src/getDashboardMetrics.ts#L5)) — **não** validação inline. ADR-009.

### 7.3 `firestore-query-reviewer`

**Tools:** Read, Grep, Glob, Bash.
**Description:** "Use this agent when adding a new Firestore query with where + orderBy or two range filters. Verifies composite index exists and is optimally ordered."

**Checklist embebido:**
- Para cada query encontrada em `src/**/*.ts*` ou `functions/src/**/*.ts`, identificar coleção + where + orderBy.
- Verificar `firestore.indexes.json` tem entry correspondente.
- Validar field order: equalities primeiro, depois range/inequality por seletividade decrescente (Firebase docs: "the leftmost fields satisfy equality constraints").
- Validar query scope: `COLLECTION` para queries em path específico (`db.collection('users/X/transactions')`), `COLLECTION_GROUP` para `collectionGroup('transactions')`.
- Sugerir index merging onde múltiplos `==` clauses podem reusar indexes (citar Firebase docs §"Use index merging").
- Lembrar deploy em **ambos** targets (`adsmart-web-dev` e `adsmart-web-prod`).

## 8. Cursor rules (`.cursor/rules/*.mdc`)

Formato MDC com frontmatter `description`, `globs`, `alwaysApply`. Cursor injeta automaticamente quando arquivos casam os globs.

| Arquivo | Globs | Conteúdo principal |
|---|---|---|
| `firebase-secrets.mdc` | `functions/**/*.ts` | Sempre `defineSecret`. Nunca `process.env.XXX_SECRET`. Pointer para `functions/src/config/index.ts`. |
| `firestore-schemas.mdc` | `packages/shared/src/schemas/**`, `src/types/**`, `functions/src/**/*.ts` | Zod-first (ADR-009). Schemas em `@adsmart/shared`, types via `z.infer`. Após mudança: test + DATA-MODEL.md + CHANGES.md. |
| `firestore-rules.mdc` | `firestore.rules` | Deny-by-default. Helper `unchanged()`/`documentLocked()`. Phase 3 invariants. Test antes de deploy. |
| `firestore-indexes.mdc` | `firestore.indexes.json`, `src/**/*.ts`, `functions/src/**/*.ts` | Composite index obrigatório para where+orderBy. Equality-first. Selectivity ordering. Deploy em ambos targets. |
| `functions-callable.mdc` | `functions/src/**/*.ts` | Padrão `onCall` v2: auth guard → Zod validate (`@adsmart/shared`) → (condicional) checkRateLimit → lógica/transaction → (condicional) securityLogger → return tipado. HttpsError codes: `unauthenticated`/`invalid-argument`/`failed-precondition`/`already-exists`/`permission-denied`. Server timestamps via `admin.firestore.Timestamp.now()`. **Sem** `enforceAppCheck` no default (R10). **Sem** `region` explícito (R11 — projeto usa default us-central1). |
| `wallet-immutability.mdc` | `src/**/*.{ts,tsx}` | Wallet/transactions write-only via Cloud Functions. Client usa `updateDoc` em users/{uid} apenas para name/phone. ADR-010 + ADR-012. |
| `payments-asaas.mdc` | `**/*` | Asaas é o único gateway prescrito. SuitPay deprecated — não harden, não estender. |

## 9. Scripts (`scripts/firebase/`)

### 9.1 `test-rules.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
bunx firebase emulators:exec --only firestore --project demo-adsmart \
  "cd functions && bunx vitest run firestore-rules"
mkdir -p .firebase
date -u +%s > .firebase/rules-last-tested.txt
```

### 9.2 `safe-deploy.sh`

Wrapper que:
1. Lê `$1` (target: `dev`/`prod`) e `$2..` (only flags: `rules`, `indexes`, `functions`, `hosting`).
2. Se `prod`, pede confirmação stdin "type 'prod' to confirm".
3. Se inclui `rules`, verifica `.firebase/rules-last-tested.txt` é < 10 min.
4. Roda `bunx firebase deploy --only <X> --project adsmart-web-<target>`.
5. Para indexes: poll status até `Enabled` (máx 5 min, sleep 30s).

### 9.3 Helpers de hook (PreToolUse)

`check-no-process-env-secret.sh`, `check-no-client-wallet-write.sh`, `check-rules-tested.sh`: cada um lê stdin (o tool input do hook), faz a verificação, exit 0 ou exit 2 com mensagem stderr.

### 9.4 `context-snippet.txt`

Texto curto (<200 palavras) com lembrete de: Functions v2, Admin SDK, custom claims, defineSecret, ponteiros para skill `firebase-operations` e CLAUDE.md.

## 10. Testing

- **Slash commands:** smoke test manual — invocar cada um e verificar que orquestram o fluxo descrito.
- **Hooks:** smoke test manual — tentar editar `functions/src/foo.ts` com `process.env.STRIPE_SECRET = 'x'` e verificar que o hook bloqueia. Mesmo para `setDoc('wallet/current', ...)` em src/.
- **Agents:** smoke test manual — pedir review de `firestore.rules` ao `firestore-rules-reviewer` e verificar checklist completo.
- **Cursor rules:** validar carregamento abrindo um arquivo casando o glob no Cursor e confirmando que a regra aparece no contexto.

Não há test suite automatizada para o pack — é tooling de governança, não código de produto. Falhas serão detectadas pelo desenvolvedor no uso.

## 11. Documentation updates

- **CLAUDE.md** ganha apêndice no final: seção `## Firebase Conventions Pack` com link para esta spec, lista resumida dos **4 commands**, 3 agents e 6 hooks. ~30 linhas.
- **AGENTS.md** ganha 1 linha em "Read-first map" → quando criar Cloud Function, abrir [.claude/commands/functions-new-callable.md](../../.claude/commands/functions-new-callable.md).
- **`docs/CHANGES.md`**: entry datada 2026-05-01 descrevendo o pack.
- **Memory file `firebase_conventions_pack.md`** novo, apontando para esta spec.

## 12. Open questions / risks

- **Compatibilidade do schema de hooks**: o exato JSON schema de `hooks` em `.claude/settings.json` deve ser validado contra a versão do Claude Code instalada antes da implementação. Mitigação: writing-plans inclui task de validar 1 hook trivial (echo) end-to-end antes de escrever os 6 reais.
- **Cursor MDC schema**: idem — verificar formato MDC suportado pela versão do Cursor instalada. Mitigação: writing-plans inclui task de inspecionar 1 exemplo MDC oficial (cursor docs ou template público) e ajustar antes de escrever os 7.
- **`rules-no-direct-deploy` vs `/firebase-deploy`**: o command roda `safe-deploy.sh` que invoca `firebase deploy`; precisa garantir que o hook não bloqueia o próprio command. Mitigação: `safe-deploy.sh` faz `touch .firebase/rules-last-tested.txt` antes de chamar `firebase deploy` quando vem do `/firestore-rules-test` aprovado, OU exporta env var sentinel que o `check-rules-tested.sh` verifica para skipar.
- **App Check roadmap (ainda não decidido)**: a decisão de R10 é "não prescrever no default", mas não existe ainda um plano formal de adoção em [docs/SECURITY.md](../../SECURITY.md). Risco: se App Check for habilitado no futuro, todas as callables existentes precisam migrar simultaneamente (cliente + servidor). Mitigação: fora de escopo deste pack — abrir issue/ADR separado quando o time decidir adotar.

## 13. Build sequence (high-level — detalhe vai pro plan)

1. Validar schema dos hooks (.claude/settings.json) e do MDC (.cursor/rules/) com 1 exemplo trivial cada.
2. Criar `scripts/firebase/` (test-rules.sh, safe-deploy.sh, 3 check-*.sh, context-snippet.txt).
3. Criar `.claude/agents/` (3 agents).
4. Criar `.claude/commands/` (**4 commands**).
5. Editar `.claude/settings.json` adicionando bloco `hooks` (6 hooks).
6. Criar `.cursor/rules/` (7 MDC files).
7. Apêndice em CLAUDE.md + linha em AGENTS.md + entry em CHANGES.md + memory file novo.
8. Smoke test manual: 1 hook block (forçar `process.env.X_SECRET` em arquivo functions/src/), 1 hook advisory, 1 agent, 1 command, 1 cursor rule.
9. Commit em chunks lógicos (por tipo: scripts → agents → commands → hooks → cursor rules → docs).

---

**Approval gate:** este documento precisa ser aprovado pelo usuário antes de invocar `writing-plans`.
