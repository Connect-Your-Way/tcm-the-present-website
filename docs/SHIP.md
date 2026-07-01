---
summary:
  line: "SHIP.md authored for tcm-the-present stage 6: localhost demo handoff on 7 Jul 2026 with Fly.io Phase-2 skeleton deferred via /edit-project; all 8 CLAUDE.md §3.3.4 sections satisfied"
  keywords: ["marketing-site", "deployment", "demo-first", "ship-md", "astro-i18n"]
  stage: 6
---

# tcm-the-present — SHIP.md (Operator Deployment Guide)

> **Scope of this document:** This file covers two phases.
> **Phase 1 (active)** — the localhost demo handoff running on the operator's
> MacBook for the **7 July 2026 client demo**. This is the deliverable for the
> current stage-6 close.
> **Phase 2 (deferred)** — production deployment to Fly.io. Phase 2 is explicitly
> out of scope for this pipeline run per `MILESTONES.md §Scope`. It reactivates
> via `/edit-project tcm-the-present` after the client signs off on the demo.
>
> Every section below leads with the Phase-1 (demo) answer and closes with a
> clearly-marked **Phase 2 — Fly.io skeleton** block for when that phase begins.

---

## 1. Prerequisites

### Software

| Tool | Version required | Notes |
|---|---|---|
| **Node.js** | `>=24.0.0` | Locked in `package.json` `engines.node`. Use `nvm use 24` or `fnm use 24`. Astro 4 + `@astrojs/node` require Node 18+; Node 24 is what the platform is locked to. |
| **pnpm** | `>=9.0.0` | Locked in `package.json` `engines.pnpm`. Install: `npm install -g pnpm@9`. |
| **git CLI** | any | To checkout commits for rollback. |
| **Playwright browser binaries** | auto-installed | Required for E2E + a11y tests. Run `pnpm exec playwright install chromium webkit` after `pnpm install`. |
| **Chrome / Chromium** | any | Required by `scripts/lighthouse-audit.mjs` (`pnpm test:lighthouse`). The script auto-detects via `CHROME_PATH`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, or the Playwright-managed binary. After `pnpm exec playwright install chromium`, the script finds it automatically — no manual `CHROME_PATH` required on the dev machine. |

### Environment variables

Copy `.env.example` → `.env.local` in `prod/projects/tcm-the-present/`. Fill in the values below. `.env.local` is gitignored (never committed).

