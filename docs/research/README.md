# Research Index — Fase -2 

**Concluída em**: 2026-05-19
**Propósito**: validar com docs atuais (Context7 + WebSearch) toda tecnologia/padrão que entra no [](..//).

> Regra do projeto: nenhuma proposta entra  sem pesquisa de boas práticas atuais. Esses documentos são a base.

---

## Documentos

| # | Documento | Aplicação  |
|---|---|---|
| 01 | [Firebase Stack](./01-firebase-stack.md) | Cloud Functions v2 (idempotência, structured logging, rate limits), scheduled tasks, Firestore data modeling, security rules |
| 02 | [LLM Strategy](./02-llm-strategy.md) | Anthropic Claude 4.6/4.5 + DeepSeek V4 — pricing, roteamento, caching, structured output |
| 03 | [Frontend Stack](./03-frontend-stack.md) | React 19 patterns para SPA Vite, Tailwind v4 migration, Apple SF Pro tokens, Zod v4 |
| 04 | [Share-link Patterns](./04-share-link-patterns.md) | Public Firestore reads via UUID v4, snapshot, OG via crawler detection |
| 05 | [PDF Generation](./05-pdf-generation.md) | Playwright em Cloud Functions (decidido vs Puppeteer/SaaS) |
| 06 | [OAuth Platforms](./06-oauth-platforms.md) | Google Ads v23.1 + MFA (abr/2026), Meta Marketing v23 |
| 07 | [Spec-Driven Development](./07-spec-driven-development.md) | AGENTS.md/CLAUDE.md modern patterns, harness multi-agent |
| 08 | [Stripe (FUTURE §8)](./08-stripe-future.md) | Pix BR via Payment Element + Checkout hosted (postponed mas validado) |
| 09 | [Harness Engineering](./09-harness-engineering.md) | Camada IA-coded — guides + sensors, multi-process agents, contracts, progress files (Fowler 2026 + GSD + Anthropic) |

---

## Decisões fechadas pela pesquisa

| GATE / Decisão | Status | Onde foi fechada |
|---|---|---|
| GATE-LLM-COMBO | ✓ Fechada | research/02 — Sonnet 4.6 anchor + Haiku 4.5 + DeepSeek V4 Flash |
| Tailwind v3 vs v4 | ✓ Migrar para v4 | research/03 |
| Apple SF Pro implementation | ✓ Stack nativa Apple | research/03 |
| Stripe Pix BR disponível? | ✓ Sim, Payment Element + Checkout | research/08 |
| PDF: Puppeteer vs Playwright vs SaaS? | ✓ Playwright | research/05 |
| Public share-link com token na URL? | ✓ UUID v4 + snapshot (sem token em rule) | research/04 |
| Cloud Scheduler vs Cloud Tasks vs Pub/Sub? | ✓ Cloud Scheduler via `onSchedule` | research/01 |
| AI Gateway/OpenRouter vs direct calls? | ✓ Direct calls iniciais | research/02 |
| Spec-Driven vs Harness Engineering? | ✓ Adotar HE como evolução do SDD | research/09 |
| Multi-agent vs Multi-process? | ✓ Multi-process (Implementer ≠ Validator) | research/09 |
| Contract pattern entre agentes? | ✓ Adotar (CONTRACT.md por sprint) | research/09 |
| Progress files entre sessions? | ✓ docs/specs/{sprint}/PROGRESS.md + bootstrap script | research/09 |

---

## Decisões ainda abertas (em GATEs )

| GATE | Status | Quando fechar |
|---|---|---|
| GATE-REFRESH | Híbrido auto + manual (X tempo a definir) | Fase 0 — definir intervalos com base em rate limits Google/Meta |
| GATE-REPORT-STRUCTURE | Colaborativo (eu pesquiso, user revisa) | Fase 0 — antes do FLOW-3 |
| GATE-DASHBOARD | Layout simplificado a desenhar | Fase 3 — antes do REF-2 |

---

## Próximos passos

1. **Você revisa esta pasta + os 3 docs principais** (, CURRENT-STATE-AUDIT, FUTURE-IDEAS)
2. **Aprovação** dispara **Fase -1** (schemas + API contracts)
3. **Fase 0** (harness/docs/skills) imediatamente após
4. **Fase 0.5+** (cleanup +  + refactor) em sequência

---

## Como manter este índice

- Adicionar entrada quando novo research for criado
- Atualizar "Decisões fechadas" quando GATE for resolvido
- Não confundir com `docs//` — aqui é **research/validation**, lá é **decision/plan**
