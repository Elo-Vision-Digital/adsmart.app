# Accessibility (a11y)

AdSmart's accessibility baseline, lint coverage, and review checklist. Target conformance: **WCAG 2.1 AA**.

## Current state (2026-04-25)

- **Lint:** Biome's `lint/a11y` rules are configured at `warn` level (see `biome.json` — e.g. `useButtonType`, `noSvgWithoutTitle`). Warnings show in `bun run lint` but do not fail CI.
- **Component library:** shadcn/ui components are built on Radix UI primitives, which ship accessible defaults (focus management, ARIA roles, keyboard nav). Reuse these — don't roll your own dialog/select/menu.
- **Document language:** `index.html` sets `lang="pt-BR"` and declares `<link rel="alternate" hreflang="...">` for pt-BR / en / es. Locale switching at runtime updates `<html lang>` via `LanguageContext`.
- **ARIA usage in code:** examples in `src/components/ui/AccountSelectionModal.tsx` (aria-label, aria-describedby).
- **Known gaps:** ~125 a11y warnings flagged by Biome at the time of Phase 5 verification (mostly missing button types, SVGs without titles, useless fragments). Cleanup is not yet a CI gate.

## Conventions

### Use the component library

Always prefer existing `src/components/ui/*` (Button, Dialog, Input, Label, Checkbox, Toast). They already handle:
- Visible focus rings
- Keyboard navigation
- ARIA roles/properties
- Screen reader announcements (Toast)

If you need a new primitive, check Radix UI before installing a new library.

### Forms

- Every input has a paired `<Label htmlFor="...">` (use `src/components/ui/label.tsx`).
- Validation messages are surfaced via `react-hook-form` errors; render them adjacent to the field with `aria-describedby` linking the input to the message.
- Required fields use `aria-required="true"` and `required`.

### Buttons and links

- `<button>` always has `type="submit" | "reset" | "button"` (Biome's `useButtonType` enforces this).
- Icon-only buttons require `aria-label`.
- Links that trigger actions (not navigation) should be buttons, not anchors.

### Images and SVG

- `<img>` requires meaningful `alt`. Decorative images use `alt=""`.
- Inline `<svg>` requires either `<title>` (for meaningful icons) or `role="presentation"` / `aria-hidden="true"` for decorative ones (Biome's `noSvgWithoutTitle`).

### Color contrast

The design tokens in `src/index.css` are designed for AA contrast in both light and dark themes. Never hardcode hex values — use the CSS variable utilities (`text-foreground`, `bg-surface`, etc. — see `CLAUDE.md` design system table). When introducing new colors, verify contrast against both themes with a contrast checker.

### Focus

- Never set `outline: none` without an alternative focus indicator.
- Modal/dialog open should trap focus (Radix's Dialog handles this).
- Modal close should return focus to the trigger.

### Motion

`framer-motion` animations should respect `prefers-reduced-motion`. New animated components must check this preference and disable or shorten transitions when set. Use Motion's `useReducedMotion()` hook.

## Audit checklist (before release)

Run through this when shipping a feature with UI changes:

- [ ] Tab through every interactive element in keyboard order — is it logical? Can you reach everything?
- [ ] Trigger every modal/dialog with keyboard — does focus trap? Does ESC close? Does focus return?
- [ ] Toggle theme (light/dark) — is contrast still AA on the new screens?
- [ ] Resize to 320px width — does it stay usable?
- [ ] Run `bun run lint` — review new a11y warnings introduced by this PR.
- [ ] If using a screen reader is feasible: VoiceOver (macOS) / NVDA (Windows) on the new screen — are labels announced correctly?
- [ ] Check `prefers-reduced-motion: reduce` (DevTools → Rendering) — animations respect it?
- [ ] Verify `<html lang>` matches the active locale.

## Cross-references

- [TESTING.md](TESTING.md) — automated testing covers behaviour, not a11y; manual audit is needed.
- [QA-CHECKLIST.md](QA-CHECKLIST.md) — pre-release manual QA includes a11y spot-checks.
- `CLAUDE.md` — design system tokens and component inventory.

## Roadmap

- Promote `lint/a11y` rules from `warn` to `error` once existing warnings are cleaned (likely Phase 2 or later).
- Consider adding `axe-core` automated checks to Vitest for component-level a11y testing.
- Add a Lighthouse accessibility budget to CI.
