# Auth Flow Hardening — AdSmart

**Status:** Approved (design phase)
**Date:** 2026-05-17
**Branch:** `develop`
**Owner:** Eduardo Rodrigues
**Scope:** Approach A — refactor cirúrgico do fluxo de autenticação Google/Facebook/Email-Password + endurecimento defense-in-depth, sem reescrever a arquitetura existente.

---

## 1. Goal

Revisar e refatorar o fluxo de autenticação completo da aplicação (Google, Facebook, Email/Password, link de provedor, password change, password reset, email verification, account deletion, route guards, admin claim) para que cada componente:

1. Siga as práticas atuais do Firebase JS SDK 10.x e Identity Platform (validadas via Context7 em 2026-05-17 contra `/firebase/firebase-js-sdk`).
2. Tenha um único caminho de execução por operação — nada de duplicação de allowlists, signups paralelos, ou mensagens de erro divergentes entre páginas.
3. Tenha defense-in-depth alinhada com o threat model pós-ADR-013 (sem reCAPTCHA): App Check no client, password policy server-side (Identity Platform), claim refresh forçado, blocking trigger robusto contra OAuth-sem-email.
4. Seja resiliente em browsers com restrições modernas (Safari ITP, COOP/COEP, third-party cookies bloqueados).
5. Tenha cobertura de testes para os fluxos críticos (signup blocking trigger, route guards loading state, password policy, admin gate).

A meta operacional é levar o auth de "funciona por acidente" (vários bugs latentes encobertos por defesas implícitas) para "funciona porque foi pensado" (cada invariante é explícito, testado e documentado).

## 2. Non-goals

- **Não** introduzir MFA TOTP — Identity Platform suporta, mas não há requisito atual; cabe ADR futura quando houver risco real ou compliance pedindo.
- **Não** migrar de `signInWithPopup` para `signInWithRedirect` como caminho default — Approach C considerado e rejeitado abaixo (§7). Popup com COOP ajustado é o caminho mais simples.
- **Não** remover a fallback `ADMIN_EMAILS` neste refactor — fica em ADR-017 quando todos os admins existentes tiverem custom claims provisionadas. Aqui apenas unificamos a allowlist em **um único módulo** compartilhado entre client e Cloud Functions.
- **Não** mexer em SuitPay / Asaas (deprecation independente, ver memory `suitpay_deprecated.md`).
- **Não** tocar nas OAuth flows do Google Ads / Meta Ads (`googleAdsOAuthV2.ts`, `metaAdsOAuthV2.ts`) — fluxos separados, gerenciam access tokens de terceiros, não autenticação do usuário AdSmart. Já cobertos por testes em PR anterior.
- **Não** reescrever AGENTS.md/CLAUDE.md — apenas atualizar as seções específicas afetadas.

## 3. Requirements (locked decisions)

