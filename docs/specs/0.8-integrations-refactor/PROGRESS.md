---
sprint-id: "0.8"
name: "integrations-refactor"
started: "2026-06-04"
status: in-progress  # in-progress | blocked | done
current-step: research  # research | plan | contract | implement | validate | ship
---

# Sprint 0.8 — integrations-refactor — PROGRESS

> Memory artifact (persiste entre sessions). Bootstrap script lê este arquivo PRIMEIRO ao iniciar nova session.
>
> **Regra crítica**: atualizar ANTES de compactar contexto ou encerrar sessão. Próxima session depende.

## Status

| Field | Value |
|---|---|
| Branch | `feat/...` |
| Last commit | `hash` — descrição curta |
| Tests | verde/red — link para output |
| Build | verde/red |
| Blockers | nenhum / lista |

## Sessions log

### 2026-06-04 — Session N: Fixes & Audit

- [x] Correção de botão "Demo" esquecido e referências `handleAddMockAccounts` removidas de `ProjectsPage.tsx`
- [x] Implementação i18n completa corrigida no arquivo `AccountSelectionModal.tsx` substituindo `react-i18next` por `useLanguage` 
- [x] Fix no TS erro 2345: `useLanguage` não aceita default values como em outros pacotes. Chaves (`newProjectDesc`, `orphanAccountsSubtitle`) adicionadas ao `pt-BR.json`, `en.json` e `es.json`
- [x] Removidos imports não utilizados de icons (`Database`) e utils (`addMockAccounts`) 
- [ ] Validação visual final pelo Chrome DevTools/Playwright 

**Saída para próxima session**: Validar visualmente o fluxo final.

## Decisions taken

Decisões não-óbvias que afetam a sprint. Cita razão:

- **Decisão**: … — **Razão**: … (referencia ADR ou research se aplicável)

## Blockers / risks

- **Blocker**: Nenhum
- **Risk mitigated**: O uso do i18n e a ausência de literais hardcoded, bem como falhas de typecheck foram corrigidas. 
- **Erros cometidos (Memória para evitar repetição)**: 
  1. Uso de import de bibliotecas que não estão configuradas no repo original (Ex: usar `useTranslation` do `react-i18next` no lugar do contexto nativo do projeto `useLanguage` importado de `@/contexts/LanguageContext`). A stack de i18n é custom (JSONs locais, hook próprio). 
  2. Esquecimento de hardcoded strings (Regra 7 de i18n violada): `t()` nativo do app só recebe a key. Uso incorreto de string como valor padrão dentro da função `t()` causa crash na build no CI.
  3. Esquecer features de dev / botões falsos (como MockAccounts / Demo) nas páginas ao limpá-las para produção. Importante varrer a tela inteira em busca desses lixos.

## Tests/build status

```text
bun run test --filter=@adsmart/shared    →  XXX/XXX verde
bun run typecheck                         →  verde
bun run build (functions)                 →  verde
```

## Next steps

1. Próxima ação concreta
2. …
