---
name: adsmart-gemini-workflow
description: Translates the AdSmart HARNESS-RUNBOOK.md into native Gemini execution paradigms (Planning Mode, Artifacts). Activate this skill to manage a sprint lifecycle.
---

# Gemini Workflow para o Harness AdSmart

O `docs/HARNESS-RUNBOOK.md` descreve as fases da Sprint, criadas originalmente para execução bash/Python (`Claude Code`). Ao usar o Gemini (Antigravity), você deve mapear as fases da Sprint para o seu próprio sistema operacional (Planning Mode, Artifacts) conforme abaixo:

## Fase 1: Scaffold (Criar Sprint)
- **Ação:** Em vez de usar scripts python, use o terminal bash nativo.
- **Como fazer:** Execute `run_command` com `bash scripts/harness/new-sprint.sh <id> <name>`.
- Isso criará a pasta `docs/specs/{id}-{name}/` com `SPEC.md`, `CONTRACT.md`, `PROGRESS.md` e `EVALUATION.md`.

## Fase 2: Plan (Negociação do Contrato)
- **Ação:** O Planner e Implementer negociam os termos no `CONTRACT.md`.
- **Mapeamento Gemini:** 
  1. Leia o `SPEC.md`.
  2. Use o seu modo de planejamento nativo (`implementation_plan.md`) para sugerir os Itens do Contrato aos usuários.
  3. Preencha o `CONTRACT.md` local usando a ferramenta `replace_file_content`.
  4. Defina `status: locked` no frontmatter do Contrato **somente** quando o usuário aprovar sua sugestão via plano de implementação.

## Fase 3: Execute (Ondas de Implementação)
- **Ação:** O Orchestrator despacha o Implementer para resolver partes do contrato.
- **Mapeamento Gemini:**
  1. Crie o seu artefato interno `task.md` (lista de afazeres). 
  2. Preencha o `task.md` **exatamente** com as "waves" e itens atômicos definidos no `CONTRACT.md`.
  3. Vá atualizando o `[ ]` para `[x]` no seu `task.md` simultaneamente à evolução nos arquivos-fonte.
  4. Use a ferramenta `run_command` chamando o script `bash scripts/harness/update-progress.sh "<mensagem>"` constantemente após cada pequena vitória, blindando a memória.

## Fase 4: Validate (Sensores e Testes)
- **Ação:** O Validator revisa tudo de forma binária (PASS/FAIL).
- **Mapeamento Gemini:**
  1. Use `run_command` para disparar os sensores: `bun run lint && bun run typecheck && bun run test`.
  2. Verifique os testes de aceitação estritos. "Parece que tá bom" não é válido. O passe deve ser provado via script.
  3. Modifique o `EVALUATION.md` preenchendo as evidências e definindo as tags `verdict: pass` ou `verdict: fail`.
  4. Mapeie o resultado final num artefato de **Walkthrough** (`walkthrough.md`) para apresentar a conclusão resumida ao usuário no painel do chat.

## Fase 5: Ship (Entrega)
- Ao receber o status final `verdict: pass`, use as ferramentas de edição de código e bash command para adicionar a nota final no `PROGRESS.md`, certificar-se de realizar o `git commit`, e se instruído, realizar os comandos do GitHub CLI (`gh pr create`).