| Variable | Required for demo? | Default in `.env.example` | Purpose |
|---|---|---|---|
| `RESEND_API_KEY` | **Yes** — set to a real key for email delivery | `re_xxxxxxxxxxxxxxxxxxxx` | Resend API key (free tier, sign up at resend.com). Without it the E2E happy-path test is skipped. The contact form loads and validates either way; real submission requires the key. |
| `CONTACT_EMAIL` | **Yes** | `placeholder@example.com` | Practitioner's inbox. Never rendered to HTML or API responses. Replace with Zacc Kim's real address. |
| `RESEND_FROM_ADDRESS` | Optional (has usable default) | `onboarding@resend.dev` | Resend sandbox sender. Works at demo; may trigger spam filters on some recipients (known limitation #1 below). Domain verification is deferred to Phase 2. |
| `PHONE_NUMBER` | Operator's call — see note | `"+61 4XX XXX XXX"` | Rendered on Contact page and header pill. Placeholder string triggers the F-09 "(to be confirmed)" UX. Set to the real number to show it during the demo. |
| `KAKAOTALK_URL` | Operator's call — see note | `#` | KakaoTalk deeplink rendered as a button on Contact + footer. `#` renders the "Coming soon / 준비 중" disabled state (F-09). Replace with the real URL to make the button live. |
| `SITE_URL` | Optional for demo | `http://localhost:3001` | Canonical base URL used in `<link rel="canonical">` and hreflang tags. Default is correct for the demo. Set to `https://<your-domain>` in Phase 2. |

> **Operator decision point (phone + KakaoTalk):** You have two acceptable paths
> for the 7 July demo:
> - **(a) Ship the placeholder UX** — leave `PHONE_NUMBER` and `KAKAOTALK_URL`
>   at their defaults. The site renders the "(to be confirmed)" / "Coming soon"
>   states, which are intentional and styled per F-09. The client sees these as
>   pending items.
> - **(b) Set real values** — add the real phone number and KakaoTalk URL to
>   `.env.local` before the demo. The contact page and header pill show the live
>   data. This is preferable if the numbers are confirmed.

---

## 2. Build command + expected artifact

### For the demo (Phase 1)

There are two ways to serve the site for the demo. **`pnpm dev` is recommended
for the demo day itself** (faster startup, no pre-build artefact needed); 
**`pnpm preview`** serves the production build and is the better smoke-test
signal before the client arrives.

#### Option A — Development server (recommended for demo day)

```bash
cd prod/projects/tcm-the-present
pnpm install
pnpm exec playwright install chromium webkit   # install test browsers once
cp .env.example .env.local                     # first time only
$EDITOR .env.local                             # fill RESEND_API_KEY + CONTACT_EMAIL
pnpm dev
# → http://localhost:3001
```

`pnpm dev` starts Astro's Vite-powered dev server. No build artefact is
produced — the server compiles pages on demand. This avoids the prebuild i18n
parity check blocking startup if bundles are slightly out of sync.

#### Option B — Production build + preview (recommended for pre-demo smoke)

```bash
cd prod/projects/tcm-the-present
pnpm install
pnpm exec playwright install chromium webkit   # install test browsers once
cp .env.example .env.local                     # first time only
$EDITOR .env.local                             # fill RESEND_API_KEY + CONTACT_EMAIL
pnpm build        # runs prebuild parity check → astro build
pnpm preview      # serves dist/ at http://localhost:3001
```

The `prebuild` step (`scripts/check-i18n-parity.mjs`) verifies EN and KO i18n
bundle keys are symmetric. If the build fails here, check `src/i18n/en.json` vs
`src/i18n/ko.json` — a missing or extra key in one bundle causes a non-zero
exit before Astro starts compiling.

#### Expected build artefact (`pnpm build` output)

| Path | Contents |
|---|---|
| `dist/` | Full build artefact |
| `dist/server/entry.mjs` | Standalone Node.js server entry (`@astrojs/node` standalone mode, ADR-001) |
| `dist/client/` | Static assets (CSS, JS chunks, fonts, images) |
| `dist/client/_astro/` | Astro-generated JS + CSS bundles with content-hashed filenames |

Build output size is modest: the site has no heavy client-side JS (Astro
server-rendered); expect `dist/` under 15 MB including fonts.

> **Phase 2 — Fly.io skeleton:** `pnpm build` produces the same `dist/`
> artefact. The Fly.io Docker image runs `node dist/server/entry.mjs` (or
> via the `fly.toml` `CMD`). Port binding: `@astrojs/node` honours the
> `HOST` + `PORT` env vars; Fly.io sets `PORT=8080` by default — the
> `fly.toml` must expose port 8080 and the Dockerfile must forward it.
> See Phase 2 step-by-step in §4.

---

## 3. Hosting target

### Phase 1 — localhost (demo)

| Field | Value |
|---|---|
| **Target** | Operator's MacBook, `http://localhost:3001` |
| **Account requirements** | None — fully local |
| **Region** | N/A (local) |
| **TLS** | None (localhost) |
| **Domain** | `localhost` |

### Phase 2 — Fly.io (deferred; reactivate via `/edit-project`)

| Field | Value |
|---|---|
| **Target** | Fly.io (platform lock: `shared/platform/STACK.md`) |
| **Account requirements** | Fly.io account (fly.io — free Hobby plan sufficient for a low-traffic clinic site) |
| **Recommended region** | `syd` (Sydney) — closest to Australian-based clinic and patients |
| **Machine size** | `shared-1x-512mb` (adequate for a static-ish SSR site at demo-level traffic; upgrade to `shared-1x-1024mb` if the Lighthouse CI run shows memory pressure during build) |
| **TLS** | Fly.io automatic Let's Encrypt (auto-provisioned, auto-renewed) |
| **Domain** | CYW-owned domain via Cloudflare DNS (domain registrar workflow per `STACK.md`) |
| **CI provider** | GitHub Actions (`STACK.md`-locked) |

---

## 4. Step-by-step deploy

### Phase 1 — Demo handoff (localhost, 7 July 2026)

**Do this the day before the demo — not the morning of.**

1. **Pull latest from main:**
   ```bash
   git pull origin main
   ```

2. **Install dependencies (including Playwright binaries):**
   ```bash
   cd prod/projects/tcm-the-present
   pnpm install
   pnpm exec playwright install chromium webkit
   ```

3. **Set environment variables** (first time only, or after `.env.example` changes):
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` in your editor. Set at minimum:
   - `RESEND_API_KEY` — your real Resend key (free tier at resend.com)
   - `CONTACT_EMAIL` — Zacc Kim's real inbox

   Optionally, if the phone number and KakaoTalk URL are confirmed:
   - `PHONE_NUMBER` — real number, e.g. `"+61 412 345 678"`
   - `KAKAOTALK_URL` — real deeplink URL

4. **Run the pre-demo test suite** (recommended; ~3 min):
   ```bash
   pnpm test                # Vitest unit tests (88 tests, ~5 s)
   pnpm test:e2e            # Playwright E2E (144 tests + 4 Resend skips, ~3 min)
   pnpm test:lighthouse     # Lighthouse mobile ≥ 90 on 8 routes (requires pnpm dev running)
   ```
   > For Lighthouse, start `pnpm dev` in one terminal first, then run
   > `pnpm test:lighthouse` in another. See §5 (Smoke tests) for expected results.

5. **Build the production bundle** (recommended smoke before the demo):
   ```bash
   pnpm build     # prebuild i18n parity check → astro build
   ```
   Build must complete clean. If the parity check exits non-zero, see §5 for diagnosis.

6. **Start the server** (choose one):
   ```bash
   pnpm preview   # production build at http://localhost:3001 (preferred smoke)
   # — or —
   pnpm dev       # dev server at http://localhost:3001 (preferred for demo day)
   ```

7. **Walk the demo URL list once** before the client arrives (§10 checklist for the full route list).

8. **Confirm the demo room setup:**
   - Laptop connected to projector / screen
   - Browser open at `http://localhost:3001/en/`
   - Wi-Fi not required (the site runs entirely locally) — but the Resend email delivery for
     the Contact form demo step does require internet; if the demo room has no internet,
     warn the client the contact form email won't deliver live (the inline success state still
     appears correctly)

