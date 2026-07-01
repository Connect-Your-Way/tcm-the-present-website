# TCM Clinic the Present (선물 한의원) — Website Update Plan

**Project:** TCM Clinic the Present `7EA-0001`
**Client:** Dr. Han Soo Kim (한의사 김한수)
**Prepared by:** Connect Your Way (CYW)
**Date:** 2026-07-01
**Preview meeting:** Tue 2026-07-07, Canberra office

---

## 1. Current status

A first design preview was delivered to the client (bilingual EN / KO). It is a solid
visual foundation but was built from the **pre-meeting brief**, before the client
provided real content and gave feedback. It currently has:

- **Pages:** Home, Clinic Introduction (의원 소개), About the Practitioner (의사 소개),
  Testimonials (환자 후기), Contact (문의하기).
- **Palette:** green.
- **Branding:** placeholder text logo "TCM The Present"; Korean name "더 프레젠트 한의원";
  practitioner shown as "Zacc Kim".
- **Content:** AI-generated placeholder copy throughout — invented clinical cases,
  DEMO testimonials, "coming soon" placeholders for clinic intro / bio / qualifications /
  clinical philosophy. Phone number, KakaoTalk, and Instagram not wired up.
- **Service area:** stated as "across Australia".

The client has now provided the real content and images (see §4), and confirmed the
structural and branding decisions in the 1 July meeting.

> **Design note:** the client is happy with the current design and layout **exactly as
> is**. The only style change required is the **colour scheme** — everything else
> (typography, spacing, components, layout) stays. The goal is a single unified colour
> scheme across the whole site after the content/structure update.

## 2. Gap (preview vs. client requirements)

| Area | Preview has | Client requires |
|---|---|---|
| **Testimonials → Journal** | Testimonials page + Home block + demo reviews (with star ratings) | **Repurpose the Testimonials structure into The Present Journal** — reuse the same page/card/expandable layout, just **remove the star ratings**. Remove the demo reviews and the Home testimonials block. |
| **Clinical Case Library** | Static invented cases in a Home block | **New dedicated page** with the practitioner's real cases + disclaimer |
| **Home page cases block** | Invented clinical cases | Replaced by the **Treatment Areas** modality cards |
| **Clinic Introduction** | Thin placeholder | Filled with the **Home Visit Service** content |
| **About page** | Placeholders | Real Personal Story, Qualifications, and Clinical Philosophy |
| **Instagram** | — | **New Instagram link section** (Contact / header) |
| **Palette** | Green | **Sky-blue** (only style change — see design note above) |
| **Logo** | Text-only wordmark | Keep the wordmark; **add the real logo image to the LEFT of it** |
| **Korean name** | 더 프레젠트 한의원 | **선물 한의원** |
| **Practitioner name** | Zacc Kim | **한의사 김한수 / Han Soo Kim** |
| **Service area** | "across Australia" | **Sydney and Canberra** |
| **Contact channels** | KakaoTalk "coming soon", placeholder phone | Working KakaoTalk, real phone, email form kept |

## 3. What needs to be done

**Structural**
1. **Repurpose the Testimonials page into The Present Journal** — reuse the existing
   layout/card/expandable structure, remove the star ratings, drop the demo reviews.
   Also remove the Home testimonials block.
2. Rename the nav item Testimonials → **The Present Journal**.
3. Add a dedicated **Clinical Case Library** page.
4. Move the **Treatment Areas** modality cards from Clinic Introduction onto the Home page.
5. Rebuild **Clinic Introduction** around the Home Visit Service content.
6. Add an **Instagram** link section.
7. Drop the "Conditions We Treat" block (covered by the Home Visit "who benefits" content).

**Branding / global**
8. Re-skin palette green → **sky-blue** — this is the *only* style change; keep all other
   design as-is, aiming for one unified colour scheme site-wide.
9. Add the real logo image to the **left of the existing wordmark** (keep the text).
10. Global rename: Korean name → **선물 한의원**; practitioner → **한의사 김한수 / Han Soo Kim**
    (remove "Zacc Kim"); service area → **Sydney and Canberra**.

**Content population**
11. Populate Home, Clinic Introduction, About, Clinical Case Library, and Journal from the
    provided documents (see §4).
