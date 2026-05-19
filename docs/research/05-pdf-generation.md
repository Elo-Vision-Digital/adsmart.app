# Research — PDF Generation (Cloud Functions vs Alternativas)

**Validado em**: 2026-05-19
**Fontes**: WebSearch benchmarks 2026, Cloud Functions memory/CPU configs
**Aplicação**: INF-3 do roadmap inicial (botão "Export PDF" no Report Detail FLOW-6)

---

## 1. Comparação validada (benchmark mai/2026)

| Solução | Cold start | Warm | RAM | Dependência | Custo | Veredito |
|---|---|---|---|---|---|---|
| **Playwright** + Chromium em Cloud Functions | 147ms cold→tempo PDF | 42ms→tempo PDF | 1-2GB | Self-hosted Chromium | ~$0.10-0.30 por PDF | **Recomendado** se self-hosted |
| **Puppeteer** + Chromium em Cloud Functions | 147ms cold | 48ms → 3ms warm | 1-2GB | Self-hosted | similar Playwright | Pior que Playwright |
| **react-pdf** (client-side) | ~0 (browser) | ~0 | Browser | Lib JS no front | 0 (no server) | OK para PDFs simples |
| **API gerenciada** (DocRaptor, Browserless, etc.) | ~0 cold | depends | 0 (deles) | API externa | $0.05-0.20/PDF | Bom mas dependência |
| **PDFKit** server-side (sem browser) | 0 | 0 | 100MB | Lib node | 0 (compute) | Limitado para layouts complexos |

---

## 2. Decisão recomendada para o roadmap

### **Playwright em Cloud Functions** ⭐

**Por quê**:
1. **Fidelidade visual perfeita**: renderiza o React/HTML exatamente como o usuário vê
2. **Performance superior a Puppeteer** (benchmark 2026 confirma: 3ms warm Playwright vs 48ms Puppeteer)
3. **Self-hosted**: sem dependência de SaaS externo, sem custo recorrente fixo
4. **Já dentro do nosso stack** (Cloud Functions + Node 22) — sem nova plataforma
5. **Estável**: Oxide + Playwright maduros em 2026

**Trade-offs aceitos**:
- Cold start ~1-3s (primeira call), ~50ms warm
- Cloud Function precisa **2GB RAM mínimo + 1 vCPU**
- Custo: ~$0.10 por PDF gerado (compute Functions)

### Não recomendado: react-pdf
- Layouts complexos (charts, tabelas customizadas, fontes Apple) ficam diferentes do que o usuário vê
- Mantenibilidade: 2 implementações do mesmo report (React UI + react-pdf reimplementation)

### Não recomendado: API gerenciada
- Dependência externa pra função CORE (relatórios são o produto)
- Custo recorrente
- Latência adicional + privacidade dos dados

---

## 3. Arquitetura concreta

### Cloud Function `exportReportPDF`

```ts
// functions/src/reports/exportReportPDF.ts
import { onCall } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { chromium } from 'playwright-core'

export const exportReportPDF = onCall({
  memory: '2GiB',
  cpu: 1,
  timeoutSeconds: 120,
  region: 'us-central1',
  // Playwright/Chromium binaries via layer ou bundled
  minInstances: 0,  // ou 1 se queremos warm (custo extra)
}, async (request) => {
  // 1. Validar auth + owner do report
  // 2. Idempotência (clientRequestId)
  // 3. Rate limit (max 10 PDFs/min por user)
  // 4. Gerar URL temporária autenticada do report (signed token)
  // 5. Spawn Playwright → navigate → pdf({ format: 'A4', printBackground: true })
  // 6. Upload buffer para Cloud Storage
  // 7. Retornar signed URL com expiração de 1h
  // 8. Log estruturado: pdfSize, generationTime, etc.
})
```

### Alternativa: Cloud Run (se Cold Start virar problema)
- Playwright em Cloud Run com **min instances = 1** elimina cold start
- Custo: ~$5/mês de container sempre ligado
- Considerar quando volume justificar (>100 PDFs/dia)