---

### Phase 2 — Fly.io production deploy (skeleton — activate after client sign-off)

> **Preconditions:** client has approved the demo; CYW-owned domain has been
> registered; Cloudflare DNS is managing the domain; GitHub repo with the project
> code is accessible to the operator.

**Step 1 — Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

**Step 2 — Launch the Fly app (first deploy only):**
```bash
cd prod/projects/tcm-the-present
fly launch \
  --name tcm-the-present \
  --region syd \
  --no-deploy              # generate fly.toml first; review before first deploy
```
Edit the generated `fly.toml`:
- `[[services]]` → `internal_port = 8080` (Fly.io default `PORT`)
- `[build]` → `dockerfile = "Dockerfile"` (see note on Dockerfile below)
- Add `[env]` block with non-secret vars: `SITE_URL = "https://<your-domain>"`,
  `RESEND_FROM_ADDRESS = "no_reply@<your-domain>"` (update after domain verification)

**Dockerfile (create at project root for Phase 2):**
```dockerfile
FROM node:24-slim AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:24-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/server/entry.mjs"]
```

**Step 3 — Set runtime secrets (never in `fly.toml` or version control):**
```bash
fly secrets set \
  RESEND_API_KEY="re_your_real_key" \
  CONTACT_EMAIL="zacc@<your-domain>" \
  PHONE_NUMBER="+61 412 345 678" \
  KAKAOTALK_URL="https://open.kakao.com/o/..." \
  --app tcm-the-present
# SITE_URL and RESEND_FROM_ADDRESS go in fly.toml [env] (non-secret)
```

**Step 4 — First deploy:**
```bash
fly deploy --app tcm-the-present
```

**Step 5 — DNS wiring (Cloudflare DNS):**
After `fly deploy` completes, Fly.io provides a hostname (`tcm-the-present.fly.dev`
or the assigned IP via `fly ips list`).
- In Cloudflare DNS dashboard, add:
  - `CNAME www → tcm-the-present.fly.dev` (or the assigned `A` record)
  - `A @ → <fly ip>` for the apex domain (use Cloudflare proxy OFF until TLS is
    provisioned, then enable)
