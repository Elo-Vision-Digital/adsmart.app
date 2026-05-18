# Harness Modernization Implementation Plan

> **Status (2026-05-18):** ✅ **Executed and archived.** All 49 task-level checkboxes were never marked, but a code+filesystem audit on 2026-05-18 confirmed every intended outcome shipped: `docs/UI-DESIGN.md`, `docs/FIREBASE-CONVENTIONS.md`, `docs/changelog/2026-Q1.md`, `docs/superpowers/archive/` populated, CLAUDE.md trimmed to 63 lines (target <150), AGENTS.md at 108 lines (target ≤200), all named obsolete specs/plans/notes moved to archive. Plan was executed by parallel agent sessions; box-checking was skipped. Plan moved to archive after that audit confirmed completeness.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce token cost and entropy of the AI harness by consolidating AGENTS.md as canonical, slimming CLAUDE.md, rotating CHANGES.md, eliminating drift-prone Cursor rules, and archiving obsolete specs/plans/memories — all aligned with 2026-Q2 best practices (InfoQ Mar 2026 AGENTS.md research; Karaca 83% cost cut; Linux Foundation AGENTS.md standard).

**Architecture:** Single source-of-truth pattern. AGENTS.md owns project-wide rules; CLAUDE.md slimmed to Claude-only orientation (<150 lines); design system + Firebase Conventions detail moves to dedicated docs loaded on demand. CHANGES.md rotated quarterly. `.cursor/rules/` retained but minimized (Cursor reads AGENTS.md natively in 2026-Q2). Obsolete specs/plans/notes archived to `docs/superpowers/archive/`. No new tools introduced — pure consolidation.

**Tech Stack:** Markdown · git · bash · existing repo (no new deps)

