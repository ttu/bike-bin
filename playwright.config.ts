import { defineConfig } from '@playwright/test';

import { e2eBlocks } from './e2e/playwright-e2e-blocks';

// Read env here (not from a separate module) so port/baseURL always match this process.
const webPort = process.env.PLAYWRIGHT_WEB_PORT ?? '8090';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${webPort}`;
const isolatedPlaywright = process.env.PLAYWRIGHT_ISOLATED === '1';

/** Parallel workers (default 4). Set PLAYWRIGHT_WORKERS=1 if shared DB / dev-user races cause flakes. */
function resolveWorkers(): number {
  const raw = process.env.PLAYWRIGHT_WORKERS;
  if (raw === undefined || raw === '') return 4;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : 4;
}

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  workers: resolveWorkers(),
  /** Tests in the same file stay serial; workers pull different files in parallel. */
  fullyParallel: false,
  globalSetup: './e2e/global-setup.ts',
  projects: Object.entries(e2eBlocks).map(([name, files]) => ({
    name,
    testMatch: [...files],
  })),
  use: {
    baseURL,
  },
  webServer: {
    command: [
      'node',
      'node_modules/expo/bin/cli',
      'start',
      '--web',
      '--port',
      webPort,
      ...(isolatedPlaywright ? ['--localhost'] : []),
    ].join(' '),
    url: baseURL,
    // Isolated runs must never attach to Metro from the primary clone.
    reuseExistingServer: !isolatedPlaywright,
    // Cold Metro + first web bundle can exceed 30s when no other dev server is warming the cache.
    timeout: isolatedPlaywright ? 120_000 : 30_000,
    // Metro reads RCT_METRO_PORT; CLI --port is not always enough for web.
    env: {
      ...process.env,
      RCT_METRO_PORT: webPort,
    },
  },
});