- Fly.io automatic Let's Encrypt provisions a TLS cert within ~2 minutes of the
  first HTTPS request hitting the Fly edge. No manual cert action required.

**Step 6 — Resend domain verification (DKIM + return-path):**
In the Resend dashboard → Domains → Add domain → follow the Cloudflare DNS step:
- Add the three DNS records Resend provides (TXT for SPF, CNAME for DKIM,
  CNAME for return-path tracking)
- Once verified (usually < 1 hour), update `RESEND_FROM_ADDRESS` in `fly.toml`
  `[env]` to `no_reply@<your-domain>` and redeploy: `fly deploy`

**Step 7 — GitHub Actions CI (Lighthouse gate):**
Add `.github/workflows/lighthouse.yml` at project root (Phase 2 dispatch item
per `docs/runbooks/known-demo-gaps.md` F-08 AC-8):
```yaml
name: Lighthouse CI
on: [push, pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 24 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install chromium
      - run: pnpm build
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          CONTACT_EMAIL: ${{ secrets.CONTACT_EMAIL }}
          RESEND_FROM_ADDRESS: "onboarding@resend.dev"
          SITE_URL: "http://localhost:3001"
      - name: Start preview server
        run: pnpm preview &
      - run: sleep 5  # wait for preview to bind
      - name: Run Lighthouse
        run: pnpm test:lighthouse
        env:
          CHROME_PATH: /usr/bin/google-chrome-stable
```
> Add `RESEND_API_KEY` and `CONTACT_EMAIL` as GitHub Secrets in the repo
> Settings → Secrets and variables → Actions.

---

## 5. Smoke tests post-deploy

### Phase 1 — Demo (local)

Run all three suites before the client arrives. Each must pass clean.

#### Unit tests (Vitest)

```bash
pnpm test
```

Expected: **88/88 pass** in ~5 s. Any failure is a regression — investigate
before the demo. The unit tests cover `src/lib/`: env validation, i18n parity
logic, Resend result mapping, contact-form validation rules.

#### E2E tests (Playwright)

```bash
pnpm test:e2e
```

Expected: **144 pass, 4 skip** (the 4 skips are the Resend happy-path tests guarded
by `test.skip(!process.env.RESEND_API_KEY, "configure .env.local to run")`). With
`RESEND_API_KEY` set in `.env.local`, all 148 tests pass.

The 6 spec files cover:

| File | What it checks |
|---|---|
| `smoke.spec.ts` | All 8 routes return 200; no console errors; single `<h1>`; hreflang pairs; root 302 → `/en/` |
| `language-toggle.spec.ts` | EN→KO and KO→EN round-trips on all 4 page pairs |
| `contact-form.spec.ts` | Validation errors, mocked 4xx service error, submit-disable, happy-path (skipped without API key) |
| `testimonial.spec.ts` | Keyboard expand/collapse (Enter/Space/Escape); ARIA wiring; EN + KO locales |
| `mobile.spec.ts` | 390px + 768px viewports; no horizontal scroll; tap targets ≥ 44px |
| `a11y.spec.ts` | axe WCAG AA (zero critical/serious) × 8 routes; alt-text audit; font-display:swap; skip link; focus rings |

#### Lighthouse mobile performance

```bash
# Terminal 1:
pnpm dev   # (or pnpm preview — either works as the target)

# Terminal 2:
pnpm test:lighthouse
```

Expected: all 8 routes score **≥ 90** on Lighthouse mobile performance.
Evidence from stage-5 iter-4: EN routes ~93–95 (after B-13 locale-conditional
font load fix), KO routes ~100.

If any route scores 87–89 (borderline), the primary culprits are:
- Gallery images: real images must be WebP/AVIF (per F-07 AC-1 pre-production checklist in `known-demo-gaps.md`)
- Hero image format or size
- Additional Google Fonts added after the locale-conditional fix

#### Manual spot-checks after test suite

1. Open `http://localhost:3001/` → confirm 302 redirect to `/en/`
2. Click the KO toggle in the header → confirm navigation to `/ko/`
3. Contact form → submit a test message → confirm inline success + Resend delivery
4. Testimonial on Home → expand one card → press Escape → confirm focus returns to trigger
5. Resize browser to 390px → confirm no horizontal scroll on all 4 pages

