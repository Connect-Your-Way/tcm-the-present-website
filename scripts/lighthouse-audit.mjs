#!/usr/bin/env node
/**
 * lighthouse-audit.mjs — M06 mobile performance audit
 *
 * Runs Lighthouse CLI in mobile mode against Home, Clinic, About, Contact
 * in both EN and KO locales (8 routes total). Asserts mobile performance
 * score ≥ 90 per M06 AC-8.
 *
 * Prerequisites:
 *   1. pnpm dev is running on localhost:3001 (start in a separate terminal).
 *   2. Google Chrome is installed (Lighthouse uses it via --chrome-flags).
 *   3. Run: pnpm test:lighthouse
 *
 * Lighthouse is installed as a devDependency (lighthouse@13.x) and invoked via
 * `pnpm exec lighthouse` — no npx network-fetch on each dispatch.
 * The audit writes per-route JSON reports to the system temp directory and
 * deletes them after reading the score.
 *
 * If a route scores below threshold, the script exits 1 with a clear
 * summary of failing routes and their actual scores.
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const execAsync = promisify(exec);

/** Routes to audit (M06 AC-8: Home, Clinic, About, Contact × EN + KO) */
const ROUTES = [
  { path: "/en/", label: "EN Home" },
  { path: "/ko/", label: "KO Home" },
  { path: "/en/clinic/", label: "EN Clinic" },
  { path: "/ko/clinic/", label: "KO Clinic" },
  { path: "/en/about/", label: "EN About" },
  { path: "/ko/about/", label: "KO About" },
  { path: "/en/contact/", label: "EN Contact" },
  { path: "/ko/contact/", label: "KO Contact" },
];

const BASE_URL = "http://localhost:3001";
const MIN_PERF_SCORE = 90;

/**
 * Audit a single route using Lighthouse CLI.
 * Returns { label, url, score, pass }.
 */
async function auditRoute(path, label) {
  const safeLabel = label.replace(/\s+/g, "-").toLowerCase();
  const outFile = join(tmpdir(), `lh-${safeLabel}-${Date.now()}.json`);
  const url = `${BASE_URL}${path}`;

  const chromeFlags = [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
  ].join(" ");

  // Use `pnpm exec lighthouse` (installed devDep) — avoids npx network-fetch per dispatch.
  const cmd = [
    "pnpm",
    "exec",
    "lighthouse",
    `"${url}"`,
    "--output=json",
    `--output-path="${outFile}"`,
    `--chrome-flags="${chromeFlags}"`,
    "--only-categories=performance",
    "--form-factor=mobile",
    "--screenEmulation.width=390",
    "--screenEmulation.height=844",
    "--screenEmulation.deviceScaleFactor=3",
    "--throttlingMethod=simulate",
    "--quiet",
  ].join(" ");

  try {
    // B-14 fix: forward CHROME_PATH (+ Playwright Chromium fallback) to the Lighthouse
    // subprocess so `pnpm test:lighthouse` works on the dev machine without system Chrome.
    // Resolution chain:
    //   1. CHROME_PATH env var (CI/Linux GHA runners set this explicitly)
    //   2. PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH (set by Playwright after `pnpm exec playwright install`)
    //   3. Hardcoded macOS dev-machine path (acceptable for a dev/CI script; never shipped to prod)
    // The devops-engineer will set CHROME_PATH in the GHA workflow at stage 6.
    await execAsync(cmd, {
      timeout: 120_000,
      env: {
        ...process.env,
        CHROME_PATH:
          process.env.CHROME_PATH ??
          process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
          "/Users/sc/Library/Caches/ms-playwright/chromium-1228/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
      },
    });
  } catch (err) {
    // Lighthouse exits non-zero when it generates a report with low scores;
    // the JSON file is still written. Only re-throw if the file wasn't created.
    if (
      !err.stdout?.includes("audit") &&
      !err.message?.includes("output-path")
    ) {
      // Check if file exists before giving up
      try {
        readFileSync(outFile);
      } catch {
        throw new Error(`Lighthouse failed on ${url}: ${err.message}`);
      }
    }
  }

  let lhr;
  try {
    lhr = JSON.parse(readFileSync(outFile, "utf8"));
  } catch (parseErr) {
    throw new Error(`Could not parse Lighthouse report for ${url}: ${parseErr.message}`);
  }

  try {
    unlinkSync(outFile);
  } catch {
    /* ignore cleanup errors */
  }

  const rawScore = lhr?.categories?.performance?.score ?? null;
  if (rawScore === null) {
    throw new Error(`Lighthouse report for ${url} is missing performance score`);
  }

  const score = Math.round(rawScore * 100);
  return { label, url, score, pass: score >= MIN_PERF_SCORE };
}

async function main() {
  console.log("📊 Lighthouse mobile performance audit");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Threshold: ≥ ${MIN_PERF_SCORE} (M06 AC-8)`);
  console.log(`   Auditing ${ROUTES.length} routes…`);
  console.log("");

  const results = [];

  for (const route of ROUTES) {
    process.stdout.write(`   ${route.label}… `);
    let result;
    try {
      result = await auditRoute(route.path, route.label);
    } catch (err) {
      console.error(`FAILED\n   Error: ${err.message}`);
      results.push({ label: route.label, url: `${BASE_URL}${route.path}`, score: 0, pass: false, error: err.message });
      continue;
    }
    const icon = result.pass ? "✅" : "❌";
    console.log(`${icon} ${result.score}`);
    results.push(result);
  }

  console.log("");

  const failed = results.filter((r) => !r.pass);

  if (failed.length === 0) {
    console.log("✅ All routes meet mobile performance threshold.");
    process.exit(0);
  } else {
    console.error(`❌ ${failed.length}/${results.length} routes failed the ≥ ${MIN_PERF_SCORE} threshold:`);
    for (const r of failed) {
      if (r.error) {
        console.error(`   ${r.label}: ERROR — ${r.error}`);
      } else {
        console.error(`   ${r.label}: ${r.score} (need ${MIN_PERF_SCORE})`);
      }
    }
    console.error("");
    console.error("Mitigation guidance (M06 AC-8 open question):");
    console.error("  • Check hero image format — convert to WebP/AVIF if PNG/JPG");
    console.error("  • Verify font preloading is active (Layout.astro <link rel=preconnect>)");
    console.error("  • Check for render-blocking scripts");
    console.error("  • Escalate to lead-engineer if score is in 87-89 range");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
