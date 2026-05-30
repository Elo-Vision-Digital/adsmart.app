# Research — OAuth Plataformas (Google Ads + Meta Marketing)

**Validado em**: 2026-05-19
**Fontes**: WebSearch — Google Ads API v23.1 (Fev 2026), Meta Marketing API v23 (2026)
**Aplicação**: VAL-1 (validação OAuth atual), CLEAN-2/3 (cleanup textual), FLOW-2 (redirect OAuth no novo wizard)

---

## 1. Estado atual do projeto

### Já implementado e funcional
- OAuth Google Ads V2 (`getGoogleAdsAuthUrl` + `handleGoogleAdsCallbackWithSelection` + `confirmGoogleAdsAccountSelection`)
- OAuth Meta Ads V2 (`getMetaAdsAuthUrl` + `handleMetaAdsCallback` + V2 com seleção)
- Selection flow para múltiplos manager accounts (Google) e Business accounts (Meta)
- Account storage em `users/{uid}/adAccounts/{accountId}`
- Page MetaReviewDemo para aprovação Meta (temporário — ver decisão sobre dev-only)

### O que precisa validar (VAL-1 )
- Refresh token rotation funcionando (Google Ads MFA mudou — ver seção 2)
- Token expirado → reauth fluido (sem perda de UX)
- Disconnect / revogar funcionando
- Cenários de erro: usuário nega, sessão expira, redirect_uri inválido

---

## 2. Google Ads API — MUDANÇA CRÍTICA mai/2026

### Multi-factor Authentication obrigatória em refresh tokens NOVOS
- **A partir de 21 abril 2026**: Google Ads API exige MFA em todo novo OAuth 2.0 refresh token
- **Tokens existentes**: continuam funcionando sem mudança (importante — não quebra usuários atuais)
- **Operações afetadas**:
  - Novo usuário conectando pela primeira vez → precisa MFA
  - Usuário re-autenticando após expiração → precisa MFA
  - Recriação de tokens revogados/expirados
- **Service accounts NÃO são afetados** — mas AdSmart usa User OAuth, não Service Account

### Implicação para AdSmart
- Usuários novos que conectam Google Ads depois de 21/abr → vão precisar ter MFA na conta Google
- **UX**: nada extra a fazer — Google handle o MFA prompt no fluxo OAuth normal
- **Mas**: precisamos atualizar **mensagem de erro** se OAuth falhar por falta de MFA
- **Documentar**: na tela de erro do OAuth, instruir "Verifique se você tem verificação em duas etapas ativada na sua conta Google"

### Google Ads API v23.1 (versão atual fev/2026)
- Verificar se nosso SDK [functions/src/googleAdsOAuth.ts](functions/src/googleAdsOAuth.ts) está em versão compatível
- Auditoria sugerida durante VAL-1: bater versões instaladas vs v23.1

---

## 3. Meta Marketing API — patterns 2026

### Token types
| Token | Vida | Uso |
|---|---|---|
| **User Access Token** | ~60 dias (long-lived) | Usuário interativo |
| **System User Token** | 60 dias, refreshable | **Server-to-server** (gold standard) |
| **App Access Token** | Permanente | App-level operations |

### AdSmart usa User Access Token (validar)
- Auditar em [functions/src/metaAdsOAuth.ts](functions/src/metaAdsOAuth.ts) qual token type está sendo armazenado
- **Recomendação 2026**: migrar para System User Token quando possível (mais seguro, refresh programático)

### Business Verification — obrigatória para Advanced Access
- Apps que precisam de `ads_management` permission em Advanced Access devem ter **Business Verification**
- AdSmart provavelmente já fez (existe MetaReviewDemo na app)
- **Verificar status** no Meta App Dashboard durante VAL-1

### Token refresh
- Long-lived User tokens podem ser refreshados via `/oauth/access_token?grant_type=fb_exchange_token`
- Verificar se [metaAdsOAuth.ts](functions/src/metaAdsOAuth.ts) tem job de refresh proativo (antes de expirar)
- Se não: implementar Cloud Function agendada (`onSchedule('every 7 days')`) para refresh proativo de tokens próximos da expiração

---

## 4. Recomendações concretas para o 

### VAL-1 (validação funcional OAuth) — checklist obrigatório

