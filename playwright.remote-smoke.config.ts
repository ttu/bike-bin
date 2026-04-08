import { defineConfig } from '@playwright/test';

import { requireRemotePlaywrightBaseUrl } from './src/test/playwrightRemoteBaseUrl';

const baseURL = requireRemotePlaywrightBaseUrl();

/** Read-only smoke against shared staging/preview DB (no truncate/seed, no authenticated CRUD). */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  workers: 1,
  fullyParallel: false,
  retries: 1,
  testMatch: 'smoke.spec.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
});