---

### Phase 2 — Fly.io production smoke

After `fly deploy` completes:

```bash
# Liveness probe:
curl -I https://<your-domain>/en/
# Expected: HTTP 200 or 302 from root → /en/

# Root redirect:
curl -I https://<your-domain>/
# Expected: 302 Location: /en/

# Contact API:
curl -s -X POST https://<your-domain>/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"Smoke","email":"smoke@example.com","message":"Smoke test"}' | jq .
# Expected: {"success":true} or {"success":false,"code":"EMAIL_SERVICE_ERROR"} (not a 500)
```

Run `pnpm test:e2e` with `PLAYWRIGHT_BASE_URL=https://<your-domain>` to run the
full E2E suite against the live host. Expect all 148 tests to pass (with real
`RESEND_API_KEY` from Fly secrets in scope for the E2E run via `--env`).

---

## 6. Rollback procedure

### Phase 1 — localhost demo

**Application rollback (git):**

```bash
# Identify the last known-good commit or tag:
git log --oneline -10

# Checkout the target:
git checkout <commit-sha-or-tag>

# Restart:
pnpm install   # in case package versions changed
pnpm dev       # (or pnpm preview after pnpm build)
```

**Content-only rollback** (if only `src/content/` or `src/i18n/` files changed):

```bash
# Revert a single content file:
git checkout HEAD~1 -- src/content/testimonials.json
# or:
git checkout HEAD~1 -- src/i18n/ko.json

# Restart dev server to pick up the change:
# (pnpm dev hot-reloads content changes automatically in most cases)
```

**Environment rollback** (if `.env.local` values need to revert):

```bash
# Open .env.local in editor and restore the previous value.
# The dev server picks up env changes automatically (Vite watches .env.local).
```

### Phase 2 — Fly.io production rollback

```bash
# List recent releases:
fly releases --app tcm-the-present

# Roll back to the previous release:
fly releases rollback --app tcm-the-present
# Fly.io rolls back to the last successful deploy atomically; no downtime.

# Per-secret rollback (if a Fly secret was changed and needs reverting):
fly secrets set RESEND_API_KEY="<previous-value>" --app tcm-the-present
# Fly.io applies the new secret value and restarts the machines.
```

---

## 7. Cost estimate

### Phase 1 — Localhost demo

**$0.** The site runs entirely on the operator's MacBook. No hosting, CDN, or
third-party services incur cost (Resend free tier is sufficient for the test
emails sent during development and the demo).

### Phase 2 — Fly.io production (indicative; verify against current Fly.io pricing at reactivation)

| Service | Tier | Monthly cost (indicative) |
|---|---|---|
| **Fly.io** — `shared-1x-512mb` machine | Hobby plan (1 × `shared-1x`) | ~$2 / mo (compute), ~$0.15/GB egress |
| **Cloudflare DNS** | Free plan | $0 |
| **Let's Encrypt TLS** (via Fly.io) | Automatic | $0 |
| **Resend** | Free tier — 3,000 emails/mo | $0 (until >3k/mo; unlikely for a low-traffic clinic site) |
| **GitHub Actions** | Free tier — 2,000 min/mo | $0 (a single Lighthouse CI run ~5 min/push; well within free quota) |
| **Total at expected traffic** | | **~$2–3 / month** |

> Notes:
> - If the site grows to need a persistent machine (vs Fly.io auto-start), cost
>   remains at the Hobby tier unless a custom domain apex CNAME is needed (requires
>   an A record, which is free on Cloudflare).
> - Gallery images served from `dist/client/` are included in Fly.io egress
>   pricing. At clinic-site traffic levels (<5 GB/mo), cost is negligible.
> - Resend Pro plan ($20/mo) is only needed if monthly contact-form submissions
>   exceed 3,000 — highly unlikely for this site.

---

## 8. Maintenance notes

### Phase 1 — During the demo period

- **`.env.local` stays gitignored.** Never commit it. If the MacBook is shared
  or replaced, re-create it from `.env.example` and re-fill the secrets.

- **Playwright browser binaries.** After any `pnpm update` that bumps
  `@playwright/test`, re-run `pnpm exec playwright install chromium webkit` to
  ensure browser binaries match the Playwright version.

