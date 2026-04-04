import { defineConfig } from '@playwright/test';

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

/**
 * Disjoint spec groups so the runner can schedule work across multiple workers.
 * Each file appears in exactly one project (see e2e/*.spec.ts).
 */
const e2eBlocks = {
  'e2e-auth-smoke': [
    'smoke.spec.ts',
    'auth.spec.ts',
    'accessibility.spec.ts',
    'responsive.spec.ts',
  ],
  'e2e-search-inventory': [
    'search.spec.ts',
    'search-authenticated.spec.ts',
    'inventory.spec.ts',
    'inventory-authenticated.spec.ts',
    'inventory-gallery.spec.ts',
  ],
  'e2e-inventory-bikes': [
    'inventory-crud.spec.ts',
    'inventory-status.spec.ts',
    'bikes-crud.spec.ts',
  ],
  'e2e-messaging-borrow': [
    'messaging.spec.ts',
    'messaging-actions.spec.ts',
    'messages-authenticated.spec.ts',
    'borrow.spec.ts',
    'borrow-lifecycle.spec.ts',
    'profile-authenticated.spec.ts',
  ],
} as const;

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
