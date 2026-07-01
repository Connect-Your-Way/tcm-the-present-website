# ADR-003 — Design tokens strategy: CSS custom properties in `tokens.css`

**Status:** Accepted  
**Date:** 2026-06-29  
**Milestone:** M01

## Context

The UI/UX designer produced a GUIDELINE.md (approved Phase 1) specifying a color palette, typography scale, and spacing system. Engineering needs a mechanism to consume these design decisions without coupling component styles to hard-coded values. The spec (§06 per-screen, F-07 color system) requires the design token system to be in place before any page components are built.

## Decision

All design tokens live in `src/styles/tokens.css` as CSS custom properties on `:root`. Components reference tokens via `var(--token-name)` — never raw hex, px, or rem literals in component `<style>` blocks.

Token categories:
- **Colors** — `--color-primary`, `--color-primary-dark`, `--color-accent`, `--color-bg`, semantic aliases (`--color-text-body`, `--color-text-heading`, `--color-border`, `--color-placeholder-bg`, `--color-placeholder-text`)
- **Typography** — `--font-display` (Cormorant Garamond), `--font-ko` (Noto Serif KR), `--font-sans` (Inter)
- **Type scale** — `--text-hero` through `--text-ui` using `clamp()` for fluid sizing
- **Spacing** — `--space-xs` (0.25rem) through `--space-3xl` (6rem) on a 0.25 rem base

`tokens.css` is imported once in `src/layouts/Layout.astro` via a CSS import statement, which Astro bundles into the global stylesheet.

## Consequences

**Positive:**
- Single point of truth for all design values — rebrand or palette update requires changes in one file only.
- The UI/UX designer's approved token names from GUIDELINE.md map 1:1 to CSS variable names, making Phase 2+ design handoffs mechanical.
- CSS custom properties cascade naturally to shadow DOM when/if web components are added.
- No build-time transform or CSS preprocessor required — plain CSS, zero tooling overhead.
- `prefers-reduced-motion` media query in `tokens.css` disables transition tokens globally — a11y handled at the token layer rather than per-component.

**Negative:**
- Custom properties have no TypeScript type safety — a typo in `var(--colr-primary)` silently falls through to the browser default rather than failing at build time.
- No token grouping / namespacing beyond naming convention — a larger project would benefit from a design-token build step (Style Dictionary, Theo) that validates the schema.

## Alternatives considered

- Sass/Less variables — rejected. Adds a preprocessor dep to the locked stack (STACK.md: plain Astro + Node); no tangible upside over CSS custom properties for this project size.
- Tailwind utility classes with a custom theme — rejected. The UI/UX designer's component approach uses semantic class names that map better to explicit CSS than utility classes.
- Inline style props on Astro components — rejected. Prevents reuse and breaks the designer-engineer contract established in GUIDELINE.md.
