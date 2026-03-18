/**
 * Smoke test: verifies the app loads and renders the basic UI structure.
 * Run with: npx playwright test e2e/smoke.spec.ts
 * Requires dev server running on localhost:8081
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

test.describe('App smoke test', () => {
  test('root redirects to inventory tab', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForURL(/\/inventory/);
    expect(page.url()).toContain('/inventory');
  });

  test('inventory screen shows content', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForURL(/\/inventory/);
    // Tab with "Inventory" should be selected
    const tab = page.getByRole('tab', { name: /Inventory/, selected: true });
    await expect(tab).toBeVisible();
  });

  test('all 4 tabs are present', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForURL(/\/inventory/);

    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible();

    const tabs = tablist.getByRole('tab');
    await expect(tabs).toHaveCount(4);
  });

  test('page title is Bike Bin', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle('Bike Bin');
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(BASE_URL);
    await page.waitForURL(/\/inventory/);
    await page
      .getByRole('tab', { name: /Inventory/, selected: true })
      .waitFor({ state: 'visible' });

    expect(errors).toHaveLength(0);
  });
});
