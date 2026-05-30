# Research — Frontend Stack (React 19 SPA, Tailwind v4, Apple SF Pro, Zod v4)

**Validado em**: 2026-05-19
**Fontes**: WebSearch — React 19 patterns, Tailwind v4 migration, Apple SF Pro, Zod v4
**Aplicação**: DS-1, REF-*, NEW-* 

---

## 1. React 19 + Vite SPA — não há "Server Components" para nós

### Veredito
**O projeto AdSmart é uma SPA Vite — Server Components NÃO se aplicam.** São exclusivos de frameworks com servidor React (Next.js, Remix, RedwoodJS). Tentar usar RSC em Vite SPA é overhead sem ganho.

### O que se aplica no React 19 que vale adotar
| Feature | Aplicável aqui? | Por quê |
|---|---|---|
| `use(promise)` hook + Suspense | **Sim** | Stream de dados (geração de relatório, share-link público) |
| `useActionState` + `useFormStatus` | **Sim** | Forms do novo fluxo de relatório (6 passos) |
| `useOptimistic` | **Sim** | Saldo de créditos otimista após gerar relatório |
| `useTransition` | **Sim** | Mudança de tabs entre plataformas no relatório |
| `<form action={fn}>` (Server Actions) | **Não** | Precisa servidor React |
| Document Metadata (`<title>` direto) | **Sim** | OG meta tags para share-link público |
| `ref` como prop (sem `forwardRef`) | **Sim** | Simplifica primitives novos (Field, Badge, etc.) |
| Resource preloading (`preinit`, `preload`) | **Sim** | Otimizar load de fontes Apple |

### Implicação 
- Continuamos com client-side fetching (Firestore SDK + custom hooks como `useReports`, `useWallet`)
- **Não** introduzir React Query/SWR ainda — over-engineering para escala atual
- Usar Suspense + `use(promise)` para streaming de dados que demoram (relatório gerando)
- Forms novos do fluxo de 6 passos: `useActionState` para estado + validation inline

---

## 2. Tailwind v4 — migração obrigatória? Ou ficar em v3?

### Estado atual do projeto
- Tailwind **3** com tokens CSS vars em [src/index.css](src/index.css)
- PostCSS plugin standard
- [tailwind.config.js](tailwind.config.js) define theme.extend

### Mudanças críticas em v4
| Aspecto | v3 (atual) | v4 (novo) |
|---|---|---|
| Config | `tailwind.config.js` (JS) | **`@theme` directive em CSS** (CSS-first) |
| Import | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| PostCSS plugin | `tailwindcss` | `@tailwindcss/postcss` |
| Vite plugin | (PostCSS) | `@tailwindcss/vite` (mais rápido) |
| Gradient utilities | `bg-gradient-to-*` | `bg-linear-to-*` |
| Border color default | `gray-200` | `currentColor` (atenção!) |
| Browser support | Sem mínimo estrito | **Safari 16.4+, Chrome 111+, Firefox 128+** |
| Engine | (PostCSS clássico) | **Oxide** (battle-tested em 2025-2026) |
| Custom utilities | Plugin API addUtilities() | CSS `@utility` |

### Recomendação: **migrar para v4 na Fase 1 (Design System)**

**Razão**:
- Stack moderna deve estar em v4 — usuário pediu "boas práticas mais modernas"
- Browser support adequado para nossa base (estatísticas BR: > 96% dos usuários em browsers compatíveis)
- Oxide engine é mais rápido (build 5-10× faster)
- CSS-first config alinha melhor com tokens semânticos do bundle (`tokens.css` é puramente CSS)
- Upgrade tool oficial automatiza maior parte da migração

**Risco**:
- Border default `currentColor` quebra layouts que dependiam de `gray-200` implícito (precisa audit)
- Plugins de v3 precisam reescrita

### Plano de migração
1. Rodar `npx @tailwindcss/upgrade@latest` (ferramenta oficial)
2. Audit visual no Storybook/showcase page
3. Migrar tokens CSS vars para `@theme` directive
4. Trocar PostCSS plugin → `@tailwindcss/vite` (Vite plugin é mais rápido)
5. Atualizar [biome.json](biome.json) se necessário

---

## 3. Apple SF Pro — implementação concreta

### Font stack validada (CSS Tricks + Apple Developer)
```css
@theme {
  --font-display: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                  "SF Pro Text", "Helvetica Neue", Helvetica, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono",
               Menlo, Monaco, Consolas, monospace;
}
```

### Por que stack nativa em vez de Google Fonts
- **Performance**: zero network request (system fonts já no device)
- **Brand**: Apple-style autêntico (não fake)
- **Tamanho do bundle**: -200KB sem `@fontsource/montserrat`

### Limitação
- Em Windows/Android, fallback para system-ui (Segoe UI, Roboto) — **não é SF Pro real**
- Aceitável: brand "Apple-style" no design ≠ exigir fonte Apple em todo device
- Para forçar SF Pro em outros OS, **Apple proíbe servir como webfont** (licença)

### Tokenizar typography como contract
```css
@theme {
  --text-display: 32px;
  --text-h1: 26px;
  --text-h2: 20px;
  --text-h3: 17px;
  --text-body: 15px;
  --text-small: 13px;
  --text-micro: 11px;

  --leading-display: 1.08;
  --leading-h1: 1.12;
  --leading-h2: 1.2;
  --leading-h3: 1.25;
  --leading-body: 1.45;
  --leading-small: 1.4;
  --leading-micro: 1.3;

  --tracking-display: -0.025em;
  --tracking-h1: -0.022em;
  --tracking-h2: -0.018em;
  --tracking-h3: -0.014em;
  --tracking-micro: 0.02em;
}
```

