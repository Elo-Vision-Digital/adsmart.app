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