**Sources informing this plan:**
- [InfoQ — AGENTS.md value review (Mar 2026)](https://www.infoq.com/news/2026/03/agents-context-file-value-review/)
- [Karaca — 42k tokens per conversation fix](https://medium.com/@cem.karaca/my-claude-md-was-eating-42-000-tokens-per-conversation-heres-how-i-fixed-it-85ffba809bd4)
- [agents.md (Linux Foundation)](https://agents.md/)
- [Anthropic — Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

---

## File structure

**Created:**
- `docs/UI-DESIGN.md` — design system reference (typography, color tokens, shadcn/ui inventory, animations). Moved out of CLAUDE.md.
- `docs/FIREBASE-CONVENTIONS.md` — Firebase Conventions Pack inventory (slash commands, agents, hooks, scripts). Moved out of CLAUDE.md.
- `docs/changelog/2026-Q1.md` — archived CHANGES entries from 2026-04 (everything from `## [2026-04-26]` down).
- `docs/changelog/README.md` — index pointing to per-quarter archives.
- `docs/superpowers/archive/README.md` — explains what lives in archive.
- `docs/ARCHITECTURE-DECISION-LOG.md` — NO. Not creating. (InfoQ Mar 2026 showed it doesn't help agents.)

**Modified:**
- `CLAUDE.md` — slim from 304 → ~150 lines. Keep: Claude-specific guidance (skills, slash commands relevant to Claude, memory system pointer). Remove: design system table, Firebase Conventions detail, repeated stack info.
- `AGENTS.md` — absorb the few items from CLAUDE.md that are tool-agnostic (e.g., "Editing Firestore document shapes" guidance, "Admin access" canonical pattern, "Cloud Function v2 baseline"). Verify length stays ≤200 lines.
- `docs/CHANGES.md` — trim to 2026-Q2 only (entries from `## [2026-05-01]` upward). Add header note pointing to `docs/changelog/2026-Q1.md`.
- `docs/index.md` — update links to point at new doc locations.
- `docs/REFACTOR-PLAN.md` — audit, then either delete (if obsolete) or update.

**Moved (git mv):**
- `docs/superpowers/specs/2026-04-24-adsmart-modernization-design.md` → `docs/superpowers/archive/specs/`
- `docs/superpowers/specs/2026-04-26-admin-dashboard-design.md` → `docs/superpowers/archive/specs/`
- `docs/superpowers/specs/2026-04-26-admin-ia-refactor-design.md` → `docs/superpowers/archive/specs/`
- `docs/superpowers/specs/2026-05-01-firebase-conventions-design.md` → `docs/superpowers/archive/specs/`
- `docs/superpowers/specs/2026-05-17-auth-flow-hardening-design.md` → `docs/superpowers/archive/specs/`
- `docs/superpowers/plans/2026-04-24-phase-*.md` (4 files) → `docs/superpowers/archive/plans/`
- `docs/superpowers/plans/2026-04-26-admin-*.md` (2 files) → `docs/superpowers/archive/plans/`
- `docs/superpowers/plans/2026-05-01-firebase-conventions-pack-plan.md` → `docs/superpowers/archive/plans/`
- `docs/superpowers/plans/2026-05-17-auth-flow-hardening-plan.md` → `docs/superpowers/archive/plans/`
- `docs/superpowers/notes/2026-05-17-auth-flow-hardening-execution-log.md` → `docs/superpowers/archive/notes/`
- `docs/superpowers/notes/2026-05-18-auth-hardening-handoff.md` → `docs/superpowers/archive/notes/`

**KEEP in active superpowers dirs** (work in progress, parallel chat):
- `docs/superpowers/specs/2026-05-18-functions-config-modernization-design.md`
- `docs/superpowers/plans/2026-05-18-functions-config-modernization-plan.md`
- `docs/superpowers/plans/2026-05-18-harness-modernization.md` (this plan)

**Deleted (memory):**
- `auth_hardening_continuation_2026_05_18.md` — feature shipped + handoff archived. Per its own "delete after harness lands" rule.
- `phase_5_status.md`, `phase_5_prereqs_done.md`, `phase_3_status.md` — phases concluded; ADRs are source of truth.
- `admin_subprojeto2_continuation.md` — if Subprojeto 2 shipped (verify in Task 8 before deleting).

**Untouched (validated by research):**
- `.claude/agents/` (3 agents — all Firebase-conventions-correct)
- `.claude/commands/` (4 commands — textbook PreToolUse + scaffolding)
- `.claude/hooks/` via settings.json (3 PreToolUse blockers = best practice)
- `.cursor/rules/` (8 mdc files — keep, but acknowledge they're hand-maintained; rule-porter migration is out of scope for this plan)
- `packages/shared/` (canonical schemas — ADR-016/018)

---

## Pre-flight checks

Before starting any task: confirm working tree is clean OR all dirty files are unrelated to this plan.

```bash
git status --short
```

Expected: either clean, or only files touched by parallel work (`docs/superpowers/{specs,plans}/2026-05-18-functions-config-modernization-*`, `.claude/agents/functions-security-reviewer.md`, `AGENTS.md` if parallel chat is editing it, `CLAUDE.md` if parallel chat is editing it, `docs/OAUTH.md`, `.cursor/rules/functions-config.mdc`). If anything else is dirty, stop and ask.

If parallel chat has uncommitted edits to AGENTS.md or CLAUDE.md, COORDINATE FIRST — do not stomp.

---

### Task 1: Extract design system reference into `docs/UI-DESIGN.md`

**Files:**
- Create: `docs/UI-DESIGN.md`
- Modify: `CLAUDE.md` (remove design-system section)

- [ ] **Step 1: Create `docs/UI-DESIGN.md` with extracted content**

Create the file with this content (extracted from CLAUDE.md lines covering Typography, Color tokens, shadcn/ui, Animations):

```markdown
# UI Design System — AdSmart

Reference for AdSmart's visual language. Loaded on demand by AI agents working on UI; not in default context.

## Typography

- **Font family**: Montserrat (400, 500, 600, 700) loaded from `@fontsource/montserrat`
- **Base**: `font-sans` in Tailwind → `Montserrat, system-ui, sans-serif`
- **Scale**: Use standard Tailwind text-xs through text-4xl; no custom size tokens

## Color tokens (CSS variables)

All colors use CSS variables defined in `src/index.css`. Use Tailwind utility names, not raw hex values.

| Token | Light | Dark | Tailwind class |
|---|---|---|---|
| `--background` | `#FFFFFF` | `#000000` | `bg-background` |
| `--surface` | `#FAFAFA` | `#0A0A0A` | `bg-surface` |
| `--text` | `#000000` | `#FFFFFF` | `text-foreground` |
| `--border` | `#E5E5E5` | `#1A1A1A` | `border-border` |
| `--muted` | `#666666` | `#999999` | `text-muted` |
| `--muted-foreground` | `#999999` | `#666666` | `text-muted-foreground` |
| `--primary` | `#000000` | `#FFFFFF` | `text-primary` / `bg-primary` |

Theme switching: `data-theme="dark"` on `<html>` (managed by `ThemeContext`).

## shadcn/ui components in use

| Component | File |
|---|---|
| Button | `src/components/ui/button.tsx` |
| Card | `src/components/ui/card.tsx` |
| Checkbox | `src/components/ui/checkbox.tsx` |
| Dialog | `src/components/ui/dialog.tsx` |
| Input | `src/components/ui/input.tsx` |
| Label | `src/components/ui/label.tsx` |
| Toast | `src/components/ui/toast.tsx` |

When adding new UI, prefer extending existing components. Do not install new Radix primitives without checking if the pattern already exists.

## Animations

Framer Motion is loaded as `framer-motion` (import from `framer-motion`). Custom Tailwind animations: `animate-slide-in`, `animate-slide-out`, `animate-fade-in-up`, `animate-fade-in`.
```

- [ ] **Step 2: Remove design-system section from CLAUDE.md**

Find the section starting with `## Design system` in CLAUDE.md and ending right before `## Contexts`. Delete the entire block. Replace with one line:

```markdown
## Design system

See [docs/UI-DESIGN.md](docs/UI-DESIGN.md).
```

- [ ] **Step 3: Verify CLAUDE.md still parses**

Run: `wc -l CLAUDE.md`
Expected: line count dropped by ~40 lines (was 304).

Run: `grep -c '^## ' CLAUDE.md`
Expected: section count dropped by ~3-4 (Design system, Typography, Color tokens, etc. were nested headers).

- [ ] **Step 4: Commit**

```bash
git add docs/UI-DESIGN.md CLAUDE.md
git commit -m "docs(harness): extract UI design system into docs/UI-DESIGN.md

Reduces CLAUDE.md context cost; design system loaded on demand.
Sourced from Karaca 2026 token optimization research."
```

---

### Task 2: Extract Firebase Conventions Pack reference into `docs/FIREBASE-CONVENTIONS.md`

**Files:**
- Create: `docs/FIREBASE-CONVENTIONS.md`
- Modify: `CLAUDE.md` (remove Firebase Conventions Pack inventory section)

- [ ] **Step 1: Create `docs/FIREBASE-CONVENTIONS.md`**

Extract the `## Firebase Conventions Pack` section from CLAUDE.md (slash commands table, agents table, hooks table, cursor mirror, helper scripts). Save to `docs/FIREBASE-CONVENTIONS.md` with this header:

```markdown
# Firebase Conventions Pack — AdSmart

Enforcement tooling for AdSmart's Firebase conventions. Loaded on demand by AI agents touching Firebase code.

Spec: [docs/superpowers/archive/specs/2026-05-01-firebase-conventions-design.md](superpowers/archive/specs/2026-05-01-firebase-conventions-design.md)

```

Followed by the exact content from CLAUDE.md's "Firebase Conventions Pack" section (slash commands, agents, hooks, cursor mirror, helper scripts subsections — all of it).

- [ ] **Step 2: Remove the section from CLAUDE.md**

Replace the entire `## Firebase Conventions Pack` block in CLAUDE.md with:

```markdown
## Firebase Conventions Pack

Enforcement tooling (slash commands, agents, hooks, cursor mirror). See [docs/FIREBASE-CONVENTIONS.md](docs/FIREBASE-CONVENTIONS.md).
```

- [ ] **Step 3: Verify**

```bash
wc -l CLAUDE.md
```
Expected: line count dropped by another ~50 lines.

- [ ] **Step 4: Commit**

```bash
git add docs/FIREBASE-CONVENTIONS.md CLAUDE.md
git commit -m "docs(harness): extract Firebase Conventions Pack inventory into dedicated doc

Slims CLAUDE.md per 2026-Q2 best practices (target ~150 lines)."
```

---

### Task 3: Slim CLAUDE.md further — remove redundancy with AGENTS.md

**Files:**
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md` (only if a section moves there)

- [ ] **Step 1: Audit CLAUDE.md for tool-agnostic content**

Read CLAUDE.md top-to-bottom. Flag each section as one of:
- **CLAUDE-ONLY**: keep (Claude-specific skills, slash commands, memory system pointer).
- **TOOL-AGNOSTIC**: should be in AGENTS.md.
- **REDUNDANT**: already in AGENTS.md, delete from CLAUDE.md.

Expected tool-agnostic sections to consider moving to AGENTS.md (verify before moving): "Editing Firestore document shapes", "Admin access (post-ADR-016)", "Cloud Function v2 baseline (post-ADR-016)", "CPF/CNPJ uniqueness + immutability (ADR-012)", "Password vs OAuth providers", "Auth flow conventions (post-ADR-020)", "Per-user state bootstrap", "Adding Firestore queries".

- [ ] **Step 2: For each TOOL-AGNOSTIC section, check if AGENTS.md already covers it**

```bash
grep -i "documentLocked\|reserveUserDocument\|isAdminUser\|refreshAuthState\|bootstrapUser" AGENTS.md
```

For each match: if AGENTS.md already covers it adequately, **delete from CLAUDE.md**. If not, move from CLAUDE.md to AGENTS.md (append to the relevant section).

- [ ] **Step 3: Apply moves and deletes**

For each section identified in Step 2:
- If moving: cut from CLAUDE.md, paste into AGENTS.md under the appropriate header.
- If deleting (redundant): just remove from CLAUDE.md.

Replace each removed section in CLAUDE.md with a single-line pointer if useful:
```markdown
See [AGENTS.md](AGENTS.md) for [topic].
```

Only add pointers when AGENTS.md genuinely covers it; otherwise just delete the redundant text.

- [ ] **Step 4: Verify target line counts**

```bash
wc -l CLAUDE.md AGENTS.md
```

Expected:
- CLAUDE.md: ≤150 lines (was ~200 after Tasks 1-2).
- AGENTS.md: ≤220 lines (was 107; may grow by ~50-100 from absorbed content — still under the 2026 best-practice cap if it stays under 250).

If AGENTS.md exceeds 250 lines, move the lower-priority absorbed content into a topic doc instead (e.g., `docs/AUTH.md`, `docs/ADMIN.md`).

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md AGENTS.md
git commit -m "docs(harness): deduplicate CLAUDE.md against AGENTS.md

Moves tool-agnostic conventions into AGENTS.md (canonical per Linux Foundation
2026 standard); CLAUDE.md retains Claude-specific guidance only.
Target: CLAUDE.md ≤150 lines, AGENTS.md ≤220 lines (Karaca/InfoQ 2026)."
```

---

### Task 4: Rotate CHANGES.md — archive Q1 entries

**Files:**
- Create: `docs/changelog/2026-Q1.md`
- Create: `docs/changelog/README.md`
- Modify: `docs/CHANGES.md`

- [ ] **Step 1: Create `docs/changelog/` directory and README**

```bash
mkdir -p docs/changelog
```

Create `docs/changelog/README.md`:

```markdown
# Changelog Archive

Quarterly archives of `docs/CHANGES.md`. Rotated when the active log exceeds ~500 lines or at quarter boundary, whichever comes first.

Current active log: [docs/CHANGES.md](../CHANGES.md)

## Archives

- [2026-Q1.md](2026-Q1.md) — January through April 2026

## Why archive?

Per Karaca 2026 ("My CLAUDE.md was eating 42k tokens"), every entry in CHANGES.md is paid per turn when the file is loaded into context. Archives keep history searchable for humans without paying the token cost on every agent turn.
```

- [ ] **Step 2: Find the cutoff line in CHANGES.md**

The cutoff is the first entry of 2026-Q1 (April). Find it:

```bash
grep -n "^## \[2026-04" docs/CHANGES.md | head -1
```

Expected output: a line number around 700-750 (the first `## [2026-04-XX]` entry).

- [ ] **Step 3: Extract Q1 entries to `docs/changelog/2026-Q1.md`**

Use `sed` to extract lines from the cutoff to end of file:

```bash
CUTOFF=$(grep -n "^## \[2026-04" docs/CHANGES.md | head -1 | cut -d: -f1)
echo "Cutoff line: $CUTOFF"
```

Create `docs/changelog/2026-Q1.md` with this header followed by extracted content:

```markdown
# Changes — 2026 Q1 (archived)

Archived from `docs/CHANGES.md` on 2026-05-18. Covers entries from 2026-04-26 through 2026-04-XX.

For current changes, see [docs/CHANGES.md](../CHANGES.md).

---

```

Then append the extracted lines (everything from `$CUTOFF` to EOF in CHANGES.md):

```bash
sed -n "${CUTOFF},\$p" docs/CHANGES.md >> docs/changelog/2026-Q1.md
```

- [ ] **Step 4: Truncate CHANGES.md to keep only Q2**

```bash
CUTOFF=$(grep -n "^## \[2026-04" docs/CHANGES.md | head -1 | cut -d: -f1)
PREV=$((CUTOFF - 1))
sed -i.bak "${CUTOFF},\$d" docs/CHANGES.md
rm docs/CHANGES.md.bak
```

- [ ] **Step 5: Add archive pointer to CHANGES.md tail**

Append to `docs/CHANGES.md`:

```markdown

---

## Older entries

For changes prior to 2026-Q2, see [docs/changelog/2026-Q1.md](changelog/2026-Q1.md).
```

- [ ] **Step 6: Verify**

```bash
wc -l docs/CHANGES.md docs/changelog/2026-Q1.md
```

Expected:
- `docs/CHANGES.md`: ~480-520 lines (was 1054, Q2 only).
- `docs/changelog/2026-Q1.md`: ~540-580 lines (Q1 entries + header).

```bash
grep -c "^## \[2026" docs/CHANGES.md
```

Expected: only `[2026-05-XX]` entries remain, none with `[2026-04-XX]`.

- [ ] **Step 7: Commit**

```bash
git add docs/CHANGES.md docs/changelog/
git commit -m "docs(harness): rotate CHANGES.md — archive 2026-Q1 entries

Keeps active changelog at ~500 lines per Karaca 2026 token research.
Q1 archive at docs/changelog/2026-Q1.md; pointer added to CHANGES tail."
```

---

### Task 5: Archive concluded specs/plans/notes

**Files:**
- Create: `docs/superpowers/archive/README.md`
- Move (git mv): multiple files into `docs/superpowers/archive/{specs,plans,notes}/`

- [ ] **Step 1: Create archive structure**

```bash
mkdir -p docs/superpowers/archive/specs
mkdir -p docs/superpowers/archive/plans
mkdir -p docs/superpowers/archive/notes
```

Create `docs/superpowers/archive/README.md`:

```markdown
# Superpowers Archive

Concluded specs, plans, and notes from completed feature work.

Active work-in-progress lives in:
- [../specs/](../specs/)
- [../plans/](../plans/)
- [../notes/](../notes/)

Why archive instead of delete? Specs and plans are post-mortem reference for "why did we build it this way?" — but they should not load into AI context by default. ADRs in `docs/Decisions.md` remain the canonical decision record; these files are the underlying work product.
```

- [ ] **Step 2: Move concluded specs**

```bash
git mv docs/superpowers/specs/2026-04-24-adsmart-modernization-design.md docs/superpowers/archive/specs/
git mv docs/superpowers/specs/2026-04-26-admin-dashboard-design.md docs/superpowers/archive/specs/
git mv docs/superpowers/specs/2026-04-26-admin-ia-refactor-design.md docs/superpowers/archive/specs/
git mv docs/superpowers/specs/2026-05-01-firebase-conventions-design.md docs/superpowers/archive/specs/
git mv docs/superpowers/specs/2026-05-17-auth-flow-hardening-design.md docs/superpowers/archive/specs/
```

- [ ] **Step 3: Move concluded plans**

```bash
git mv docs/superpowers/plans/2026-04-24-phase-1-cleanup-and-foundation.md docs/superpowers/archive/plans/
git mv docs/superpowers/plans/2026-04-24-phase-3-security.md docs/superpowers/archive/plans/
git mv docs/superpowers/plans/2026-04-24-phase-4-docs-ia.md docs/superpowers/archive/plans/
git mv docs/superpowers/plans/2026-04-24-phase-5-bun-turbo-autodeploy.md docs/superpowers/archive/plans/
git mv docs/superpowers/plans/2026-04-26-admin-dashboard-plan.md docs/superpowers/archive/plans/
git mv docs/superpowers/plans/2026-04-26-admin-ia-refactor-plan.md docs/superpowers/archive/plans/
git mv docs/superpowers/plans/2026-05-01-firebase-conventions-pack-plan.md docs/superpowers/archive/plans/
git mv docs/superpowers/plans/2026-05-17-auth-flow-hardening-plan.md docs/superpowers/archive/plans/
```

- [ ] **Step 4: Move concluded notes**

```bash
git mv docs/superpowers/notes/2026-05-17-auth-flow-hardening-execution-log.md docs/superpowers/archive/notes/
git mv docs/superpowers/notes/2026-05-18-auth-hardening-handoff.md docs/superpowers/archive/notes/
```

- [ ] **Step 5: Verify active vs archive split**

```bash
ls docs/superpowers/specs/ docs/superpowers/plans/ docs/superpowers/notes/
echo "---ARCHIVE---"
ls docs/superpowers/archive/specs/ docs/superpowers/archive/plans/ docs/superpowers/archive/notes/
```

Expected active (3 files total):
- `specs/2026-05-18-functions-config-modernization-design.md`
- `plans/2026-05-18-functions-config-modernization-plan.md`
- `plans/2026-05-18-harness-modernization.md` (this plan)
- `notes/` empty

Expected archive (≥13 files).

- [ ] **Step 6: Fix internal cross-references**

Search for any broken links to the moved files:

```bash
grep -rn "docs/superpowers/specs/2026-04\|docs/superpowers/specs/2026-05-01\|docs/superpowers/specs/2026-05-17\|docs/superpowers/plans/2026-04\|docs/superpowers/plans/2026-05-01\|docs/superpowers/plans/2026-05-17\|docs/superpowers/notes/2026-05-17\|docs/superpowers/notes/2026-05-18-auth" docs/ AGENTS.md CLAUDE.md 2>/dev/null || true
```

For each match: update path to include `archive/`. Example:
- Before: `docs/superpowers/specs/2026-05-01-firebase-conventions-design.md`
- After: `docs/superpowers/archive/specs/2026-05-01-firebase-conventions-design.md`

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/
git commit -m "docs(harness): archive concluded specs/plans/notes

Moves 13 concluded feature work products to docs/superpowers/archive/.
Active dirs now contain only WIP: functions-config-modernization +
harness-modernization (this plan).
Cross-references updated to archive paths."
```

---

### Task 6: Update `docs/index.md` and verify cross-doc links

**Files:**
- Modify: `docs/index.md`

- [ ] **Step 1: Read current `docs/index.md`**

```bash
cat docs/index.md
```

- [ ] **Step 2: Add entries for new docs**

Add references in the appropriate section of `docs/index.md`:

```markdown
## Reference docs

- [UI-DESIGN.md](UI-DESIGN.md) — design system (typography, colors, shadcn/ui inventory)
- [FIREBASE-CONVENTIONS.md](FIREBASE-CONVENTIONS.md) — Firebase enforcement tooling inventory

## Changelog

- [CHANGES.md](CHANGES.md) — current quarter
- [changelog/](changelog/) — archived quarters
```

Adjust to fit the existing section structure (don't blindly append — integrate).

- [ ] **Step 3: Lint cross-doc links**

```bash
grep -rn "docs/superpowers/specs/\|docs/superpowers/plans/\|docs/superpowers/notes/" docs/*.md AGENTS.md CLAUDE.md 2>/dev/null | grep -v "archive/" | grep -v "2026-05-18" || true
```

Expected: empty (every non-WIP reference now points to `archive/`).

If any matches, fix them.

- [ ] **Step 4: Commit**

```bash
git add docs/index.md
git commit -m "docs(harness): update index.md with new doc locations + changelog rotation"
```

---

### Task 7: Audit and resolve REFACTOR-PLAN.md

**Files:**
- Modify or Delete: `docs/REFACTOR-PLAN.md`

- [ ] **Step 1: Read REFACTOR-PLAN.md**

```bash
cat docs/REFACTOR-PLAN.md
```

- [ ] **Step 2: Assess relevance**

Apply this test: does any item in REFACTOR-PLAN.md describe work that is NOT yet shipped (verify against `docs/CHANGES.md` and `docs/Decisions.md`)?

- If YES (still relevant): convert to issues/ADRs, then delete or trim REFACTOR-PLAN.md to a one-paragraph pointer.
- If NO (all shipped): delete REFACTOR-PLAN.md outright. ADRs are source of truth for "why we did it."

- [ ] **Step 3a (if all shipped): Delete**

```bash
git rm docs/REFACTOR-PLAN.md
```

Remove any links to it from `docs/index.md`, `AGENTS.md`, `CLAUDE.md`:

```bash
grep -rn "REFACTOR-PLAN" docs/ AGENTS.md CLAUDE.md 2>/dev/null || true
```

For each match: delete the line or replace with reference to ADR.

- [ ] **Step 3b (if partially shipped): Trim**

Rewrite `docs/REFACTOR-PLAN.md` as a short index pointing to the relevant ADRs for completed items, and listing only the uncompleted ones with a status note.

- [ ] **Step 4: Commit**

```bash
git add -A docs/REFACTOR-PLAN.md docs/index.md AGENTS.md CLAUDE.md
# OR git add only files actually changed
git commit -m "docs(harness): resolve REFACTOR-PLAN.md (deleted/trimmed per audit)

ADRs in docs/Decisions.md are source of truth; freeform refactor plan
was redundant with shipped work."
```

---

### Task 8: Clean up transient memories

**Files:**
- Delete: multiple files in `/Users/eduardorodrigues/.claude/projects/-Users-eduardorodrigues-Downloads-Meus-Projetos-adsmart-app/memory/`
- Modify: `MEMORY.md` (remove pointers to deleted entries)

- [ ] **Step 1: Verify each candidate memory is safe to delete**

For each memory below, read its content and confirm the work it describes is shipped + the memory itself says "delete when X lands":

```bash
cd /Users/eduardorodrigues/.claude/projects/-Users-eduardorodrigues-Downloads-Meus-Projetos-adsmart-app/memory/
ls -la
```

Candidates to verify and delete:
- `auth_hardening_continuation_2026_05_18.md` — auth hardening shipped + handoff archived in Task 5. Memory's own note: "delete after harness/follow-ups land". This plan IS the harness phase. **Safe to delete after Task 5.**
- `phase_5_status.md` — Phase 5 shipped (Bun + Turbo + dual Firebase). **Safe to delete.**
- `phase_5_prereqs_done.md` — same. **Safe to delete.**
- `phase_3_status.md` — Phase 3 Security landed. **Safe to delete.**
- `admin_subprojeto2_continuation.md` — verify by checking `docs/CHANGES.md` for "Subprojeto 2" entries. If shipped: delete. If not: keep.

```bash
grep -i "Subprojeto 2" "/Users/eduardorodrigues/Downloads/Meus Projetos/adsmart-app/docs/CHANGES.md" | head -5
```

- [ ] **Step 2: Delete each verified-safe memory**

```bash
cd "/Users/eduardorodrigues/.claude/projects/-Users-eduardorodrigues-Downloads-Meus-Projetos-adsmart-app/memory/"
rm auth_hardening_continuation_2026_05_18.md
rm phase_5_status.md
rm phase_5_prereqs_done.md
rm phase_3_status.md
# Only delete admin_subprojeto2_continuation.md if Step 1 verified shipped
```

- [ ] **Step 3: Remove pointers from MEMORY.md**

Edit `MEMORY.md` and delete the corresponding lines (one line per deleted memory). Verify:

```bash
cd "/Users/eduardorodrigues/.claude/projects/-Users-eduardorodrigues-Downloads-Meus-Projetos-adsmart-app/memory/"
grep -c "auth_hardening_continuation\|phase_5\|phase_3_status\|admin_subprojeto2" MEMORY.md
```

Expected: 0 (or only the entries you decided to keep in Step 1).

- [ ] **Step 4: Verify MEMORY.md still under ~200 lines**

```bash
wc -l MEMORY.md
```

Expected: dropped by 4-5 lines (one per deleted memory pointer).

- [ ] **Step 5: No git commit needed**

Memory files live outside the repo (`~/.claude/projects/...`). They are user-local. Nothing to commit.

---

### Task 9: Add CHANGES.md entry for this harness modernization

**Files:**
- Modify: `docs/CHANGES.md`

- [ ] **Step 1: Add entry at top of CHANGES.md**

Prepend (after the file's intro/format conventions header, before the first existing entry) this entry:

```markdown
## [2026-05-18] — Harness modernization: AGENTS.md canonical, CLAUDE.md slim, CHANGES.md rotated

Aligned the AI harness with 2026-Q2 best practices to reduce per-turn token cost and eliminate drift.

**Why:** Karaca 2026 documented 83% cost reduction after slimming CLAUDE.md; InfoQ Mar 2026 showed monolithic "architecture overview" sections do not help agents; Linux Foundation adopted AGENTS.md (Dec 2025) as cross-tool standard. Our CLAUDE.md was 304 lines, CHANGES.md was 1054 lines — both heavy context tax on every turn.

**What changed:**

- `CLAUDE.md`: 304 → ~140 lines. Design system moved to `docs/UI-DESIGN.md`. Firebase Conventions Pack inventory moved to `docs/FIREBASE-CONVENTIONS.md`. Tool-agnostic conventions consolidated into AGENTS.md.
- `AGENTS.md`: absorbed tool-agnostic content; stays ≤220 lines (canonical per Linux Foundation 2026 standard).
- `docs/CHANGES.md`: rotated. Active log now Q2 only (~500 lines). Q1 archived to `docs/changelog/2026-Q1.md`.
- `docs/superpowers/{specs,plans,notes}/`: 13 concluded feature work products moved to `docs/superpowers/archive/`. Active dirs contain only WIP.
- Memories: deleted 4 transient continuation/status memories per their own "delete after X lands" rules.

**What did NOT change:**

- `.claude/agents/`, `.claude/commands/`, `.claude/settings.json` hooks: validated as best-practice in 2026-Q2 research; kept as-is.
- `.cursor/rules/`: kept (rule-porter migration deferred — out of scope here).
- ADRs in `docs/Decisions.md`: untouched (canonical decision record).
- `packages/shared/` canonical schemas: untouched.

**Plan:** [docs/superpowers/plans/2026-05-18-harness-modernization.md](superpowers/plans/2026-05-18-harness-modernization.md)
```

- [ ] **Step 2: Verify the entry parses**

```bash
grep -c "^## \[2026-05-18\] — Harness" docs/CHANGES.md
```

Expected: 1.

- [ ] **Step 3: Commit**

```bash
git add docs/CHANGES.md
git commit -m "docs(changes): record harness modernization (2026-05-18)"
```

---

### Task 10: Final verification

**Files:** none (read-only checks)

- [ ] **Step 1: Line counts within target**

```bash
wc -l AGENTS.md CLAUDE.md docs/CHANGES.md docs/UI-DESIGN.md docs/FIREBASE-CONVENTIONS.md
```

Expected:
- `AGENTS.md`: ≤220 lines
- `CLAUDE.md`: ≤150 lines
- `docs/CHANGES.md`: ~500 lines
- `docs/UI-DESIGN.md`: ~50 lines
- `docs/FIREBASE-CONVENTIONS.md`: ~60 lines

- [ ] **Step 2: No broken cross-references**

```bash
# Find any links pointing at moved-to-archive files that are NOT prefixed with archive/
grep -rn "superpowers/specs/2026-0[1-4]\|superpowers/plans/2026-0[1-4]\|superpowers/notes/2026-05-1[78]-auth" docs/ AGENTS.md CLAUDE.md 2>/dev/null | grep -v "archive/" | grep -v "/archive/" || echo "OK: no broken refs"
```

Expected: `OK: no broken refs`.

- [ ] **Step 3: Workspace builds clean**

```bash
bun run typecheck
```

Expected: pass (docs changes don't affect typecheck, but confirm we didn't break a hook by accident).

- [ ] **Step 4: Git status clean**

```bash
git status --short
```

Expected: clean, or only parallel-chat files unrelated to this plan.

- [ ] **Step 5: Print summary of changes**

```bash
git log --oneline HEAD~9..HEAD
```

Expected: 8-9 commits from Tasks 1-9 (Task 8 had no commit).

---

## Self-Review Summary

**Spec coverage:** All 4 priority items from the research recommendation are covered:
- 🔥 1 (AGENTS.md canonical + CLAUDE.md slim) → Tasks 1, 2, 3.
- 🔥 2 (CLAUDE.md ≤200 lines) → Tasks 1, 2, 3.
- 🔥 3 (CHANGES.md rotation) → Task 4.
- 🔥 4 (eliminate `.cursor/rules/` drift) → **NOT included** (rule-porter introduction is a new tool — out of scope; will revisit). Documented in plan rationale.
- Bonus: archive concluded specs/plans/notes → Task 5.
- Bonus: clean transient memories → Task 8.
- Audit REFACTOR-PLAN.md → Task 7.

**Symlink CLAUDE.md → AGENTS.md:** NOT done. The files genuinely diverge (CLAUDE.md has Claude-specific guidance — skills, slash commands, memory system). The hybrid pattern (AGENTS.md canonical for tool-agnostic + CLAUDE.md supplement for Claude-only) is validated by hivetrail.com 2026 as the recommended hybrid when content actually differs. A pure symlink would lose information.

**Placeholder scan:** No TBDs or "implement later" — every step has exact commands and exact content.

**Type consistency:** N/A (no code changes, only doc + git mv).

**Risk:** Task 3 (deduplicate CLAUDE.md vs AGENTS.md) is the highest-judgment task. If unsure during execution, prefer to leave a section in CLAUDE.md rather than move it incorrectly — it can always be moved in a follow-up.
