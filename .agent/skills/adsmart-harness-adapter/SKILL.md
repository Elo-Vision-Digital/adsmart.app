---
name: adsmart-harness-adapter
description: Adapts the AdSmart Harness workflow and rules for Gemini, ensuring compliance with existing standards without duplicating rules. Activate this when operating within a sprint or assuming an agent role.
---

# AdSmart Harness — Gemini Adapter

You are operating within the **AdSmart Multi-Process Harness**. This project has extremely strict rules about agent isolation, constraints, and workflows originally designed for Claude. Your objective is to follow these rules perfectly using your native Gemini capabilities.

## 1. Source of Truth (Do NOT assume, READ first)
Before starting any task, you MUST consult the following canonical files. Do not duplicate their content; read them directly:
- [AGENTS.md](file:///Users/eduardorodrigues/Documents/Projetos/Meus/adsmart/adsmart/AGENTS.md) — The absolute source of truth for coding rules, architecture, and conventions.
- [docs/HARNESS-RUNBOOK.md](file:///Users/eduardorodrigues/Documents/Projetos/Meus/adsmart/adsmart/docs/HARNESS-RUNBOOK.md) — The canonical guide for the sprint workflow.

## 2. Dynamic Role Adoption
The harness uses distinct roles (`orchestrator`, `researcher`, `planner`, `implementer`, `validator`, `debugger`). These are defined in `.claude/agents/*.md`. 
**Do not invent the rules for these roles.** If the user asks you to assume one of these roles (e.g., "Atue como o implementer"):
1. Immediately use the `view_file` tool to read the corresponding file in `.claude/agents/<role>.md`.
2. Internalize the constraints specified in that file. For example, if you are the `validator`, you MUST NOT edit code, you only score it.
3. Translate the Claude tools (e.g., `Edit/Write`, `Bash`) to your Gemini equivalents (e.g., `replace_file_content`, `run_command`).

## 3. Workflow Adaptation for Gemini
Since you are using the Gemini IDE rather than the `Agent(...)` bash script:
- **Sprint Scaffolding**: Continue using the existing bash script (`bash scripts/harness/new-sprint.sh <id> <name>`) via the `run_command` tool to create sprints.
- **Contract Negotiation**: `docs/specs/{sprint-id}/CONTRACT.md` is sacred. You cannot edit source code until the contract has `status: locked`.
- **Cognitive Isolation**: The core philosophy of this harness is preventing "scope creep" and self-validation. When you switch roles (e.g., from `implementer` to `validator`), you must rigidly enforce the new boundaries. Do not "fix" code if you are validating. If validation fails, report `verdict: fail` in `EVALUATION.md` and STOP. 
- **Progress Tracking**: Always update `docs/specs/{sprint-id}/PROGRESS.md` before ending your turn (via the bash script `update-progress.sh` or by writing directly). This is critical for session continuity.
- **Acceptance Tests**: Always verify CONTRACT items using explicit bash commands (e.g. `bun run typecheck`). The score is binary (PASS/FAIL). "Looks good" is not a valid test.

By dynamically loading `.claude/agents` and strictly following `HARNESS-RUNBOOK.md`, you guarantee full compatibility with the project's standards without maintaining duplicate rules.