| # | Decisão | Origem |
|---|---|---|
| R1 | Approach A (refactor cirúrgico). Approach B (extrair Auth service) e C (forçar redirect + MFA) ficam como nota no §7. | Self-review do trade-off matrix |
| R2 | `src/firebase/config.ts` migra de `getAuth(app)` para `initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence], popupRedirectResolver: browserPopupRedirectResolver })`. Fallback explícito resolve Safari ITP. | Context7: `/firebase/firebase-js-sdk` — recommended pattern for cross-browser persistence |
| R3 | `firebase.json` muda `Cross-Origin-Opener-Policy` de `same-origin` para `same-origin-allow-popups`. `Cross-Origin-Resource-Policy` permanece `same-origin`. | Context7 (Firebase docs) + MDN COOP: `same-origin` quebra `window.opener.postMessage` que o popup OAuth do Firebase usa para fechar o ciclo |
| R4 | App Check com `ReCaptchaEnterpriseProvider` é adicionado no `firebase/config.ts` atrás de `VITE_APPCHECK_SITE_KEY` env var. Em dev, `FIREBASE_APPCHECK_DEBUG_TOKEN = true` é habilitado automaticamente quando `import.meta.env.DEV`. **Enforcement** no Identity Toolkit começa em **monitor mode** (dev primeiro, prod depois de 7 dias de baseline). | Context7 (Firebase App Check enforcement guidance) — modo monitor é prerequisito para reduzir falso-positivo na população real |
| R5 | `ADMIN_EMAILS` é unificado em `packages/shared/src/auth/admin.ts` exportando: (a) `ADMIN_EMAILS` (readonly array), (b) `isAdminUser(token, email)`. Client (`AuthContext`) e functions (`priceManager`, `adminWalletManager`, `getDashboardMetrics`) importam dessa fonte única. | Self-review — drift garantido com 4 cópias atuais |
| R6 | Password policy unificada em `packages/shared/src/auth/password.ts` exportando zod schema + `validatePassword(password): { valid: boolean; errors: string[] }`. Min 8 chars, upper/lower/number/special. Aplicada em LoginPage (signup), SettingsPage (change), Identity Platform (Firebase Console). Hoje SettingsPage aceita 6 chars — bug. | Code review §1 |
| R7 | `signIn` (alias duplicado de `signInWithEmail`) é deletado do `AuthContext`. `LoginPage.handleSubmit` chama `signUp` do Context (hoje chama `createUserWithEmailAndPassword(auth, ...)` direto, fora do Context — dead code do Context). | Code review §1 |
| R8 | `signInWithFacebook` adiciona `provider.addScope('email')` + `provider.addScope('public_profile')`. Sem isso, `event.data?.email` no blocking trigger pode chegar `undefined` para usuários Facebook, e `bootstrapUser` grava `email: ''` violando `isValidEmail` em `firestore.rules`. Console.log/console.error com PII removidos. | Code review §1 + Context7 (FacebookAuthProvider docs) |
| R9 | `signInWithGoogle` adiciona `provider.setCustomParameters({ prompt: 'select_account' })` para garantir UX consistente (força tela de seleção mesmo com conta única logada). Scope `profile` + `email` é explícito (Google adiciona por default, mas explicitar é boa prática). | Context7 (GoogleAuthProvider docs) |
| R10 | `AuthContext` força refresh do ID token após qualquer signin/signup/link (`await user.getIdToken(true)`) e passa `forceRefresh: true` em `getIdTokenResult` ao calcular `isAdmin`. Necessário para custom claims provisionadas recém — hoje, claims só aparecem após 1h ou sign-out manual. | Context7 (custom claims token TTL) |
| R11 | `bootstrapUser` (blocking trigger) é hardened: se `event.data?.email` falsy, tenta `event.data?.additionalUserInfo` ou primeiro `providerData[0].email`. Se ambos vazios, deixa campo `email` **não escrito** (não vazio) — Phase 3 rules permitem `users/{uid}` sem email; gate de email-verification no SettingsPage exige preencher antes do primeiro save. Idempotência mantida (`merge: true`). Telemetria estruturada. | Code review §9 |
| R12 | `PrivateRoute` e `AdminRoute` recebem fallback explícito durante `loading`: `<AuthLoadingFallback />` (skeleton 200ms, sem flicker). Hoje funcionam só porque `AuthProvider` esconde children — frágil. | Code review §5 |
| R13 | `EmailVerificationBanner` (não-bloqueante) é adicionado ao `MainLayout` para usuários com `hasPasswordProvider && !user.emailVerified`. Botão "reenviar" chama `sendEmailVerification`. Banner some quando verificado (próximo refresh do user). | Self-review — gate suave evita atrito; LGPD/GDPR só exigem opt-in claro, não verificação obrigatória |
| R14 | `ForgotPasswordPage` real em `/forgot-password` (rota referenciada hoje no LoginPage sem destino). Form com email → `sendPasswordResetEmail(auth, email, { url: window.location.origin + '/login' })`. Tradução pt/en/es. Rate-limited via `useRateLimit` (5/15min). | Code review §3 |
| R15 | `deleteUserData` Cloud Function é implementada de verdade: (a) deleta subcollections de `users/{uid}` em batches ≤500, (b) deleta `userDocuments/{normalized}` se existir, (c) `admin.auth().deleteUser(uid)`, (d) loga `USER_DELETION` via `securityLogger`. `DeleteDataPage` ganha confirmação dupla (digitar email para confirmar). Rate-limit 1×/hora. | Code review §7 + risk LGPD/GDPR |
| R16 | Mensagens de erro mapeadas em **uma única tabela** em `src/lib/auth/errorMessages.ts` (i18n via `LanguageContext`), cobrindo: `auth/invalid-credential` (modern), `auth/wrong-password` (legacy fallback), `auth/email-already-in-use`, `auth/weak-password`, `auth/invalid-email`, `auth/user-not-found`, `auth/too-many-requests`, `auth/popup-blocked`, `auth/popup-closed-by-user`, `auth/cancelled-popup-request`, `auth/network-request-failed`, `auth/account-exists-with-different-credential`, `auth/credential-already-in-use`, `auth/requires-recent-login`. Documentada em `docs/ERROR-HANDLING.md`. | Code review §3 + Context7 (auth error code constants) |
| R17 | `error: any` removido de **todos** os handlers de auth. Helper `isAuthError(e): e is FirebaseError` em `src/lib/auth/errors.ts`. Biome lint não permite mais `: any` em arquivos de auth (regra existente `noExplicitAny` já está em warn — confirmar). | Code review §3 + AGENTS.md convention |
| R18 | `useRateLimit` permanece in-memory client-side **com nota** de que é UX guard apenas, não defesa de segurança real. Documentação em `docs/SECURITY.md` clarifica que a defesa real contra credential stuffing é Firebase Auth's own throttling (per-account + IP) + App Check (R4). | Self-review §1 + AGENTS.md updates |
| R19 | Tudo documentado: nova ADR-016 "Auth flow hardening 2026-05" + atualizações em `AGENTS.md`, `CLAUDE.md`, `docs/SECURITY.md`, `docs/QA-CHECKLIST.md`, `docs/ERROR-HANDLING.md`, `docs/CHANGES.md`. | Feedback memory `feedback_always_update_docs.md` — hard rule |
| R20 | Testes mínimos: 3 vitest novos (password schema, isAdminUser, route guards loading) + 2 functions emulator tests (bootstrapUser Facebook-sem-email, deleteUserData cascade). | Self-review §12 |

