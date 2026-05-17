# docs/

This directory holds the project's living documentation. AI agents and engineers should read it before changing code.

## Reading order for newcomers

1. [../AGENTS.md](../AGENTS.md) — project overview, stack, conventions, what NOT to do.
2. [DOMAIN.md](DOMAIN.md) — business model: wallet, reports, billing.
3. [DATA-MODEL.md](DATA-MODEL.md) — Firestore shape (collections, subcollections, types).
4. [SECURITY.md](SECURITY.md) — security model (rules, secrets, admin claim).
5. [ENVIRONMENT.md](ENVIRONMENT.md) — environments and how to run locally.
6. [DEPLOYMENT.md](DEPLOYMENT.md) — auto-deploy and manual deploy flow.

## Full index

See [index.md](index.md) for the complete categorized map of every doc.

## How to add a doc

1. Pick the matching category in [index.md](index.md).
2. Create the file with a clear top-level heading.
3. Add a one-line entry to [index.md](index.md) under that category.
4. Cross-link from neighbouring docs if relevant.
5. If the doc records a decision, also add an ADR row to [Decisions.md](Decisions.md) and link both ways.

## How to record a change

Add a dated entry to [CHANGES.md](CHANGES.md) using the format `## [YYYY-MM-DD] — Title`. Append-only — never edit past entries.

## Conventions

- **One topic per doc.** Split files that grow past ~400 lines.
- **Stable filename style:** `Title-Case.md` for stable references, `Title.md` for project artifacts.
- **No duplication.** If two docs say the same thing, link instead of restating.
- **Code references** in markdown use `path/to/file.ts:42` (file:line) so editors can jump.
