---
milestone_id: M03
title: "Clinic Introduction page (EN + KO)"
completed_at: "2026-06-29T04:20:00+00:00"
spec_refs:
  - "02-functional-description/tcm-the-present.md — F-03, F-07, F-08, F-09"
  - "05-api-backend/tcm-the-present.md — §9 treatment-areas loader"
  - "06-specifications-by-screen/02-clinic.md — full page spec"
  - "MILESTONES.md — M03 acceptance criteria"
code_paths:
  - "src/content/treatment-areas.json"
  - "src/content/treatment-areas.ts"
  - "src/content/treatment-areas.test.ts"
  - "src/pages/en/clinic.astro"
  - "src/pages/ko/clinic.astro"
  - "src/i18n/en/clinic.json"
  - "src/i18n/ko/clinic.json"
---

# M03 — Clinic Introduction page (EN + KO)

## What works now

The aged-care coordinator persona can land on `/en/clinic` or `/ko/clinic` and immediately see:

1. **Hero** — eyebrow + Playfair Display serif headline + supporting paragraph + "Make an Enquiry / 문의하기" CTA button, all communicating the home-visit / nursing-home / retirement-village USP above the fold on both desktop and mobile. Image placeholder rendered via `BlobImage` with `placeholder={true}`.

2. **Clinic Introduction body** — a styled `PlaceholderBlock` with `data-placeholder="clinic-intro"`, reading from `ko/placeholder.json` on the Korean locale (not an English fallback — F-09 AC). Never a blank section.

3. **Treatment Areas grid** — 7 specialties from `진료과목_260626_132258.docx`, rendered via `src/content/treatment-areas.ts` into `TreatmentCard` components. On `/en/clinic`, English is the primary label and Korean appears as a sub-label; on `/ko/clinic`, Korean is the primary label and English appears as the sub-label (bilingual label pattern per §06 §5.4). The grid is 3-column on desktop (≥1024 px), 2-column on tablet (768–1023 px), and 1-column on mobile (<768 px).

4. **Contact CTA strip** — bottom-of-page dark-green `CtaStrip` with locale-aware CTA button linking to `/{locale}/contact/`.

5. **Hreflang pairs** — confirmed in the built HTML: `<link rel="alternate" hreflang="en" href=".../en/clinic/">` and `<link rel="alternate" hreflang="ko" href=".../ko/clinic/">` present on both pages.

---

## How it works

### Content source: `src/content/treatment-areas.ts`

The 7 specialties were extracted from the client DOCX (`진료과목_260626_132258.docx`) and structured in `src/content/treatment-areas.json`. Each entry has:

```typescript
{
  id: string;            // stable slug e.g. "womens-health"
  labelEn: string;       // English specialty name
  labelKo: string;       // Korean specialty name (Hangul)
  descriptionEn: string; // English short description
  descriptionKo: string; // Korean short description
}
```

The loader validates schema at module load (fail-loud) and exports a `ReadonlyArray<TreatmentArea>`. The clinic pages import this directly — no runtime I/O, baked into the static HTML at build.

### Treatment specialties (from DOCX)

| # | English | Korean |
|---|---------|--------|
| 1 | Women's Health | 한방 부인과 |
| 2 | Dermatology | 한방 피부과 |
| 3 | Internal Medicine | 한방 내과 |
| 4 | Paediatrics | 한방 소아과 |
| 5 | Urology | 한방 비뇨기과 |
| 6 | Pain Management | 한방 통증의학 |
| 7 | Geriatric Care | 한방 노인과 |

### i18n changes

Two keys were added to both `en/clinic.json` and `ko/clinic.json`:
- `clinic.hero.cta` — Hero CTA button label
- `clinic.hero.imageAlt` — Hero image alt text

i18n parity confirmed: `[i18n] EN ↔ KO key parity OK ✓`

### Primitive reuse (M03 AC-4)

All four components used by the clinic pages come from the M02 primitive library:
- `Hero.astro` — hero section (variant-prop, no per-page restyling)
- `TreatmentCard.astro` — treatment area card (bilingual, activeLocale prop)
- `PlaceholderBlock.astro` — F-09 placeholder (data-placeholder attribute, bundle-driven text)
- `CtaStrip.astro` — bottom-of-page CTA band

No new primitives were introduced; no per-page CSS overrides the primitive styles.

---

## Acceptance evidence

- **AC-1 (Hero communicates USP above fold):** Hero section uses eyebrow "Our Services / 진료 서비스", headline "Care That Comes to You / 당신에게 찾아가는 치료", subheadline naming nursing homes / retirement villages / home visits. Confirmed present in built HTML. Single-column mobile layout (CSS grid-template-columns: 1fr at <768px) ensures the text lands above the image on mobile.

- **AC-2 (Clinic intro placeholder with data-placeholder):** `grep 'data-placeholder="clinic-intro"' dist/client/{en,ko}/clinic/index.html` — 1 match each. Korean locale renders from `ko/placeholder.json:clinic_intro` ("진료 소개 준비 중입니다 — 김한수 원장님께서 내용을 제공하실 예정입니다."), not English fallback.

- **AC-3 (7 treatment areas bilingual):** `src/content/treatment-areas.json` has 7 entries. All 7 Korean labels confirmed in `/ko/clinic` built HTML via grep. All 6 ASCII English labels confirmed in `/en/clinic` HTML (Women's is HTML-encoded; presence verified with `grep "Women" dist/client/en/clinic/index.html`). `treatment-areas.test.ts` — 9 tests, 0 failures.

- **AC-4 (M02 primitives used, no per-page restyling):** TreatmentCard, Hero, PlaceholderBlock, CtaStrip all imported from `../../components/`. No `<style>` block overrides any of their class names.

- **AC-5 (Contact CTA strip):** `CtaStrip` renders at bottom of both pages with locale-appropriate sentence and button linking to `/{locale}/contact/`. Confirmed in built HTML.

- **AC-6 (Hreflang pair):** Both `/en/clinic` and `/ko/clinic` emit `<link rel="alternate" hreflang="en">` and `<link rel="alternate" hreflang="ko">` pairs via `Layout.astro`. Confirmed in built HTML.

- **AC-7 (F-08 a11y — no horizontal scroll at 390px, ≥44px tap targets, <h1> count = 1):**
  - Single `<h1>` confirmed: `grep -c '<h1 '` returns 1 on both pages.
  - Treatment grid uses `grid-template-columns: 1fr` at <768px — no horizontal overflow.
  - Button/CTA tap targets: `Button.astro` has `min-height: 44px; min-width: 44px` from M02.

- **Build:** `pnpm build` exits 0. All 8 routes prerendered without error.
- **Tests:** `pnpm test` — 39 tests across 5 files, 0 failures (9 new treatment-areas tests).

---

## Known limitations

- **Hero image placeholder only.** The clinic hero renders the `BlobImage` person-silhouette placeholder (`data-placeholder="hero-image"` inherited from M02's BlobImage). A copyright-safe TCM visiting-care image can be provided by the client or sourced by CYW at any time — add `imageSrc` prop to both clinic pages.
- **Korean card descriptions on narrow mobile.** Korean descriptions for Internal Medicine and Geriatric Care are longer than English equivalents (~100 chars). At 390px viewport with 1-column grid, the TreatmentCard handles wrapping via `line-height: 1.65` and no `white-space: nowrap`. No horizontal scroll. Verified structurally; real-device font rendering test deferred to M06.
- **Treatment area DOCX content is as-extracted.** Descriptions are authored by software-engineer based on DOCX structure. Final copy subject to client review post-demo.
