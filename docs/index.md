# Docs Index

Single map of every documentation file. Organized by category. Update this file whenever a doc is added, renamed, or removed.

## Project map (entry points)

| File | Purpose |
|---|---|
| [../README.md](../README.md) | Public-facing project overview, setup, scripts |
| [../AGENTS.md](../AGENTS.md) | Authoritative guide for AI agents and engineers — read first |
| [../CLAUDE.md](../CLAUDE.md) | Claude Code-specific guidance (skills, slash commands, memory pointer) |

## Foundation docs

| File | Purpose |
|---|---|
| [README.md](README.md) | Reading order and category map for the docs/ directory |
| [Decisions.md](Decisions.md) | Architectural Decision Records (ADRs) |
| [CHANGES.md](CHANGES.md) | Dated changelog (current quarter, parseable `## [YYYY-MM-DD]` headers) |
| [changelog/](changelog/) | Quarterly archives of CHANGES (older entries) |
| [UI-DESIGN.md](UI-DESIGN.md) | Design system reference (typography, colors, shadcn/ui inventory) |
| [FIREBASE-CONVENTIONS.md](FIREBASE-CONVENTIONS.md) | Firebase Conventions Pack inventory (commands, agents, hooks) |

## Domain & data

| File | Purpose |
|---|---|
| [DOMAIN.md](DOMAIN.md) | Business domain (wallet, reports, billing, currency conventions) |
| [DATA-MODEL.md](DATA-MODEL.md) | Firestore collections, subcollections, document shapes |
| [API-CONTRACTS.md](API-CONTRACTS.md) | Cloud Functions request/response contracts |

## Quality & ops

| File | Purpose |
|---|---|
| [SECURITY.md](SECURITY.md) | Security model: Firestore rules, secrets, admin claim, headers |
| [ERROR-HANDLING.md](ERROR-HANDLING.md) | Error boundaries, HttpsError codes, securityLogger usage |
| [TESTING.md](TESTING.md) | Test strategy, suites, fixtures, coverage targets |
| [QA-CHECKLIST.md](QA-CHECKLIST.md) | Manual QA checklist before release |
| [ACCESSIBILITY.md](ACCESSIBILITY.md) | A11y conventions, target levels, audit checklist |

## Environment & deployment

| File | Purpose |
|---|---|
| [ENVIRONMENT.md](ENVIRONMENT.md) | Environments table (dev/prod/local), env vars, GitHub secrets |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Auto-deploy flow, manual deploy, rollback |

## Domain integrations

| File | Purpose |
|---|---|
| [Integrations.md](Integrations.md) | Index of third-party integrations and their docs |
| [OAUTH.md](OAUTH.md) | Google Ads + Meta Ads OAuth flows (V2) |
| [PAYMENTS.md](PAYMENTS.md) | Payment providers — SuitPay (deprecated) → Asaas |
| [I18N.md](I18N.md) | i18n architecture, locale file format, contribution flow |

## Plans & research

| Path | Purpose |
|---|---|
| [REFACTOR-PLAN.md](REFACTOR-PLAN.md) | Historical: schema standardization plan (Phases A–E, completed 2026-04-26 → ADR-009/016/018) |
| [superpowers/specs/](superpowers/specs/) | Active design specs (work-in-progress) |
| [superpowers/plans/](superpowers/plans/) | Active implementation plans (work-in-progress) |
| [superpowers/archive/](superpowers/archive/) | Concluded specs/plans/notes — historical reference |

## Conventions

- Filenames are `Title-Case.md` for stable docs (`SECURITY.md`, `DATA-MODEL.md`) and `Title.md` for project artifacts (`Decisions.md`, `Integrations.md`).
- One topic per doc. If a doc grows past ~400 lines, split it.
- Cross-link liberally — short hops are better than restating.
- When you add a doc, add a row here in the matching section.