**Google Ads**:
- [ ] Signup → conectar Google Ads → primeira vez (testar MFA flow após 21/abr)
- [ ] Reconectar conta expirada (testar reauth)
- [ ] Disconnect → reconectar com manager account diferente
- [ ] Selection flow com múltiplos manager accounts
- [ ] Erro: usuário nega permissão → mensagem clara
- [ ] Erro: redirect_uri configurado errado → log + mensagem
- [ ] Verificar version Google Ads API SDK ≥ v23
- [ ] Atualizar mensagens de erro mencionando MFA quando aplicável

**Meta Ads**:
- [ ] Signup → conectar Meta → seleção de Business → seleção de Ad Account
- [ ] Verificar token storage (User vs System User token)
- [ ] Refresh proativo antes de expirar (job agendado)
- [ ] Disconnect → revoke token via Meta API (não só deletar local)
- [ ] Erro: app não tem business verification ainda → tratativa
- [ ] Verificar version Meta Marketing API SDK atual

### FLOW-2 (redirect OAuth dentro do novo wizard)

**Pattern recomendado** (já decidido em AMB-4):
1. Wizard salva estado em `sessionStorage.setItem('report-wizard-state', ...)` antes do redirect
2. Chama `getGoogleAdsAuthUrl(returnUrl: '/generate-report/step-2?resume=true&platform=google_ads')`
3. Callback `/auth/google-ads/callback` faz a troca de tokens
4. Após sucesso, redireciona para `returnUrl`
5. Step 2 detecta `?resume=true`, lê sessionStorage, prossegue

**State validation**:
- Se sessionStorage ausente quando `resume=true` → reseta para step 1 (não confiar no resume sozinho)
- Se sessionStorage > 30min → expira, reseta

### Refresh tokens — boa prática
- Refresh token sempre **encrypted at rest** (AES-256 com chave em `defineSecret`)
- Refresh proativo antes de expirar:
  - Google: refresh quando `expires_in < 1 dia`
  - Meta: refresh quando `expires_in < 7 dias`
- Cloud Function agendada (`onSchedule('every 6 hours')`) audita tokens próximos de expirar

---

## 5. Cleanup de TestDemo (MetaReviewDemo) — dev-only flag

### Decisão do usuário (mensagem atual)
> "O Meta Review Demo e qualquer outra funcionalidade de teste, funciona apenas em desenvolvimento e nunca em producao."

### Implementação
- Verificar `import.meta.env.MODE === 'development'` no React Route
- Ou usar Vite env: `VITE_ENABLE_DEV_PAGES=true` (.env.development)
- Em produção, rota `/meta-review-demo` retorna 404 ou redirect para `/dashboard`

```tsx
// src/App.tsx
{import.meta.env.MODE === 'development' && (
  <Route path="/meta-review-demo" element={<MetaReviewDemo />} />
)}
```

### Aplicar mesmo pattern para qualquer rota/funcionalidade de teste futura
- Adicionar como **princípio **: "Toda rota/funcionalidade de teste é guarded por `import.meta.env.MODE === 'development'`"

---

## 6. Decisões pendentes / a confirmar em fase de implementação

| Decisão | Status |
|---|---|
| Migrar Meta para System User Token? | A avaliar em VAL-1 (se o token type atual é User Access, considerar migração) |
| Mensagens de erro OAuth (i18n) | Padronizar com pt-BR/en/es |
| Refresh proativo dos tokens | Implementar como Cloud Function agendada (`refreshOAuthTokens`) |
| Cleanup do MetaReviewDemo | Aplicar guard `import.meta.env.MODE === 'development'` |

---

## Sources

- [Google Ads API MFA — April 2026](https://almcorp.com/blog/google-ads-api-multi-factor-authentication/)
- [Google Ads API v23](https://ads-developers.googleblog.com/2026/01/announcing-v23-of-google-ads-api.html)
- [Google Ads API v23.1 February 2026](https://almcorp.com/blog/google-ads-api-version-23-1/)
- [Meta Marketing API Authentication](https://developers.facebook.com/docs/marketing-api/get-started/authentication/)
- [Meta Marketing API v23 SDK Node](https://github.com/facebook/facebook-nodejs-business-sdk)
- [OAuth 2.0 Internals for Google Ads API](https://developers.google.com/google-ads/api/docs/oauth/internals)