12. **Translations owed by CYW:** My Story EN→KO, Qualifications EN→KO, Clinical Cases KO→EN
    (English disclaimer to be included verbatim).
13. Wire up contact details once received.

**Pending from client (launch blockers)**
- Clinical Philosophy text.
- Phone number.
- Instagram handle / URL.
- KakaoTalk ID / link.

## 4. Contents we have and how they should be used

All source files live in
`CRM/Projects/TCM Clinic the Present 7EA-0001/Customer Provided Documents/`
(subfolders `Contents/`, `Journal/`, `Images/`).

> After this plan is approved, each document below will be turned into a single
> **per-document Markdown file** holding both the English and Korean versions side by
> side, so content can be copy-pasted straight into the build.

### Documents — `Contents/` and `Journal/`
| File | Language provided | Used on | Notes |
|---|---|---|---|
| `Home visit service .docx` | EN | **Clinic Introduction** page | Full page: who benefits / area / prep / process / FAQ |
| `방문진료.docx` | KO | **Clinic Introduction** page | Korean pair of the above |
| `My story .docx` | EN | **About** → Personal Story | CYW to translate → KO |
| `Qualifications & Credentials .docx` | EN | **About** → Qualifications | CYW to translate → KO |
| `임상사례.docx` | KO | **Clinical Case Library** page | 7 real cases + mandatory disclaimer; CYW to translate → EN |
| `첫 저널.docx` | EN + KO | **The Present Journal** → first entry | Already bilingual |

> **Service-area note:** the Home Visit documents currently state **Sydney** only. Per the
> client, the service area is **Sydney and Canberra** — Canberra must be added when the
> content is finalised (both EN and KO).

> **Clinical Case Library structure:** in `clinical-cases.md`, **each** `### Clinical Case …`
> (and its `### 임상 사례 …` counterpart) is a **self-contained case** that must render as
> its **own section / card** on the page — one case = one section, not a single running list.
> The 7 cases map 1:1 EN↔KO, and the disclaimer sits once at the end of each language block.

### Images — `Images/`
| File | Used on |
|---|---|
| `logo.png` | Header logo — placed to the **left of the existing wordmark** (text kept) |
| `brought_to_your_door.png` | Home hero |
| `acupuncture.png` | Home → Treatment Areas imagery |
| `clinical_philosophy.png` | About → Clinical Philosophy section |
| `clinical_case_library.png` | Clinical Case Library page |
| `the_present_journal.png` | The Present Journal page banner |
| `conditions_we_treat.png` | Spare — reuse as a Clinic Introduction section image |

### Resulting sitemap
1. **Home** — hero → Treatment Areas → CTA.
2. **Clinic Introduction (의원 소개)** — Home Visit Service.
3. **About (의사 소개)** — Personal Story → Clinical Philosophy *(pending)* → Qualifications.
4. **Clinical Case Library** *(new)* — real cases + disclaimer.
5. **The Present Journal** *(repurposed from Testimonials — same structure, no star ratings)* — journal entries.
6. **Contact (문의하기)** — email form + KakaoTalk + phone + Instagram.

## 5. Milestones

| # | Milestone | Depends on | Owner |
|---|---|---|---|
| **M1** | Approve this plan; create per-document EN/KO Markdown files | — | CYW |
| **M2** | Global branding pass — sky-blue palette, real logo, name/service-area renames | M1 | CYW |
| **M3** | Restructure nav & pages — repurpose Testimonials → Journal (reuse structure, drop star ratings), add Clinical Case Library, move Treatment Areas to Home, rebuild Clinic Introduction | M1 | CYW |
| **M4** | Populate content from the EN/KO Markdown files; CYW translations (My Story, Qualifications, Clinical Cases) | M2, M3 | CYW |
| **M5** | Wire contact channels (phone, KakaoTalk, Instagram) and Clinical Philosophy section | Client assets | CYW + client |
| **M6** | Internal QA — bilingual parity, links, disclaimer present on both case pages | M4, M5 | CYW |
| **M7** | Preview review with client (Tue 2026-07-07) | M6 | Both |
| **M8** | Sign-off → domain purchase → launch | M7 approval | CYW |

**Note:** M2–M4 can proceed now. M5 and full launch are gated on the four client-pending
items (clinical philosophy text, phone, Instagram, KakaoTalk).