## 4. Architecture

### 4.1 Layout final

```
packages/shared/src/auth/         # NOVO — fonte única client+functions
├── admin.ts                      # ADMIN_EMAILS + isAdminUser
├── admin.test.ts
├── password.ts                   # PasswordPolicy schema + validatePassword
└── password.test.ts

src/firebase/
└── config.ts                     # MOD — initializeAuth + App Check init

src/contexts/
└── AuthContext.tsx               # MOD — remove signIn alias, force refresh, scopes, isAdminUser shared

src/lib/auth/                     # NOVO — utilitários client-only
├── errorMessages.ts              # mapeamento auth/* → t() keys
├── errors.ts                     # isAuthError type guard
└── persistence.ts                # opcional — wrap setPersistence se necessário

src/components/
├── PrivateRoute.tsx              # MOD — fallback loading
├── AdminRoute.tsx                # MOD — fallback loading
├── AuthLoadingFallback.tsx       # NOVO — skeleton 200ms
└── EmailVerificationBanner.tsx   # NOVO

src/pages/
├── LoginPage.tsx                 # MOD — signUp via Context, error map, link rate-limit
├── ForgotPasswordPage.tsx        # NOVO
├── SettingsPage.tsx              # MOD — password policy shared, error map
└── DeleteDataPage.tsx            # MOD — confirmação dupla

functions/src/
├── bootstrapUser.ts              # MOD — email fallback, telemetria
└── deleteUserData.ts             # MOD — implementação real

docs/
├── Decisions.md                  # ADD ADR-016
├── SECURITY.md                   # MOD — App Check, password policy, admin shared
├── QA-CHECKLIST.md               # MOD — novos itens auth
├── ERROR-HANDLING.md             # MOD — tabela completa códigos auth
├── CHANGES.md                    # ADD [2026-05-17]
└── superpowers/specs/2026-05-17-auth-flow-hardening-design.md  # ESTE
```