- **Content edits (testimonials, i18n bundles).** CYW edits via PR:
  - `src/content/testimonials.json` — patient testimonials
  - `src/i18n/en.json`, `src/i18n/ko.json` — all UI strings (must stay in parity;
    the prebuild script enforces this)
  
  Workflow: `git pull` → edit → `pnpm build` (i18n parity check) → `pnpm test` → commit + PR → `git pull` on demo machine.

- **i18n parity.** If `pnpm build` fails with a parity error, run:
  ```bash
  node --experimental-strip-types scripts/check-i18n-parity.mjs
  ```
  The script lists the divergent keys. Add the missing key in the other locale's
  JSON file and rebuild.

### Phase 2 — Production operations

- **TLS cert renewal.** Fly.io handles Let's Encrypt renewals automatically via
  its edge. No operator action required.

- **Secret rotation (Resend API key).** Resend API keys do not expire unless
  manually revoked. If the key is ever revoked or leaked:
  ```bash
  fly secrets set RESEND_API_KEY="re_new_key_here" --app tcm-the-present
  ```
  Fly.io restarts the machine with the new secret automatically.

- **Resend domain verification re-check.** DKIM / return-path DNS records are
  set-and-forget. If Resend's dashboard shows "unverified" (e.g. after a DNS
  migration), re-add the three records (TXT + 2 CNAMEs) in Cloudflare.

- **Fly.io machine restarts.** Fly.io machines auto-restart on crash per the
  default `fly.toml` restart policy. Monitor via `fly logs --app tcm-the-present`.

- **Package updates.** Run `pnpm update` quarterly. After any major Astro or
  `@astrojs/node` version bump:
  1. Rebuild: `pnpm build`
  2. Run full test suite: `pnpm test && pnpm test:e2e && pnpm test:lighthouse`
  3. Redeploy: `fly deploy`

- **Gallery images (post-demo, before go-live).** Once real clinic/treatment images
  are sourced (per F-07 AC-1 in `docs/runbooks/known-demo-gaps.md`):
  - Format as WebP or AVIF for Lighthouse perf
  - Commit to `public/images/`
  - Update the gallery component to reference real assets
  - Re-run `pnpm test:e2e` and `pnpm test:lighthouse` to confirm ≥ 90 is maintained

---

## 9. Known limitations

See `docs/runbooks/known-demo-gaps.md` for the full audit trail. Key items:

| ID | Description | Impact on demo | Resolution path |
|---|---|---|---|
| **F-07 AC-1** | Gallery images: real images deferred; `PlaceholderImage.astro` renders in interim | Low — client sees styled placeholders, not broken layouts | Operator sources ≥ 4 WebP/AVIF images before production go-live (post-demo) |
| **F-08 AC-8** | Stage-6 GitHub Actions Lighthouse CI hookup deferred to Phase 2 | None — local `pnpm test:lighthouse` gate works | `devops-engineer` adds `.github/workflows/lighthouse.yml` in Phase 2 dispatch (skeleton in §4 above) |
| **TC-NEW-01** | WebKit skip-link Tab focus — possible timing edge case | None in real browsers; Playwright/WebKit emulation may flag intermittently | `tabindex="0"` defensive fix applied at `src/layouts/Layout.astro:67`; accepted by lead-engineer at gate-3 iter-4 |
| **Resend sandbox sender** | `onboarding@resend.dev` may land in spam for some recipients | Low — instruct client to check spam if contact form is demoed live | Resend domain verification (DKIM) deferred to Phase 2 |

---

## 10. Demo-day operator checklist

Copy-pasteable pre-demo verification list. Complete the day before (not the morning of).

