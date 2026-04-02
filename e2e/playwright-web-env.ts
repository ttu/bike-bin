/**
 * Expo web port for Playwright E2E (default 8090) so `npm run dev` / `expo start` can keep 8081.
 * Playwright sets RCT_METRO_PORT to this value — Metro reads it; CLI `--port` alone is not enough for web.
 * Isolated E2E (`run-isolated-db-tests.sh`) sets **8091** + `PLAYWRIGHT_ISOLATED=1`; `playwright.config.ts` then uses `--localhost`,
 * `reuseExistingServer: false`, and a longer webServer timeout so Metro always starts in the worktree (no dependency on a dev server in the primary clone).
 * Override: PLAYWRIGHT_WEB_PORT, PLAYWRIGHT_BASE_URL, or `BIKE_BIN_ISOLATED_PLAYWRIGHT_PORT` (isolated script only).
 */
export const PLAYWRIGHT_WEB_PORT = process.env.PLAYWRIGHT_WEB_PORT ?? '8090';

export const PLAYWRIGHT_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PLAYWRIGHT_WEB_PORT}`;