### 4.2 Auth surface boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│ Browser                                                          │
│                                                                  │
│  LoginPage / SettingsPage / DeleteDataPage / ForgotPasswordPage │
│           │                                                       │
│           ▼                                                       │
│  ┌──────────────────────┐    ┌─────────────────────────┐         │
│  │  AuthContext         │    │  src/lib/auth/*         │         │
│  │  - user, loading,    │◄───┤  - errorMessages        │         │
│  │    isAdmin, hasPwd   │    │  - isAuthError          │         │
│  │  - signIn/signUp/    │    └─────────────────────────┘         │
│  │    signInWith{G,F}/  │                                         │
│  │    signOut           │    ┌─────────────────────────┐         │
│  │  - getIdToken(true)  │◄───┤  @adsmart/shared/auth   │         │
│  └──────────────────────┘    │  - isAdminUser          │         │
│           │                  │  - validatePassword     │         │
│           ▼                  └─────────────────────────┘         │
│  Firebase Auth SDK (initializeAuth) + App Check                  │
└───────────┬──────────────────────────────────────────────────────┘
            │ Identity Toolkit API
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Identity Platform                                                │
│  - Password policy (R6 mirror)                                   │
│  - App Check enforcement (monitor → enforce)                     │
│  - Blocking functions trigger                                    │
└───────────┬──────────────────────────────────────────────────────┘
            │ beforeUserCreated
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Cloud Functions (v2)                                             │
│                                                                  │
│  bootstrapUser   ─►  users/{uid} + users/{uid}/wallet/current   │
│                      (Admin SDK, batched, idempotent)            │
│                                                                  │
│  deleteUserData  ─►  cascade delete + auth().deleteUser()        │
│                                                                  │
│  All callables   ─►  isAdminUser(token, email) from shared      │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Decision points (per-component)

#### `src/firebase/config.ts`

Migra de `getAuth(app)` para `initializeAuth(app, ...)` com persistence fallback explícito. O fallback array permite ao SDK tentar IndexedDB primeiro (mais robusto a privacy modes), depois localStorage (default), depois sessionStorage (Safari ITP em iframe), depois in-memory (último recurso). Documentado em comentário do arquivo.

App Check é inicializado **uma vez** logo após `initializeApp`, antes de qualquer outro serviço Firebase. Sem `VITE_APPCHECK_SITE_KEY` definida, App Check **não é inicializado** (gate por env var) — sem fallback silencioso. Em dev, debug token via `(self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true` se `import.meta.env.DEV`.

#### `src/contexts/AuthContext.tsx`

- Remove `signIn` (alias duplicado).
- Adiciona `forceRefreshAfterAuth(user)` helper: `await user.getIdToken(true)` + `await user.reload()`. Chamado após `signInWith{Email,Google,Facebook}`, após `signUp`, após `linkWithCredential` em SettingsPage.
- `isAdmin` reusa `isAdminUser(tokenResult.claims, user.email)` do shared.
- Mantém `hasPasswordProvider` (já correto).
- Erros não são re-thrown com `console.error` — apenas re-thrown para o caller. O caller (LoginPage etc) tem o mapeamento de mensagem.

#### `src/components/{Private,Admin}Route.tsx`

```tsx
export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoadingFallback />
  return user ? <>{children}</> : <Navigate to="/login" replace />
}
```

`replace` em vez de push — evita acumular `/login` no histórico.

#### `src/lib/auth/errorMessages.ts`

```ts
import { FirebaseError } from 'firebase/app'

export const AUTH_ERROR_KEY_MAP: Record<string, string> = {
  'auth/invalid-credential': 'loginPage.error.invalidCredentials',
  'auth/wrong-password':     'loginPage.error.invalidCredentials',  // legacy
  'auth/user-not-found':     'loginPage.error.invalidCredentials',  // privacy: same msg
  'auth/email-already-in-use':                  'loginPage.error.emailInUse',
  'auth/weak-password':                         'common.validation.weakPassword',
  'auth/invalid-email':                         'common.validation.invalidEmail',
  'auth/too-many-requests':                     'common.error.tooManyAttempts',
  'auth/popup-blocked':                         'loginPage.error.popupBlocked',
  'auth/popup-closed-by-user':                  'loginPage.error.popupClosed',
  'auth/cancelled-popup-request':               'loginPage.error.popupClosed',
  'auth/network-request-failed':                'common.error.network',
  'auth/account-exists-with-different-credential': 'loginPage.error.accountConflict',
  'auth/credential-already-in-use':             'loginPage.error.credentialInUse',
  'auth/requires-recent-login':                 'common.error.requiresReauth',
}

export function authErrorToTKey(err: unknown): string {
  if (err instanceof FirebaseError && err.code in AUTH_ERROR_KEY_MAP) {
    return AUTH_ERROR_KEY_MAP[err.code]
  }
  return 'common.error.generic'
}
```

#### `functions/src/bootstrapUser.ts` — robustez

```ts
export const bootstrapUser = beforeUserCreated(async (event) => {
  const uid = event.data?.uid
  if (!uid) return

  // Prioridade: top-level email > additionalUserInfo > primeiro providerData
  const email =
    event.data?.email ??
    (event.data?.providerData ?? []).find((p) => p.email)?.email ??
    null

  const db = admin.firestore()
  const now = admin.firestore.Timestamp.now()

  const userRef = db.collection('users').doc(uid)
  const walletRef = userRef.collection('wallet').doc('current')

  const wallet = UserWalletSchema.omit({ id: true }).parse({
    balance: 0,
    currency: 'BRL',
    updatedAt: now,
  })

  const userDoc: Record<string, unknown> = {
    createdAt: now,
    updatedAt: now,
  }
  // Email opcional na criação — se ausente, SettingsPage primeiro save exige
  // preencher (gate de UX). Phase 3 rules toleram create sem email só pelo
  // bootstrap (Admin SDK bypassa). Subsequent client writes via update path
  // não podem mexer no email (immutability).
  if (email) userDoc.email = email

  const batch = db.batch()
  batch.set(userRef, userDoc, { merge: true })
  batch.set(walletRef, wallet, { merge: true })
  await batch.commit()

  console.log(JSON.stringify({
    event: 'bootstrapUser.success',
    uid,
    email_present: Boolean(email),
    providers: (event.data?.providerData ?? []).map((p) => p.providerId),
  }))
})
```

**Decisão sobre `users/{uid}` sem email:** `firestore.rules` linha 36-39 permite create se `email` é valid string. Como `bootstrapUser` usa Admin SDK, ignora rules. O risco é o **client subsequente** tentar update com `request.resource.data.email !== resource.data.email` — passa, porque ambos são `undefined`/`null`. Se o usuário tentar adicionar email depois via Settings, falha na rule de immutability. **Solução:** SettingsPage detecta `!user.email && !profile.email` e força preencher como primeiro save antes de qualquer outra ação. Documentar em ADR-016.

#### `functions/src/deleteUserData.ts` — implementação real

Estrutura:

1. Auth check (já tem).
2. Rate limit `checkRateLimit(uid, 'deleteUserData')` — config 1 attempt / 1 hour.
3. Iterar subcollections conhecidas: `wallet`, `transactions`, `oauthConnections`, `reports`, `activityLogs`. Para cada, `db.collection('users').doc(uid).collection(sub).listDocuments()` → batch delete.
4. Deletar `userDocuments/{normalizedDocId}` lendo `users/{uid}.documentNumber` primeiro.
5. Deletar o `users/{uid}` doc raiz.
6. `await admin.auth().deleteUser(uid)`.
7. `await securityLogger.logEvent(SecurityEventType.USER_DELETION, uid, { ... }, SecuritySeverity.INFO)`.
8. Retornar `{ success: true, deletedAt: now }`.

Após `auth().deleteUser`, o token do cliente fica inválido — o cliente é forçado a `signOut` automaticamente via `onAuthStateChanged(null)`. `DeleteDataPage` mostra "Conta excluída" e redireciona para `/login` após 2s.

## 5. Validation strategy

### 5.1 Compile-time + lint

- `bun run typecheck` em todos os workspaces (turbo).
- `bun run lint` (Biome em web, ESLint em functions).
- TypeScript strict mode já habilitado — força tipos corretos no errorMessages map.

### 5.2 Unit tests

- `packages/shared/src/auth/password.test.ts` — valida casos: senha forte passa, faltando upper falha, etc.
- `packages/shared/src/auth/admin.test.ts` — `isAdminUser({admin: true}, 'foo@bar.com')` true; `isAdminUser({}, 'agency.elovisiondigital@gmail.com')` true (fallback); `isAdminUser({}, 'random@bar.com')` false.
- `src/components/PrivateRoute.test.tsx` — render com `loading: true` mostra fallback; `loading: false, user: null` redireciona; `loading: false, user: {}` renderiza children.
- `src/components/AdminRoute.test.tsx` — idem com `isAdmin`.

### 5.3 Functions emulator tests

- `functions/test/bootstrapUser-email-fallback.test.ts` — três casos:
  1. `event.data.email = 'foo@bar.com'` → `users/{uid}.email == 'foo@bar.com'`.
  2. `event.data.email = undefined`, `providerData = [{ providerId: 'facebook.com', email: 'fb@x.com' }]` → `users/{uid}.email == 'fb@x.com'`.
  3. Sem email em lugar nenhum → `users/{uid}` criado **sem campo email**; wallet criada normalmente.
- `functions/test/deleteUserData.test.ts` — setup user com wallet + transactions + userDocuments; call deleteUserData; assert tudo deletado + auth user gone.

### 5.4 Manual QA (browser)

Adicionados ao `QA-CHECKLIST.md`:

- [ ] Login Google → popup abre → seleção de conta força aparecer → redirect para `/dashboard`.
- [ ] Login Facebook → popup abre → permissões pedem email → após first signup, `users/{uid}.email` está preenchido.
- [ ] Login com email **inexistente** mostra "credenciais inválidas" (não "user not found" — privacy).
- [ ] `/forgot-password` envia email → email recebido → link funciona → reset OK.
- [ ] EmailVerificationBanner aparece quando email não verificado; some após verificar.
- [ ] App Check token presente no `X-Firebase-AppCheck` header das requisições (DevTools → Network → identitytoolkit).
- [ ] Conta deletada via `/privacy/delete-data` → fluxo de confirmação → logout automático → `users/{uid}` + wallet + auth user todos some.
- [ ] Loading fallback aparece brevemente no primeiro mount de `/dashboard` (não tela branca, não flash redirect).
- [ ] COOP header em `Network` é `same-origin-allow-popups`.

## 6. Risk + Trade-offs

### 6.1 COOP downgrade

Mudar `Cross-Origin-Opener-Policy` de `same-origin` para `same-origin-allow-popups` **enfraquece** levemente o isolamento cross-origin. Especificamente, perdemos a garantia de que `window.opener` será sempre `null` para a página pai quando abre popups cross-origin.

**Mitigação:**
- `CORP: same-origin` permanece (resources são same-origin).
- Para reativar cross-origin isolation completa (SharedArrayBuffer etc.), opção futura é migrar para `signInWithRedirect` (perda de UX) ou usar custom auth domain (Identity Platform feature).
- Documentado em ADR-016 com link para Approach C.

### 6.2 App Check rollout

Habilitar App Check pode bloquear usuários legítimos se o site key estiver mal configurado ou se o cliente estiver em um ambiente sem reCAPTCHA Enterprise (ex: testes E2E com puppeteer sem token de debug). **Mitigação:** rollout em duas fases:

1. **Fase 1 (semana 1):** Adicionar SDK + inicialização. Identity Toolkit fica em **monitor mode** (Firebase Console → App Check → Identity Toolkit API → Monitor). Coletar métricas: % de requests com token válido vs sem.
2. **Fase 2 (semana 2+):** Se taxa de tokens válidos > 95%, mover para **enforce mode**. Caso contrário, investigar gap.

Documentado em ADR-016 e `DEPLOYMENT.md`.

### 6.3 Custom claim refresh forçado

`getIdToken(true)` após signin adiciona ~100-200ms à latência percebida do login (roundtrip extra). **Acceptable** porque é one-time por session. Sem isso, novos admins precisariam sign-out/sign-in para receber a claim.

### 6.4 Email fallback no blocking trigger

Se Facebook retornar `event.data.email = undefined` E `providerData[0].email = undefined`, criamos `users/{uid}` sem campo email. Isso é diferente do estado atual (`email: ''`) e pode quebrar **leitores client-side** que assumem `email` presente. **Mitigação:**

- `useAuth().user.email` continua vindo direto de `auth.currentUser` (Firebase Auth), não do Firestore — para popular essa interface, Firebase Auth sempre tem o email se o provider deu.
- Código que lê `users/{uid}.email` (ex: `SettingsPage.loadUserProfile`) usa `data.email || user.displayName` como fallback. Atualizar para `data.email ?? user.email ?? ''` — `user.email` é Firebase Auth canonical.
- `firestore.rules` linha 38 exige `isValidEmail(request.resource.data.email)` no **create** — não no **update**. Como o trigger usa Admin SDK, bypassa. Subsequent updates não tocam email (immutability).

## 7. Alternatives considered

### 7.1 Approach B — Extrair Auth Service dedicado

Mover toda a lógica do AuthContext para `src/services/auth/AuthService.ts` (signin, signup, link, reauth, admin check), com Context apenas expondo estado.

**Pros:**
- Separação clara state vs operations.
- Testável sem React (vitest puro).
- Caminho natural para TanStack Query layer ou Redux migrate (não no horizonte).

**Cons:**
- Indirection extra para um app de 1 contexto auth.
- Mais arquivos, mais cognição.
- Sem ganho prático para o threat model atual.

**Decisão:** Rejeitado — YAGNI. Approach A consegue o mesmo resultado de bugs corrigidos com 30% do código novo.

### 7.2 Approach C — signInWithRedirect + MFA TOTP obrigatório

Trocar `signInWithPopup` por `signInWithRedirect` em todos os fluxos OAuth. Habilitar MFA TOTP para admins (Identity Platform feature, exige plano Blaze pago — já no projeto).

**Pros:**
- Compatível com COOP `same-origin` (sem downgrade).
- MFA para admin é defense-in-depth real.
- `signInWithRedirect` funciona em todos os browsers sem caveat.

**Cons:**
- Redirect quebra fluxo de muitos modais/onboarding.
- `getRedirectResult` adiciona um caminho de auth state que precisa ser tratado em todos os pontos onde hoje confiamos em `onAuthStateChanged`.
- MFA TOTP introduz setup flow + recovery codes UI + admin tooling para reset — escopo significativo.
- Risk: `getRedirectResult` em SPA com React Router exige timing cuidadoso, alguns browsers tem bugs (Safari).

**Decisão:** Diferido para ADR-017 quando: (a) houver risco real de targeted attack contra admins, ou (b) compliance pedir MFA obrigatório, ou (c) número de admins escalar > 5. Hoje (~2 admins, sem compliance pendente, sem ataques observados), o custo de implementação não se justifica.

### 7.3 Manter ADMIN_EMAILS duplicado

Status quo. Cada arquivo tem sua cópia.

**Cons:**
- Drift garantido (já houve um caso silencioso quando `priceManager.ts` adicionou email diferente da fonte original — descoberto em PR review, mas próxima vez pode passar).
- Lei de DRY violada.

**Decisão:** Rejeitado. Unificação custa 20 linhas de código novo e elimina classe de bug inteira.

### 7.4 Substituir useRateLimit por backend rate limit em todos os endpoints

Adicionar Cloud Function middleware que valida rate limit antes de cada callable.

**Pros:**
- Defesa real (não bypasável por refresh).

**Cons:**
- Identity Toolkit (signin/signup) **não é callable** — não pode ter middleware de rate limit nosso. A defesa lá vem do Firebase Auth próprio + App Check.
- Para callables (já protegidos por `request.auth`), `checkRateLimit` já existe e é chamado em pontos sensíveis.

**Decisão:** Status quo. `useRateLimit` no client documentado como UX guard, não defesa.

## 8. Dependencies

### 8.1 Pré-requisitos operacionais

- **Identity Platform** já está habilitada (pré-req do `bootstrapUser` trigger — ADR-010).
- **App Check site key** precisa ser provisionada no Firebase Console → App Check → Web app → Provider: reCAPTCHA Enterprise. Adicionar ao `.env.example` e `.env.production` como `VITE_APPCHECK_SITE_KEY=<chave>`.
- **Password policy no Identity Platform**: Firebase Console → Authentication → Settings → Password policy → habilitar com mesmas regras de R6.
- **Custom domain** (opcional, futuro): se quisermos voltar para COOP `same-origin`, precisa Identity Platform custom auth domain. Fora de escopo.

### 8.2 NPM/Bun deps

- `firebase` já está em 10.x — sem upgrade.
- Adicionar **nada** novo de runtime (App Check já está no SDK firebase v10).

### 8.3 Cloud Functions

- `firebase-functions` v6.4 já tem `firebase-functions/v2/identity` (já em uso por bootstrapUser).
- Sem upgrade necessário.

## 9. Build sequence

O plano de implementação seguinte (writing-plans) deve seguir esta ordem para que cada PR seja reviewable independente:

1. **Phase A — Shared modules + tests** (`packages/shared/src/auth/{admin,password}.ts` + testes). Standalone.
2. **Phase B — Client config & Context** (firebase/config.ts persistence + App Check init gated; AuthContext usando shared, forceRefresh, scopes, dead-code removal).
3. **Phase C — Route guards + EmailVerificationBanner + AuthLoadingFallback**.
4. **Phase D — LoginPage + ForgotPasswordPage + SettingsPage** (error map shared, password policy shared, signUp via Context).
5. **Phase E — Functions: bootstrapUser hardening + deleteUserData implementação**.
6. **Phase F — COOP header change** (firebase.json) — separado para ser fácil de rollback se quebrar OAuth no preview.
7. **Phase G — Docs sweep + ADR-016** (CHANGES.md, SECURITY.md, QA-CHECKLIST.md, ERROR-HANDLING.md, AGENTS.md, CLAUDE.md).
8. **Phase H — App Check rollout** — config Identity Toolkit monitor mode → metrics → enforce. Operacional, não code.

Cada fase termina com `bun run typecheck && bun run lint && bun run test:all` verde + manual QA checkboxes específicos.

## 10. Self-review notes

| Checked | Item |
|---|---|
| ✅ | Placeholder scan: nenhum TBD/TODO. R10/R11 são decisões explícitas sobre comportamento sutil, não placeholders. |
| ✅ | Internal consistency: arquitetura (§4) bate com decisions (§3). Sequence (§9) cobre tudo. |
| ✅ | Scope check: focado em um único refactor (auth flow) — não está bundling com Asaas, Phase 2, ou admin overhaul. Pode virar 1 plano grande ou 8 PRs pequenos; build sequence (§9) sugere o segundo. |
| ✅ | Ambiguity check: R4 deixa claro que App Check entra **gated por env var** (não quebra dev sem chave). R8 deixa claro que Facebook recebe addScope. R11 deixa claro que bootstrap pode criar user sem email. |
| ✅ | Context7 cross-check: persistence stack, scopes, password policy, App Check Enterprise — todos validados em 2026-05-17 contra `/firebase/firebase-js-sdk`. |
| ⚠️ | Phase H (App Check rollout) é operacional/manual — sem código mas requer ação humana. Documentar como tarefa de ops, não de dev. |
| ⚠️ | A unificação de `ADMIN_EMAILS` em `packages/shared` cria dep do client em `@adsmart/shared` (já existe — ADR-009 path para schemas). Sem nova dep transitiva. |

## 11. References

- Context7: `/firebase/firebase-js-sdk` — Firebase JS SDK v10 auth, App Check, persistence (queried 2026-05-17).
- [docs/Decisions.md#adr-010](../../Decisions.md#adr-010-per-user-state-bootstrap-moved-to-server-side-auth-blocking-trigger) — origem do bootstrapUser trigger.
- [docs/Decisions.md#adr-012](../../Decisions.md#adr-012-cpfcnpj-uniqueness--immutability-via-callable--uniqueness-index) — referenciada em deleteUserData (precisa limpar userDocuments).
- [docs/Decisions.md#adr-013](../../Decisions.md#adr-013-drop-google-recaptcha-from-authentication) — origem do "sem reCAPTCHA"; este refactor adiciona App Check como sucessor.
- [docs/Decisions.md#adr-015](../../Decisions.md#adr-015-register-identity-platform-blocking-trigger-after-total-firestore--auth-wipe) — runbook do trigger; usado para reseed do dev.
- [docs/SECURITY.md](../../SECURITY.md) — seção a atualizar com App Check + admin shared.
- [AGENTS.md](../../../AGENTS.md) — read-first map a atualizar.
- [CLAUDE.md](../../../CLAUDE.md) — seção "Password vs OAuth providers" a atualizar.
- MDN — Cross-Origin-Opener-Policy values reference (for COOP downgrade rationale).
