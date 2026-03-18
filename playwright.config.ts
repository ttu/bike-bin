import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8081',
  },
  webServer: {
    command: 'node node_modules/expo/bin/cli start --web --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
