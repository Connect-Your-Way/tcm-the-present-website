# ADR-001 — Astro output mode: `server` + per-page `prerender`

**Status:** Accepted  
**Date:** 2026-06-29  
**Milestone:** M01

## Context

Astro 4 deprecated the `output: "hybrid"` mode that was suggested in several planning docs. The project requires mostly static pages (marketing content) plus one server-side route (`POST /api/contact` for Resend email delivery). We need a single Astro configuration that supports both.

## Decision

Set `output: "server"` globally and opt individual pages into static pre-rendering via:

```typescript
export const prerender = true;
```

This is Astro 4's recommended pattern replacing the deprecated `hybrid` mode. The `POST /api/contact` route deliberately omits `prerender` and stays server-rendered.

## Consequences

**Positive:**
- All marketing pages (8 locale-prefixed routes) are statically pre-rendered at build time — fast CDN delivery, no server cold-start for visitors.
- Contact API route remains server-rendered, able to receive POST requests and call Resend at runtime.
- No adapter workaround required; `@astrojs/node` in `standalone` mode handles the hybrid shape cleanly.
- Future routes can choose static or dynamic per-page without changing global config.

**Negative:**
- `output: "server"` means any new page added without `export const prerender = true` defaults to SSR — the developer must remember to add it for static content.
- `@astrojs/node` standalone adapter is a required peer dep even though only one route needs SSR at M01.

## Alternatives considered

- `output: "static"` — rejected. Cannot serve the contact `POST` endpoint.
- `output: "hybrid"` — rejected. Deprecated in Astro 4; emits build warnings and will be removed in Astro 5.