### SF Pro Variable — GRAD axis para dark mode (Apple 2024+)
- Apple adicionou eixo **GRAD** (Grade) na SF Pro Variable
- Ajusta peso visual sem mudar largura
- **Útil para dark mode**: peso maior no light, peso menor no dark (compensa contraste)
- Stack nativo já entrega isso no macOS/iOS — não precisamos nada extra

---

## 4. Zod v4 — schemas como source of truth

### Atualizações 2026 relevantes
- **Performance**: parsing de arrays grandes mais rápido
- **Bundle**: menor footprint
- **`z.email()` mais estrito**: RFC 5322 pattern (era looser em v3)
- API mostly compatible com v3 — migração não-breaking para a maioria

### Pattern source of truth confirmado
```ts
// packages/shared/src/schemas/report.ts
import * as z from 'zod'

export const BusinessTypeSchema = z.enum([
  'launch', 'local', 'evergreen', 'ecommerce',
  'content_distribution', 'remarketing', 'branding'
])
export type BusinessType = z.infer<typeof BusinessTypeSchema>

export const PlatformSchema = z.enum(['google_ads', 'meta_ads'])
export type Platform = z.infer<typeof PlatformSchema>

export const ReportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  platforms: z.array(PlatformSchema).min(1),
  businessType: BusinessTypeSchema,
  // ... etc
})
export type Report = z.infer<typeof ReportSchema>
```

### Firestore Converter Pattern (do projeto atual — manter)
- [src/schemas/firestore-converter.ts](src/schemas/firestore-converter.ts) já implementa `zodConverter`
- Usa Zod schema para parse no boundary Firestore → app
- **Manter este pattern** — está perfeito como source of truth

### Aplicação 
- TODO novo schema vai em `packages/shared/src/schemas/`
- Types via `z.infer<typeof Schema>`
- Nunca declarar `interface Foo` separado do schema — sempre `type Foo = z.infer<typeof FooSchema>`
- ADR-009 já fixa isso — manter

---

## 5. State persistence em wizard (FLOW-2 OAuth resume)

### Decisão técnica (justificada via WebSearch + UX best practices)
- **sessionStorage** para estado do wizard (não localStorage — limpa ao fechar tab)
- **URL state** (`?resume=true&step=2`) como pista de retomada
- **Validação obrigatória** ao retomar: se sessionStorage vazio → reseta para passo 1

### Por que não localStorage
- Não queremos retomar wizard de 1 semana atrás
- sessionStorage limpa ao fechar tab = comportamento esperado

### Por que não Firestore (server-side state)
- Wizard é ephemeral — não vale o overhead de salvar no DB
- Salva no DB só quando confirma geração (passo 4)

### Estrutura
```ts
// Salvar antes do redirect OAuth
sessionStorage.setItem('report-wizard-state', JSON.stringify({
  selectedPlatforms: ['google_ads', 'meta_ads'],
  step: 2,
  initiatedAt: Date.now(),
}))

// Na volta, em /generate-report/step-2?resume=true
const raw = sessionStorage.getItem('report-wizard-state')
if (!raw) navigate('/generate-report/step-1')
const state = JSON.parse(raw)
if (Date.now() - state.initiatedAt > 30 * 60 * 1000) {
  // estado velho — reseta
  sessionStorage.removeItem('report-wizard-state')
  navigate('/generate-report/step-1')
}
```

---

## 6. i18n — 3 línguas (pt-BR/en/es) obrigatórias

### Estrutura atual (manter + expandir)
- [src/locales/](src/locales/) com `pt-BR.json`, `en.json`, `es.json`
- [src/locales/types.ts](src/locales/types.ts) — tipo central
- [LanguageContext](src/contexts/LanguageContext.tsx) com `t(key)` API

### Aplicação 
- TODA string nova vai nos 3 arquivos
- Princípio: nenhum literal hardcoded no JSX/TSX
- Adicionar **lint check** para PR review: detectar strings literais em JSX (já tem Biome rule ou plugin custom)

### Pluralization e ICU
- Pacotes de créditos: "1 crédito" vs "2 créditos" precisa pluralização
- Hoje [LanguageContext](src/contexts/LanguageContext.tsx) parece simples (key-value) — verificar se suporta ICU MessageFormat
- Se não suportar: adicionar lib leve como `intl-messageformat` (já vem nativo no V8/JSC modernos)

---

## Sources

- [React 19 server components docs](https://react.dev/reference/rsc/server-components)
- [React 19 Server Components: Production Patterns 2026](https://dev.to/vikrant_bagal_afae3e25ca7/react-19-server-components-production-patterns-for-high-performance-apps-in-2026-3278)
- [Tailwind CSS Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind v4 Migration Best Practices 2026](https://www.digitalapplied.com/blog/tailwind-css-v4-2026-migration-best-practices)
- [Apple SF Pro / system font stack](https://css-tricks.com/snippets/css/system-font-stack/)
- [Apple Developer Fonts](https://developer.apple.com/fonts/)
- [Zod v4 schemas + Firestore Type-Safe](https://medium.com/@glorat/type-safe-firestore-with-typescript-and-zod-3ca9b0d05958)
- [Zod docs](https://zod.dev/api)