```
[ ] git pull origin main
[ ] cd prod/projects/tcm-the-present
[ ] pnpm install
[ ] pnpm exec playwright install chromium webkit
[ ] .env.local exists and has real RESEND_API_KEY + CONTACT_EMAIL
[ ] Decide: set real PHONE_NUMBER + KAKAOTALK_URL in .env.local, or leave as placeholder UX (F-09)
[ ] pnpm build       — must complete with no errors (i18n parity + astro build)
[ ] pnpm test        — must be 88/88 pass
[ ] pnpm test:e2e    — must be 144 pass + 4 skips (or 148 pass if RESEND_API_KEY set)
[ ] Start pnpm dev in one terminal; run pnpm test:lighthouse in another → all 8 routes ≥ 90
[ ] Open http://localhost:3001/ → confirm 302 → /en/
[ ] Walk all 8 URLs once:
    http://localhost:3001/en/        http://localhost:3001/ko/
    http://localhost:3001/en/clinic/ http://localhost:3001/ko/clinic/
    http://localhost:3001/en/about/  http://localhost:3001/ko/about/
    http://localhost:3001/en/contact/ http://localhost:3001/ko/contact/
[ ] Click KO toggle on each page — confirm locale-preserving navigation
[ ] Expand a testimonial (keyboard: Enter, Space, Escape) on Home page
[ ] Submit contact form with a test email — confirm inline success state
[ ] Resize browser to 390px — no horizontal scroll on any page
[ ] Check that placeholder states are visible and styled (not broken):
    Hero image (blob/placeholder), Clinic intro (styled block), Profile photo (blob-frame),
    Practitioner bio (styled block), Phone number ("(to be confirmed)"), KakaoTalk ("Coming soon")
[ ] Demo room confirmed: projector / screen available, laptop charged
[ ] Fill in operator contact for on-demo queries in docs/milestones/06-tcm-the-present.md §"On demo day"
```

> **Note:** The site runs fully on localhost — no internet connection is required
> to serve pages. Internet IS needed for Resend email delivery (the contact form
> happy path), Google Fonts loading, and any external image CDN. If the demo room
> has no internet, warn the client that the contact form email won't arrive live
> (the inline success UI still renders correctly). The bilingual page content,
> testimonials, and language toggle do not require internet.

---

## Appendix A — File paths reference

| Path | Purpose |
|---|---|
| `prod/projects/tcm-the-present/.env.example` | Env-var schema (committed, no secrets) |
| `prod/projects/tcm-the-present/.env.local` | Real secrets (gitignored — create from `.env.example`) |
| `prod/projects/tcm-the-present/astro.config.mjs` | Astro 4 config (port 3001, i18n, node adapter) |
| `prod/projects/tcm-the-present/package.json` | Scripts, dependencies, engine constraints |
| `prod/projects/tcm-the-present/scripts/check-i18n-parity.mjs` | Prebuild parity check (fails `pnpm build` if EN/KO bundles diverge) |
| `prod/projects/tcm-the-present/scripts/lighthouse-audit.mjs` | Lighthouse mobile ≥ 90 gate (run `pnpm test:lighthouse`) |
| `prod/projects/tcm-the-present/src/i18n/en.json` | English i18n bundle |
| `prod/projects/tcm-the-present/src/i18n/ko.json` | Korean i18n bundle |
| `prod/projects/tcm-the-present/src/content/testimonials.json` | Patient testimonial data (CYW-maintained) |
| `prod/projects/tcm-the-present/tests/e2e/` | Playwright spec files (6 suites) |
| `prod/projects/tcm-the-present/docs/milestones/06-tcm-the-present.md` | M06 demo runbook (full URL list + walkthrough guide) |
| `prod/projects/tcm-the-present/docs/runbooks/known-demo-gaps.md` | Demo-phase gap audit trail (F-07, F-08, TC-NEW-01) |
| `prod/projects/tcm-the-present/docs/architecture/` | ADR-001 through ADR-004 |

---

## Appendix B — Architecture Decision Records (quick reference)

| ADR | Decision |
|---|---|
| ADR-001 | `output: 'server'` + per-page `prerender = true` (replaces deprecated `output: 'hybrid'` in Astro 4.9+) |
| ADR-002 | `resend@4.8.0` as the sole Resend SDK call site (`src/lib/resend.ts`) |
| ADR-003 | CSS custom properties in `src/styles/tokens.css` (no JS design-system dep) |
| ADR-004 | Vitest (unit) + Playwright (E2E) test split |

---

*Authored by: devops-engineer (stage 6, iter 1) — 2026-06-29T08:30:00+00:00*  
*Client: TCM The Present — Traditional Chinese Medicine bilingual marketing site*  
*Demo target: 7 July 2026 — operator: Zacc Kim — audience: client in-room*  
*Phase 2 (Fly.io production): reactivates via `/edit-project tcm-the-present` after client sign-off*

infra-touched: false