### Como o frontend chama
```ts
// SPA: click "Export PDF"
const { downloadUrl } = await httpsCallable(functions, 'exportReportPDF')({ reportId })
// downloadUrl é signed Cloud Storage URL com 1h de validade
window.location.href = downloadUrl  // browser inicia download
```

---

## 4. Detalhes de implementação

### Bundle do Playwright em Cloud Functions
- **NÃO usar `playwright` npm** (puxa Chromium completo ~280MB — não cabe em CF)
- **Usar `playwright-core`** + Chromium pré-instalado via Cloud Functions buildpack ou Docker custom
- **Alternativa moderna**: `@sparticuz/chromium` (Chromium otimizado para serverless) + `playwright-core`

### Pacote recomendado em [functions/package.json](functions/package.json)
```json
{
  "dependencies": {
    "playwright-core": "^1.50.0",
    "@sparticuz/chromium": "^131.0.0"
  }
}
```

### Memória precisa ser bem dimensionada
- 1GB pode dar OOM em relatórios grandes
- 2GB é o sweet spot recomendado pelos benchmarks
- Custo: 2GB × 60s = ~$0.0008 por PDF (compute apenas)

### Storage do PDF
- Cloud Storage bucket dedicado: `gs://adsmart-pdf-exports`
- Path: `pdfs/{userId}/{reportId}/{timestamp}.pdf`
- **Lifecycle policy**: deletar após 24h (PDFs são one-shot — usuário baixa e descarta)
- Signed URL com `expiration: 1h` para o usuário

### Rate limit
- Reusar [functions/src/rateLimiter.ts](functions/src/rateLimiter.ts) existente
- Max 10 PDFs/min por user
- Max 100 PDFs/dia por user (cobre uso humano normal)

---

## 5. URL temporária autenticada para o render

### Problema
- Playwright precisa **navigate** para uma URL que renderize o relatório
- Mas a URL do relatório (`/reports/:id`) é autenticada (PrivateRoute)
- Playwright headless não tem cookie do user

### Solução: render-only route com signed token
- Rota nova `/reports/:id/render?token={signedToken}`
- `signedToken` = JWT assinado pela Cloud Function com `{ userId, reportId, exp: 60s }`
- Página de render lê o token, decodifica, valida exp, faz fetch do report
- **Rota é específica para PDF** — não usa layout normal (sem sidebar, sem bottom nav, otimizada para impressão A4)
- Token de uso único + curto exp = seguro

### Estilos específicos para PDF
```css
@media print {
  /* esconder elementos que não cabem em PDF */
  .no-print { display: none; }
  /* forçar quebras de página */
  .page-break { break-before: page; }
  /* fontes maiores para legibilidade impressa */
  body { font-size: 12pt; }
}
```

---

## 6. Decisão sobre client-side react-pdf como Plan B

Se em fase de implementação a Cloud Function com Playwright provar custosa demais ou inestável:

**Fallback**: react-pdf no client
- Bundle adicional ~300KB
- Render manualmente (não reusa o JSX do report)
- Aceitável apenas para PDFs **simples** (lista de KPIs + 1 chart)
- Para relatório completo com múltiplas plataformas + charts customizados: **não escala**

**Marcar como opção em CURRENT-STATE-AUDIT.md** mas escolher Playwright como default.

---

## 7. Sources

- [HTML to PDF benchmark 2026 (Playwright vs Puppeteer)](https://pdf4.dev/blog/html-to-pdf-benchmark-2026)
- [Configure Cloud Functions Memory for Compute-Intensive Tasks](https://oneuptime.com/blog/post/2026-02-17-how-to-configure-cloud-functions-memory-and-cpu-allocation-for-compute-intensive-tasks/view)
- [Master Serverless PDF Generation 2026](https://codegive.com/blog/serverless_pdf_generation.php)
- [Cloud Run vs Cloud Functions for PDF](https://oneuptime.com/blog/post/2026-02-17-how-to-build-a-serverless-pdf-generation-service-using-cloud-run-and-puppeteer/view)
- [@sparticuz/chromium](https://github.com/Sparticuz/chromium) — Chromium otimizado para serverless
