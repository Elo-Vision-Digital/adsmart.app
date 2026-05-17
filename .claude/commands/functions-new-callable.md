---
description: Scaffold Cloud Function v2 callable matching AdSmart's real patterns
argument-hint: [optional function name]
model: sonnet
---

Você está criando uma nova Cloud Function v2 callable seguindo o padrão real do AdSmart (verificado contra `reserveUserDocument.ts`, `getDashboardMetrics.ts`).

## Passos

### 1. Coleta (uma pergunta por vez)

1. **Nome da function** (camelCase, ex: `myCallable`).
2. **Tipo**:
   - `read-only` (consulta sem write) — exemplo: getDashboardMetrics
   - `write user-triggered` — exemplo: reserveUserDocument
   - `admin-only` — exemplo: addUserCredits
   - `blocking trigger` — `beforeUserCreated` ou `beforeUserSignedIn`
3. **Input shape** (campos + tipos) — vamos criar um Zod schema em `@adsmart/shared`.
4. **Output shape** — também via Zod.
5. **Secrets externos**? (ex: API key de OAuth provider). Cite `defineSecret` em `config/index.ts` se sim.
6. **Sensibilidade**: precisa rate limit? security log? (use o checklist condicional abaixo)

### 2. Adicione o schema em @adsmart/shared

Crie/edite `packages/shared/src/schemas/<name>.ts`:

```ts
import { z } from 'zod'

export const MyCallableInputSchema = z.object({
  // campos validados
})

export type MyCallableInput = z.infer<typeof MyCallableInputSchema>

export const MyCallableOutputSchema = z.object({
  // shape do retorno
})

export type MyCallableOutput = z.infer<typeof MyCallableOutputSchema>
```

Re-export em `packages/shared/src/index.ts`. Adicione test co-located.

### 3. Crie o arquivo da function

`functions/src/<name>.ts`:

```ts
import * as admin from 'firebase-admin'
import { type CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https'
import {
  MyCallableInputSchema,
  type MyCallableOutput,
} from '@adsmart/shared'
// ⬇ se usa secret externo:
// import { mySecret } from './config'
// ⬇ se sensível/write:
// import { checkRateLimit } from './rateLimiter'
// import { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger'

if (!admin.apps.length) {
  admin.initializeApp()
}

// ⬇ admin-only? use o helper canônico
// const ADMIN_EMAILS = ['agency.elovisiondigital@gmail.com', 'admin@adsmart.app']
// function assertAdmin(auth: CallableRequest['auth']) {
//   if (!auth) throw new HttpsError('unauthenticated', 'Usuário não autenticado')
//   const email = typeof auth.token.email === 'string' ? auth.token.email : ''
//   const isAdmin = auth.token.admin === true || ADMIN_EMAILS.includes(email)
//   if (!isAdmin) throw new HttpsError('permission-denied', 'Acesso restrito a administradores')
// }

export const myCallable = onCall<unknown, Promise<MyCallableOutput>>(
  // Options bloco — omitir totalmente se não há necessidade especial.
  // Use:
  //   { memory: '512MiB' }    se a function processa volume
  //   { secrets: [mySecret] } se importa secret via defineSecret
  // NÃO setar `region` — projeto usa default us-central1.
  // NÃO setar `enforceAppCheck` — App Check ainda não inicializado no client (R10).
  async (request) => {
    // 1. Auth guard (sempre)
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuário não autenticado')
    }
    const uid = request.auth.uid

    // ⬇ admin-only? chame o helper:
    // assertAdmin(request.auth)

    // 2. Input validation via Zod (sempre)
    const parsed = MyCallableInputSchema.safeParse(request.data)
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const input = parsed.data

    // 3. Rate limit (CONDICIONAL — apenas para writes user-triggered ou consumo custoso)
    // await checkRateLimit(uid, 'myCallable')

    // 4. Lógica
    const db = admin.firestore()

    // Para writes atômicos multi-doc → use runTransaction (ver reserveUserDocument):
    // await db.runTransaction(async (tx) => { ... tx.get/tx.set/tx.update ... })

    // Para conflitos: throw new HttpsError('already-exists', '...')
    // Para regra de negócio: throw new HttpsError('failed-precondition', '...')

    // 5. Security log (CONDICIONAL — apenas eventos sensíveis: auth, payments, admin actions)
    // await securityLogger.logEvent(
    //   SecurityEventType.X,
    //   uid,
    //   { /* details */ },
    //   SecuritySeverity.INFO,
    // )

    // 6. Return tipado
    const out: MyCallableOutput = { /* ... */ }
    return out
  },
)
```

### 4. Export em `functions/src/index.ts`

Adicione a linha de export:

```ts
export { myCallable } from './myCallable'
```

### 5. Teste

Crie `functions/test/<name>.test.ts`. Padrão:

```ts
import { describe, it, expect } from 'vitest'
// importar o setup test helper apropriado
```

(Veja `functions/test/getDashboardMetrics.test.ts` para o pattern atual.)

### 6. Verificação final + checklist

- [ ] Sem `process.env.X_SECRET` no arquivo (será bloqueado pelo hook).
- [ ] Todos `throw` são `HttpsError` com code apropriado.
- [ ] `createdAt`/`updatedAt` via `admin.firestore.Timestamp.now()`, nunca `Date.now()`.
- [ ] Input validation via Zod do `@adsmart/shared` (não inline).
- [ ] Rate limit + security log presentes apenas se a function for sensível/write.
- [ ] Sem `region` na onCall options.
- [ ] Sem `enforceAppCheck` (a menos que time decida adotar App Check no futuro).

### 7. Sugira o reviewer

Após criar tudo, peça ao usuário para invocar o `functions-security-reviewer` agent para validar end-to-end.

### 8. Build + deploy

```bash
cd functions && bun run build
bash scripts/firebase/safe-deploy.sh dev functions
```

## Referências

- `functions/src/reserveUserDocument.ts` — write atômico canônico
- `functions/src/getDashboardMetrics.ts` — admin read-only com Zod
- `functions/src/bootstrapUser.ts` — blocking trigger idempotente
- `functions/src/config/index.ts` — defineSecret declarations
- `AGENTS.md`, `CLAUDE.md`
- App Check status: NÃO adotado ainda — ver `docs/SECURITY.md` quando o time decidir
