---
milestone_id: M02
title: "Home page (EN + KO)"
completed_at: "2026-06-29T14:05:00+00:00"
spec_refs:
  - "02-functional-description/tcm-the-present.md — F-02, F-06, F-07, F-08, F-09"
  - "05-api-backend/tcm-the-present.md — §8 (testimonials loader)"
  - "06-specifications-by-screen/01-home.md"
  - "07-data-flow/tcm-the-present.md — Flow 6"
code_paths:
  - "src/components/Hero.astro"
  - "src/components/BlobImage.astro"
  - "src/components/SectionBand.astro"
  - "src/components/Button.astro"
  - "src/components/CtaStrip.astro"
  - "src/components/CaseCard.astro"
  - "src/components/TreatmentCard.astro"
  - "src/components/TestimonialCard.astro"
  - "src/components/PlaceholderBlock.astro"
  - "src/components/PlaceholderImage.astro"
  - "src/content/clinical-cases.json"
  - "src/content/clinical-cases.ts"
  - "src/content/testimonials.json"
  - "src/content/testimonials.ts"
  - "src/content/clinical-cases.test.ts"
  - "src/content/testimonials.test.ts"
  - "src/pages/en/index.astro"
  - "src/pages/ko/index.astro"
  - "src/lib/i18n.ts"
  - "src/i18n/en/home.json"
  - "src/i18n/ko/home.json"
  - "src/i18n/en/images.json"
  - "src/i18n/ko/images.json"
  - "scripts/check-i18n-parity.mjs"
---

# M02 — Home page (EN + KO)

## What works now

Visitors landing on `/en/` or `/ko/` see the complete Home experience:

- **Hero section** — eyebrow pill + serif headline + subheadline + dual CTA buttons (Contact Us / Learn More) + blob-masked placeholder image (professional person silhouette, replaced with a real photo when sourced).
- **Social proof band** — five gold stars + bilingual trust statement ("Trusted by patients and families across Australian aged-care communities") on a soft green band.
- **Clinical Cases section** — 7 verified clinical cases rendered from `src/content/clinical-cases.json` (sourced from `Clinical case_260626_200412.docx`). Each card shows the English title + English summary. The Korean home page shows `titleKo` (which is the F-09 label "임상 사례 (한국어 번역 준비 중)") for each case — never an empty slot.
- **Testimonials section** — 3 expand/collapse accordion cards backed by `src/content/testimonials.json`. Each card has a "Demo" badge (F-09 placeholder pattern) and expands on click or Enter/Space; Escape closes.
- **10-primitive component library** — `Hero`, `BlobImage`, `SectionBand`, `Button`, `CtaStrip`, `CaseCard`, `TreatmentCard`, `TestimonialCard`, `PlaceholderBlock`, `PlaceholderImage` — closed set for M02; all downstream pages consume these without redefining design tokens.

Both locale pages build at compile time (`export const prerender = true`) and pass `pnpm build` with 8/8 routes prerendered.

## How it works

### Component architecture

Each of the 10 primitives is a focused single-responsibility Astro component:

- **`Hero.astro`** — accepts `eyebrow`, `headline`, `subheadline?`, `primaryCta`, `secondaryCta?`, `imageSrc?`, `imageAlt`. Renders `BlobImage` for the right column and two `Button` components for the CTA cluster.
- **`BlobImage.astro`** — three blob shapes selectable via `variant` prop (1–3); `placeholder={true}` renders an inline SVG person silhouette with `aria-label` from `imageAlt`; real image clips to the blob path via CSS `clip-path`.
- **`SectionBand.astro`** — full-width band with CSS variable–backed background variants: `"soft"` (`var(--color-bg-alt)`), `"accent"` (`var(--color-primary-mid)`), `"cream"` (`var(--color-bg-cream)`). Slots child content.
- **`Button.astro`** — link button; `variant` prop selects `"primary"` / `"secondary"` / `"ghost"` styling via a CSS class map; `min-height: 44px` enforced for touch compliance.
- **`CaseCard.astro`** — renders `<article>` with icon, title, and summary; locale-aware: `/ko/` receives `titleKo` and `summaryKo`.
- **`TestimonialCard.astro`** — accordion disclosure; `aria-expanded`/`aria-controls` wired; `<script>` toggles `hidden` on the full-text region and flips the chevron; Escape closes via `keydown` listener.
- **`PlaceholderBlock.astro` / `PlaceholderImage.astro`** — F-09 blocks; emit `data-placeholder="<id>"` attributes that the future CMS swap-script targets.

