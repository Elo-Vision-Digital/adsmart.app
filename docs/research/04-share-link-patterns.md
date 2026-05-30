# Research — Share-link Público (Firestore + Public Read)

**Validado em**: 2026-05-19
**Fontes**: Firebase developerknowledge MCP, WebSearch — public share patterns
**Aplicação**: SHARE-1, SHARE-2, SHARE-3 

---

## 1. Descoberta crítica

**Firestore Security Rules NÃO validam tokens em URLs.** A documentação oficial confirma: rules só veem `request.auth` e `resource.data`. **Não há mecanismo nativo** de validar um token de URL dentro das rules.

### Implicação
A segurança do share-link público **depende exclusivamente do shareId ser imprevisível**. Pattern correto:
- `shareId` = UUID v4 ou crypto-random de 16+ bytes (122+ bits de entropia)
- Rule: `allow get: if true` para a coleção `publicReportShares`
- Rule: `allow list: if false` (sem enumeração)
- **Segurança vem de não-enumerável + alta entropia, não de validar o token**

---

## 2. Arquitetura recomendada

### Estrutura de dados

```
publicReportShares/{shareId}    // top-level, public read
  - id: string (= shareId, UUID v4)
  - reportId: string            // ref para users/{ownerId}/reports/{reportId}
  - ownerId: string             // dono do relatório
  - visibleMetrics: string[]    // ids/keys de seções/métricas a expor (SHARE-1)
  - visibleSections: string[]   // tabs/seções permitidas
  - createdAt: timestamp
  - revokedAt: timestamp | null // null = ativo; preenchido = revogado
  - viewCount: number           // contador (write via Cloud Function ou client write controlado)
  - expiresAt: timestamp | null // opcional (a definir se vamos ter expiração)
```

### Por que `publicReportShares` é **top-level** (não subcoleção)
- Acesso público sem auth — não pode estar dentro de `users/{uid}/...` (rules em hierarquia exigem auth para chegar lá)
- Index único por `shareId`
- Listagem por `ownerId` para o dono ver seus shares (com auth do dono)

---

## 3. Firestore Security Rules

```javascript
match /publicReportShares/{shareId} {
  // PÚBLICO: qualquer um pode ler UM share específico (get)
  // Segurança via shareId imprevisível (UUID v4)
  allow get: if !exists(/databases/$(database)/documents/publicReportShares/$(shareId))
              || resource.data.revokedAt == null;

  // NUNCA permitir list — anti-enumeração
  // O dono lista via callable separado (listReportShares) que retorna só os seus
  allow list: if false;

  // Cliente nunca escreve direto — só via callables
  allow create, update, delete: if false;
}
```

### Por que a condição em `get`
- Se share foi revogado (`revokedAt != null`), nega leitura
- `!exists()` permite resposta 404 limpa em vez de erro de permissão

---

## 4. Callables necessários

### `createReportShare`
- Input: `{ reportId, visibleMetrics, visibleSections, expiresAt? }`
- Validação:
  - User é dono do `reportId`?
  - `visibleMetrics`/`visibleSections` é subset dos campos do relatório?
  - User tem permissão de share? (Free tem limite? — decisão pendente, default ilimitado)
- Gera `shareId` (UUID v4 via `crypto.randomUUID()`)
- Cria doc em `publicReportShares/{shareId}`
- Idempotente: usa `clientRequestId` para evitar duplicar
- Rate limit: max 10 shares/min por user (via `checkRateLimit`)
- Retorna `{ shareId, shareUrl: 'https://adsmart.app/r/{shareId}' }`

### `revokeReportShare`
- Input: `{ shareId }`
- Validação: user é dono do share
- Atualiza `revokedAt = serverTimestamp()`
- Loga em `securityLogs/`

### `listReportShares`
- Input: `{ reportId? }` (opcional, filtra por relatório)
- Query: `where('ownerId', '==', uid)` + paginação
- Retorna lista dos shares do usuário (com viewCount)
- Composite index: `(ownerId asc, createdAt desc)`

---

## 5. Rota pública `/r/:shareId`

### Fluxo
1. App carrega `/r/{shareId}`
2. Fetch direto do Firestore (`getDoc(publicReportShares/{shareId})`) — sem auth
3. Se `revokedAt != null` → mostra "Link expirado/revogado"
4. Senão: fetch do `report` referenciado em `reportId` — **mas como ler `users/{ownerId}/reports/{reportId}` sem auth?**

### Problema: relatório original está em `users/{ownerId}/reports/{...}` (privado)
**3 opções**:

**Opção A — Snapshot no momento da criação do share** ⭐ **recomendada**
- `createReportShare` salva um **snapshot do dado renderizável** dentro do próprio `publicReportShares/{shareId}/snapshot/data`
- Subcoleção `snapshot` também tem rule `allow get: if !exists(...) || parentDoc.revokedAt == null`
- Vantagem: dados públicos isolados, refresh do relatório original não muda o share (consistência)
- Desvantagem: 2x storage do dado

**Opção B — Cloud Function lê o report no nome do owner**
- Rota `/r/:shareId` chama callable `getPublicReport({shareId})` que lê o report via Admin SDK
- Vantagem: 1x storage
- Desvantagem: latência extra (callable), custo Function, viewCount sempre incrementa via function

