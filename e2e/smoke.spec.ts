/**
 * Smoke test: verifies the app loads and renders the basic UI structure.
 * Run with: npm run test:e2e
 * Playwright starts Expo web on port 8090 by default (see e2e/playwright-web-env.ts).
 */
import { test, expect } from '@playwright/test';

test.describe('App smoke test', () => {
  test('page title is Bike Bin', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Bike Bin');
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await page.waitForURL(/\/(login|inventory)/);

    expect(errors).toHaveLength(0);
  });
});

test.describe('Unauthenticated flow', () => {
  test('root redirects to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('login screen shows app title and tagline', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);

    await expect(page.getByText('Bike Bin')).toBeVisible();
    await expect(page.getByText('From bikers to bikers')).toBeVisible();
  });

  test('login screen shows sign-in buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);

    await expect(page.getByRole('button', { name: /Continue with Apple/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with Google/ })).toBeVisible();
  });

  test('browse without signing in navigates to inventory', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);

    await page.getByRole('button', { name: /Browse without signing in/ }).click();
    await page.waitForURL(/\/inventory/);

    expect(page.url()).toContain('/inventory');
  });

  test('inventory tab shows 5 tabs after browse-in', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);

    await page.getByRole('button', { name: /Browse without signing in/ }).click();
    await page.waitForURL(/\/inventory/);

    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible();
    await expect(tablist.getByRole('tab')).toHaveCount(5);
  });
});
