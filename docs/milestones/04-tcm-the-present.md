---
milestone_id: M04
title: "About the Practitioner page (EN + KO)"
completed_at: "2026-06-29T04:38:00+00:00"
spec_refs:
  - "02-functional-description/tcm-the-present.md — F-04, F-07, F-08, F-09"
  - "06-specifications-by-screen/03-about.md — full page spec"
  - "MILESTONES.md — M04 acceptance criteria"
code_paths:
  - "src/pages/en/about.astro"
  - "src/pages/ko/about.astro"
  - "src/i18n/en/about.json"
  - "src/i18n/ko/about.json"
---

# M04 — About the Practitioner page (EN + KO)

## What works now

Prospective patients and their families can visit `/en/about` or `/ko/about` and see:

1. **Intro section** — eyebrow label + Playfair Display serif `<h1>` with the practitioner's name + a supporting intro sentence connecting the practitioner's background to his mobile / aged-care focus. Fully bilingual (EN/KO).

2. **Portrait + bio section** — two-column layout (portrait left ~40%, bio + qualifications right ~60%) on desktop; single-column (portrait above) on mobile 390 px. Profile photo rendered as a blob-frame `PlaceholderImage` with `data-placeholder="profile-photo"` on the wrapper and locale-appropriate alt text from `about.profilePhoto.altPlaceholder` (EN: "Photo of 김한수 원장 — coming soon" / KO: "김한수 원장님 사진 — 준비 중"). Bio and Qualifications sub-sections render as styled `PlaceholderBlock` components with `data-placeholder="practitioner-bio"` and `data-placeholder="practitioner-qualifications"`. Korean locale pulls strings from `ko/placeholder.json` — no English fallback (F-09 AC).

3. **Clinical philosophy section** — full bilingual text from `진료 철학_260626_174559.docx` extracted verbatim. 7 paragraphs in Korean (`/ko/about`) and 7 paragraphs in English (`/en/about`) — parity maintained by merging the two short conclusion paragraphs in the English DOCX into a single paragraph, matching the Korean paragraph count. Rendered in a soft-green `SectionBand` with Noto Sans KR on the Korean locale; `line-height: 1.9` on Korean text for the 60+ demographic (§06 §9). The philosophy content is the primary conversion asset — substantive, not a placeholder.

4. **Contact CTA strip** — bottom-of-page `CtaStrip` with locale-aware sentence and button, linking to `/{locale}/contact/`. Same pattern as Clinic page.

5. **Hreflang pairs** — provided by `Layout.astro` via the `currentPath="/about"` prop, which builds `<link rel="alternate" hreflang="en" href=".../en/about/">` and `<link rel="alternate" hreflang="ko" href=".../ko/about/">` on both pages.

---

## How it works

### i18n bundle updates (`src/i18n/{en,ko}/about.json`)

Both files updated from the M01 stub to include:

| Key | Purpose |
|-----|---------|
| `hero.intro` | Intro sentence below the `<h1>` |
| `hero.headline` | Updated to spec (EN: "김한수 원장 (Zacc Kim), TCM Practitioner") |
| `philosophy.body_1` … `body_7` | Full bilingual philosophy paragraphs |
| `profilePhoto.altPlaceholder` | Locale-appropriate alt text for portrait placeholder |
| `profilePhoto.altReady` | Alt text for when the real photo replaces the placeholder |
| `cta.sentence` | Bottom CTA sentence |
| `cta.buttonLabel` | CTA button label |

**Parity verified:** all 20 keys in `en/about.json` match `ko/about.json` exactly. Full cross-namespace parity (103 keys across 7 namespaces) confirmed via `assertParity()` logic before commit.

### Philosophy text extraction

The Korean philosophy text (7 paragraphs) was extracted from the DOCX file at `client_requirements/진료 철학_260626_174559.docx`. One obvious typo in the source was corrected: "앞애서도" → "앞에서도" (paragraph 5, body_5). No other content edits.