**Opção C — Espelhar o doc do report em coleção pública na hora do share**
- Híbrido de A e B
- `publicReports/{reportId}` aberto para leitura quando há share ativo
- Complexo de manter consistência

**Recomendação: Opção A** (snapshot).
- Mais simples
- Performance melhor
- Dados imutáveis no link público (cliente vê snapshot da data do compartilhamento, não muda se owner re-gera)
- **Trade-off aceito**: 2x storage por share — Firestore é barato para este tamanho

### Opcional: atualizar snapshot quando dono "Atualizar"
- Callable `refreshReport(reportId)` pode opcionalmente refresh todos os shares ativos
- Adiciona param `refreshShares: boolean`

---

## 6. View count + Open Graph

### View count (Opção A: snapshot)
- Cliente faz `updateDoc(publicReportShares/{shareId}, { viewCount: increment(1) })`
- Mas rule diz `allow update: if false` — bloqueado
- **Solução**: callable `recordShareView({shareId})` com rate limit por IP (App Check ou IP-based limiter)
- Alternativa mais simples: Cloud Function HTTPS trigger que increments + retorna 200 OK (pixel-style)

### Open Graph
- Página `/r/:shareId` precisa SSR ou prerender para OG tags funcionarem em WhatsApp/Slack
- **Vite SPA NÃO suporta SSR nativo** — opções:
  - **A) Server-side render via Cloud Function** com path-rewrite (`/r/:shareId` → CF → HTML estático com OG)
  - **B) Prerender no build time** — não aplicável (shareIds são dinâmicos)
  - **C) Crawler detection** — Cloud Function intercepta UA de bot e retorna HTML com OG; user normal vai pro SPA
- **Recomendação**: **C** (crawler detection via Hosting rewrites + Cloud Function)

### Implementação OG via Hosting rewrites
```json
// firebase.json
{
  "hosting": {
    "rewrites": [
      { "source": "/r/**", "function": "renderShareOG" },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```
- `renderShareOG` Function detecta User-Agent
- Se for crawler (`facebookexternalhit`, `Twitterbot`, `Slackbot`, `WhatsApp`, etc.) → retorna HTML com OG tags
- Se for browser normal → serve `index.html` da SPA

---

## 7. Rate limiting + anti-abuse

### Problema
- `/r/:shareId` é público — scraping/scan é possível
- ShareId tem 122 bits de entropia → enumeração total inviável (~10^36 tentativas)
- Mas attacker pode fazer scan de uma seed conhecida ou tentar ataques de timing

### Mitigações
1. **App Check** habilitado no Firestore (já está no projeto): exige token reCAPTCHA para reads do client
   - Não funciona para 100% dos crawlers — verificar compat com OG
2. **Cloud Function intermediária** com rate limit por IP (60 req/min por IP)
3. **`viewCount` cap**: shares com viewCount > 10k em < 24h → marcar suspeito, alertar dono
4. **Honeypot fields**: campos com nomes "comuns" mas vazios → se acessados, bloqueia IP

### Trade-off
- Cliente direto no Firestore = melhor performance + App Check protege
- Cloud Function intermediária = mais controle + custo extra + latência

**Recomendação inicial**: cliente direto + App Check (sem CF intermediária). Reavaliar se virem abusos.

---

## 8. UI da configuração de visibilidade (SHARE-1)

### Onde aparece
- Dentro de Report Detail (`/reports/:id`), antes de clicar "Compartilhar"
- Botão "Compartilhar via link" abre **modal de configuração**:
  - Toggles por seção (KPIs, big chart, breakdown por campanha, insights LLM)
  - Toggles por métrica específica dentro de KPIs (Investido, Receita, ROAS, CPA, etc.)
  - Preview "como vai aparecer" (mini-render do link público)
  - Botão "Gerar link" → cria share + copia URL
  - Lista de shares existentes (revogar / re-compartilhar)

### Schema do estado UI
```ts
const config = {
  sections: {
    overview: true,
    chartRevenue: true,
    kpis: true,
    breakdown: false,    // dono escolheu ocultar
    insights: true,
  },
  metrics: {
    invested: true,
    revenue: true,
    roas: true,
    cpa: false,          // dono não quer expor CPA
    clicks: true,
    impressions: true,
  }
}
```

### Default seguro
- Tudo visível por default (UX simples)
- Dono explicitamente desliga o que não quer expor
- Lembrete UX: "lembre-se que dados sensíveis (ex: CPA, investimento) podem ser ocultados"

---

## 9. Decisões pendentes

| Decisão | Status | Quando fechar |
|---|---|---|
| Expiração padrão dos shares? | Sem expiração default (até revogar) | Pode adicionar opt-in depois |
| Limite de shares por usuário? | Sem limite (validar uso real) | Reavaliar quando ver abuso |
| Tracking de views — método | Pixel CF endpoint ou callable | Implementação |
| Storage do snapshot | Opção A (subcoleção em `publicReportShares`) | Decidido neste research |
| OG rendering | Crawler detection via Hosting rewrites | Decidido neste research |
| App Check para `/r/*` | Habilitar reads Firestore com App Check | Implementação |

---

## Sources

- [Firebase Security Rules — Get Started](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Rules Conditions](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Firebase developerknowledge MCP — consulta direta]
- [Avoid insecure rules](https://firebase.google.com/docs/rules/insecure-rules)
- [Allow public read access pattern](https://firebase.google.com/docs/firestore/security/rules-conditions)
