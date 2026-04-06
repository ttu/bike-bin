import { defineConfig } from '@playwright/test';

const webPort = process.env.PLAYWRIGHT_WEB_PORT ?? '8090';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${webPort}`;
const isolatedPlaywright = process.env.PLAYWRIGHT_ISOLATED === '1';

/**
 * Dedicated config for marketing / App Store captures (not run by `npm run test:e2e`).
 * Viewport 430×932 at 3× scale → 1290×2796 PNGs (6.7" portrait slot).
 */
export default defineConfig({
  testDir: './e2e/media',
  timeout: 120_000,
  workers: 1,
  fullyParallel: false,
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL,
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    actionTimeout: 20_000,
  },
  expect: { timeout: 15_000 },
  projects: [{ name: 'store-media', testMatch: /store-assets\.spec\.ts$/ }],
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
    reuseExistingServer: !isolatedPlaywright,
    timeout: isolatedPlaywright ? 120_000 : 30_000,
    env: {
      ...process.env,
      RCT_METRO_PORT: webPort,
    },
  },
});
