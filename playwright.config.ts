import { defineConfig } from '@playwright/test';

// Read env here (not from a separate module) so port/baseURL always match this process.
const webPort = process.env.PLAYWRIGHT_WEB_PORT ?? '8090';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${webPort}`;
const isolatedPlaywright = process.env.PLAYWRIGHT_ISOLATED === '1';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  workers: 1,
  globalSetup: './e2e/global-setup.ts',
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
