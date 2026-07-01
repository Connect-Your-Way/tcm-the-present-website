import { defineConfig } from "astro/config";
import node from "@astrojs/node";

// ADR-001: output: 'server' with per-page prerender = true
// Replaces deprecated output: 'hybrid' (Astro 4.9+)
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  // B-11: disable Astro 4 dev toolbar to prevent client-side h1 injection that pollutes
  // Playwright smoke tests running against the dev server (8 Chromium h1-count failures).
  // This is dev-only — the toolbar is never shipped to production. No security impact.
  devToolbar: { enabled: false },
  server: {
    port: 3001,
    host: "127.0.0.1",
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ko"],
    routing: { prefixDefaultLocale: true },
  },
  build: { format: "directory" },
  trailingSlash: "always",
});