### Content loaders

`src/content/clinical-cases.ts` and `src/content/testimonials.ts` use static JSON imports (`import rawData from "./cases.json"`). Each loader validates schema at module load — required string fields, summary ≤ 140 chars — and throws on violation (fail-loud per §2.8). Vite bundles the JSON inline at build time; no `fs.readFileSync` in production.

### i18n static-import migration (M01 bug-fix applied during M02)

`src/lib/i18n.ts` was rewritten from `readFileSync` + `import.meta.url`-relative paths to 14 static JSON imports (7 EN + 7 KO namespaces). `readFileSync` failed after Vite/Rollup bundled the module — `import.meta.url` pointed to `dist/server/chunks/`, not `src/lib/`. Static imports are bundled inline; `loadLocaleBundle()` now returns pre-assembled module-level singletons in O(1). `scripts/check-i18n-parity.mjs` was updated to its own standalone `readFileSync` implementation (it runs pre-Vite as a `prebuild` step).

### i18n key structure

All 8 Astro components that read i18n use the namespaced dotted path convention: `common.nav.clinic`, `home.hero.headline`, `placeholder.phone_number`. The `getString(bundle, dottedKey)` function throws on any missing key, enforcing content completeness at build time.

## Acceptance evidence

| AC | Evidence |
|---|---|
| Hero block: eyebrow + serif headline + dual CTAs + blob image | `/en/` renders `<h1>Expert TCM Care, Brought to Your Door</h1>` and dual `.btn--primary` / `.btn--secondary` links; BlobImage placeholder visible |
| Social proof band | Star SVGs + trust statement present in rendered HTML |
| Clinical Cases: 7 cases from DOCX, EN text | `curl -sL http://localhost:3001/en/ \| grep -o '<article class="case-card' \| wc -l` → 7 |
| Korean side: "임상 사례" label (F-09, never empty) | `/ko/` contains "임상 사례" and "파킨슨" strings in rendered HTML |
| Testimonials: 3–4 expand/collapse cards with Demo badge | `<article class="testimonial-card">` count = 3; each has `class="testimonial-placeholder-badge"` |
| Footer: service-area note + KakaoTalk placeholder + copyright | `data-placeholder="kakaotalk-url"` and `data-placeholder="phone-number"` present on both locales |
| Design primitives — no per-page token re-declarations | All token usage is `var(--color-*)` and `var(--text-*)` referencing `tokens.css`; grep confirms no hard-coded hex values in component files |
| `data-placeholder` attributes discoverable via grep | `grep -r 'data-placeholder' src/` lists kakaotalk-url, phone-number, and testimonial Demo entries |
| `<h1>` count = 1 | Confirmed by grep on rendered /en/ and /ko/ HTML |
| All 8 routes return 200 | Production build: all 8 prerendered; `curl -sL -o /dev/null -w '%{http_code}'` returns 200 for all routes (redirects followed) |
| `pnpm build` passes | 30/30 Vitest tests + i18n parity check + all 8 routes prerendered — exit 0 |
| 30 Vitest tests pass | `pnpm test`: 4 test files, 30 tests, 0 failures |

## Known limitations

1. **Hero image is a placeholder** — the blob frame renders a person silhouette SVG. A real copyright-safe portrait (Unsplash/Pexels) will be integrated when sourced by the client; the `src` prop on `Hero.astro`→`BlobImage.astro` accepts any URL.
2. **Korean clinical case text pending** — all 7 Korean `summaryKo` fields contain the F-09 label "임상 사례 (한국어 번역 준비 중)". Translation will swap these strings in `clinical-cases.json` without touching component code.
3. **Testimonials are demo entries** — the 3 seeded cards carry `placeholder: true` and display a "Demo" badge. Real patient testimonials swap into `testimonials.json` before the 7 July demo without component changes.
4. **Testimonial accordion keyboard focus trap** — Escape closes the expanded panel and returns focus to the trigger button, but there is no explicit focus trap *within* the expanded panel. Sufficient for F-08 AC but a full WCAG 2.1 AA compliance audit may request refinement.
5. **`[WARN] clinical-cases.json must live in a content/... collection subdirectory`** — harmless Astro Content Collections warning (files are imported directly, not via the Collections API). Does not affect build output.
