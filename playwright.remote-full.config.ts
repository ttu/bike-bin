import { defineConfig } from '@playwright/test';

import { e2eBlocks } from './e2e/playwright-e2e-blocks';
import { requireRemotePlaywrightBaseUrl } from './src/test/playwrightRemoteBaseUrl';

const baseURL = requireRemotePlaywrightBaseUrl();

function resolveWorkers(): number {
  const raw = process.env.PLAYWRIGHT_WORKERS;
  if (raw === undefined || raw === '') return 2;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : 2;
}

/**
 * Full Playwright suite against a deployed URL. Does not run `global-setup` (no local psql/seed).
 * Use only when the target backend is disposable or acceptable to mutate (e.g. isolated preview DB).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  workers: resolveWorkers(),
  fullyParallel: false,
  retries: 1,
  projects: Object.entries(e2eBlocks).map(([name, files]) => ({
    name,
    testMatch: [...files],
  })),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
});
