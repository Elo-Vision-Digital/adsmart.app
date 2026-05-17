---
description: Add Firestore query + composite index following Firebase best practices
argument-hint: [optional collection name]
model: sonnet
---

Você está ajudando o usuário a adicionar uma nova query Firestore ao AdSmart, garantindo que o composite index correspondente exista em `firestore.indexes.json` com a ordem otimizada.

## Passos

### 1. Coleta de inputs (uma pergunta por vez)

Pergunte ao usuário:

1. **Coleção**: nome (ex: `transactions`, `users`, `reports`).
2. **Escopo**: `COLLECTION` (path específico tipo `users/X/transactions`) ou `COLLECTION_GROUP` (cross-parent tipo `db.collectionGroup('transactions')`).
3. **`where(...)` filters**: cada um — campo, operador (`==`, `in`, `<`, `>`, `<=`, `>=`, `array-contains`, `array-contains-any`), tipo do valor.
4. **`orderBy(...)` field e direção** (ASC/DESC).
5. **Onde a query roda**: client (`src/**`) ou server (`functions/src/**`)?

### 2. Decida se composite index é necessário

Index obrigatório quando ANY:
- 1+ `where` + `orderBy` em campo diferente.
- 2+ range/inequality filters em campos diferentes.
- 1+ `where` + `array-contains` em campos diferentes.

Se NÃO precisa de index → vá para o passo 4.
Se precisa → passo 3.

### 3. Adicione o composite index

Leia o `firestore.indexes.json` atual. Construa a entry seguindo as boas práticas (Firebase docs):

1. **Equality fields** (`==`, `in`) PRIMEIRO, ordenadas por seletividade decrescente (mais restritivo primeiro).
2. **Range/inequality fields** depois, também por seletividade decrescente.
3. **`orderBy` field** ao final (ou na posição forçada pela inequality, conforme Firebase docs).
4. Direction (`ASCENDING`/`DESCENDING`) match com a direção do orderBy.

Mostre a entry proposta ao usuário. **Pergunte se confirma**. Em sucesso, escreva no `firestore.indexes.json`.

Exemplo:

```json
{
  "collectionGroup": "transactions",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "type", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### 4. Escreva a query

Padrões canônicos:

**Client (Firestore JS v10 modular SDK):**

```ts
import { collection, collectionGroup, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const q = query(
  collectionGroup(db, 'transactions'),
  where('type', '==', 'credit'),
  where('status', '==', 'completed'),
  orderBy('createdAt', 'desc')
)
const snap = await getDocs(q)
```

**Server (firebase-admin):**

```ts
import * as admin from 'firebase-admin'
const db = admin.firestore()

const snap = await db
  .collectionGroup('transactions')
  .where('type', '==', 'credit')
  .where('status', '==', 'completed')
  .orderBy('createdAt', 'desc')
  .get()
```

Mostre o code ao usuário, peça confirmação.

### 5. Deploy do index (se foi adicionado)

```bash
bash scripts/firebase/safe-deploy.sh dev indexes
bash scripts/firebase/safe-deploy.sh prod indexes
```

Lembrete: index build é async (1-3 min). Query fica vermelha (`FAILED_PRECONDITION`) até `Enabled`. O safe-deploy faz polling automático.

### 6. Test + log

- Adicione um teste Vitest co-located com o arquivo da query.
- Adicione entry datada em `docs/CHANGES.md`:

```markdown
### 2026-MM-DD — feat(firestore): new query <collection> with composite index

Added query <description> in <file>. New composite index in `firestore.indexes.json`
deployed to dev + prod targets.
```

### 7. Sugira invocar o `firestore-query-reviewer` agent

Depois de tudo pronto, peça ao usuário para invocar `firestore-query-reviewer` agent para validar a ordem de seletividade e verificar oportunidades de index merging.

## Referências

- `docs/DEPLOYMENT.md` → "Firestore rules and indexes"
- `CLAUDE.md` → "Adding Firestore queries"
- `firestore.indexes.json` (entries existentes para alinhamento de estilo)
- Firebase docs: query-data/index-overview, multiple-range-fields