The English text (originally 8 paragraphs in the DOCX, including the "My Philosophy" header paragraph which was omitted as it is subsumed by the page's section heading) was restructured into 7 paragraphs by combining the two short concluding paragraphs (paragraphs 7 and 8: "Compassion allows us…" + "Throughout more than ten years…") into a single closing paragraph. This decision is documented here rather than escalated because:
- It is a content-reformatting choice, not a content change (no meaning is lost).
- The primary driver is i18n parity (EN and KO must have identical key structures for `assertParity()` to pass).
- Both languages' philosophy content is complete and meaningful.

### Page layout (§06 §2)

The About page uses a **custom intro section** (not the `Hero` component) for the introductory section. This decision was made because:
- The spec's layout diagram (§06 §2) shows no image in the hero/intro section — the image appears only in the portrait section below.
- Using the `Hero` component would render a person silhouette placeholder in the hero AND another in the portrait section — two blob-placeholders above the fold, which is confusing UX.
- The intro section only needs eyebrow + `<h1>` + intro sentence, which is lighter than the full `Hero` component's two-column image+text layout.

The `PlaceholderImage` primitive (from M02) is used in the portrait section, passing `altKey="about.profilePhoto.altPlaceholder"` to resolve the locale-appropriate alt text from the full bundle. `data-placeholder="profile-photo"` is on the wrapper per F-09.

### Accessibility (F-08, §06 §9)

- **One `<h1>` per page** — the intro section `<h1>` with the practitioner's name.
- **`<h2>` for Clinical Philosophy** — `about.philosophy.heading`.
- **`<h2>` / `<h3>` for portrait section headings** — bio heading is `<h2>`, qualifications heading is `<h3>` to maintain the correct heading hierarchy under the single `<h1>`.
- **Focus indicators** — `:focus-visible` rule in `global.css` provides `outline: 3px solid var(--color-accent)` on all interactive elements. The `Button` component in `CtaStrip` has explicit `:focus-visible` styles.
- **Skip link** — Layout.astro renders a skip-to-main link; keyboard users Tab to the CTA button without skipping interactive elements (only interactive element on the page body is the CtaStrip button — Header + Footer links are standard tab order).
- **Placeholder blocks** — `PlaceholderBlock` renders with `aria-label={text}` so screen readers describe the placeholder state meaningfully.
- **Korean philosophy text line-height** — `line-height: 1.9` on `.philosophy-para.font-ko` (exceeds the ≥1.6 minimum for the 60+ demographic, §06 §9).

### Noto Sans KR risk note

Korean characters in the philosophy text were confirmed renderable in Noto Sans KR (the font is loaded in Layout.astro from Google Fonts with `wght@400;500;700` weights). Full mobile device verification is deferred to M06 per the M04 risk section.

---

## Acceptance evidence

- **AC-1: Profile photo section** — `PlaceholderImage` renders with `data-placeholder="profile-photo"` on wrapper; EN alt: "Photo of 김한수 원장 — coming soon"; KO alt: "김한수 원장님 사진 — 준비 중". Confirmed via key lookup.
- **AC-2: Bio + qualifications F-09 placeholder blocks** — `data-placeholder="practitioner-bio"` and `data-placeholder="practitioner-qualifications"` present on `PlaceholderBlock` wrappers; Korean locale reads from `ko/placeholder.json` (not English fallback) because `PlaceholderBlock` is passed `bundle={bundle}` where bundle is `loadLocaleBundle("ko")`.
- **AC-3: Clinical philosophy full bilingual text** — 7 paragraphs in EN (`en/about.json` keys `philosophy.body_1..7`) and 7 paragraphs in KO (`ko/about.json` keys `philosophy.body_1..7`), directly from the DOCX source. English rendered on `/en/about`; Korean rendered on `/ko/about`.
- **AC-4: Layout matches Wellness Dental rhythm** — intro → portrait+bio → philosophy → CTA order; two-column portrait/bio on desktop; soft-green brand colours throughout; typography using `var(--font-display)` for headings and `var(--color-primary)` for eyebrow labels per `tokens.css`.
- **AC-5: Keyboard navigation + focus indicators** — global `:focus-visible` outline in `global.css`; Button component explicit `:focus-visible` styles; heading hierarchy `<h1>` → `<h2>` → `<h3>` correct; skip link in Layout.astro operative.
- **i18n parity** — `assertParity()` passes: all 103 keys across 7 namespaces match between EN and KO bundles (Python cross-check run during M04 implementation confirms this).

---

## Known limitations

- **Profile photo** — silhouette placeholder; real photo pending from client. CYW replaces the `PlaceholderImage` source (or uses `BlobImage` with `src={...}`) and removes `data-placeholder` in a post-demo content PR. No template changes required.
- **Bio and qualifications** — both placeholder blocks; real content pending from Dr Zacc Kim. Same swap mechanism as profile photo.
- **Korean philosophy DOCX typo** — "앞애서도" corrected to "앞에서도" (body_5). The correction is documented here; no change to any other content.
- **Noto Sans KR mobile verification** — full verification that Korean characters render correctly on physical Android/iOS devices is deferred to M06 per the build plan (M04 risk: "Korean philosophy text uses characters that the Noto Sans KR subset doesn't cover").
- **Philosophy paragraph count parity** — English DOCX has 8 paragraphs; restructured to 7 to match Korean (and maintain i18n key parity). The restructuring combined the two short concluding English paragraphs into one. This is documented as a content-formatting decision; no meaning is lost.
