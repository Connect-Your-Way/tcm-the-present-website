/**
 * src/lib/env.ts — environment accessor (§05 §4)
 *
 * Single entry point for all environment variables.
 * Validates required vars at module load; throws loudly on missing required
 * (per CLAUDE.md §2.8 fail-loud principle — Astro will not start without them).
 * Tests inject mocks via vi.stubEnv() + vi.resetModules() before re-importing.
 *
 * Two-accessor pattern in this codebase:
 *   - TypeScript lib files (e.g. resend.ts, validation.ts): import { env } from "./env.ts"
 *     and access via env.RESEND_API_KEY etc.  Uses process.env — works in Node SSR context.
 *   - Astro template files (.astro): use import.meta.env.VARIABLE directly (Vite-resolved,
 *     available at both build time and dev-server request time for public + optional vars).
 *     Do NOT import this module from .astro files — it would run requireEnv() at build time,
 *     requiring all secrets to be present for static prerendering of non-API routes.
 */

export type Env = {
  RESEND_API_KEY: string;
  CONTACT_EMAIL: string;
  PHONE_NUMBER: string;
  KAKAOTALK_URL: string;
  RESEND_FROM_ADDRESS: string;
  SITE_URL: string;
  NODE_ENV: "development" | "production" | "test";
};

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val || val.trim() === "") {
    throw new Error(
      `[env] Required environment variable "${name}" is missing or empty. ` +
        `Set it in .env.local (dev) or Fly.io secrets (production).`
    );
  }
  return val;
}

function optionalEnv(name: string, defaultValue: string): string {
  const val = process.env[name];
  return val && val.trim() !== "" ? val : defaultValue;
}

// Read once at module load; never re-read. Tests use vi.resetModules().
export const env: Env = {
  RESEND_API_KEY: requireEnv("RESEND_API_KEY"),
  CONTACT_EMAIL: requireEnv("CONTACT_EMAIL"),
  PHONE_NUMBER: optionalEnv("PHONE_NUMBER", "+61 4XX XXX XXX"),
  KAKAOTALK_URL: optionalEnv("KAKAOTALK_URL", "#"),
  RESEND_FROM_ADDRESS: optionalEnv("RESEND_FROM_ADDRESS", "onboarding@resend.dev"),
  // SITE_URL: production canonical base URL (no trailing slash).
  // Read via import.meta.env in .astro files; this entry is the source-of-truth declaration.
  SITE_URL: optionalEnv("SITE_URL", "http://localhost:3001"),
  // optionalEnv handles both undefined and empty-string cases (vi.stubEnv sets empty string)
  NODE_ENV: optionalEnv("NODE_ENV", "development") as Env["NODE_ENV"],
};
