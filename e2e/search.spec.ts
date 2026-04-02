/**
 * Search E2E tests: guest users see a sign-in prompt (search RPC is authenticated-only).
 * Run with: npm run test:e2e
 * Playwright web server: default localhost:8090 (see e2e/playwright-web-env.ts).
 */
import { test, expect } from '@playwright/test';

async function navigateToSearch(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForURL(/\/login/);
  await page.getByRole('button', { name: /Browse without signing in/ }).click();
  await page.waitForURL(/\/inventory/);

  const tablist = page.getByRole('tablist');
  await tablist.getByRole('tab', { name: /Search/ }).click();
  await page.waitForURL(/\/search/);
}

test.describe('Search screen (guest)', () => {
  test('shows sign-in prompt instead of search', async ({ page }) => {
    await navigateToSearch(page);

    await expect(page.getByText('Sign in to search')).toBeVisible();
    await expect(
      page.getByText(
        'Create an account or sign in to discover parts and bikes from cyclists nearby.',
      ),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^Sign in$/ })).toBeVisible();
    await expect(page.getByPlaceholder('Parts, tools, bikes...')).toHaveCount(0);
  });

  test('sign-in button navigates to login', async ({ page }) => {
    await navigateToSearch(page);

    await page.getByRole('button', { name: /^Sign in$/ }).click();
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });
});

test.describe('Search tab navigation', () => {
  test('search tab is accessible from bottom navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);
    await page.getByRole('button', { name: /Browse without signing in/ }).click();
    await page.waitForURL(/\/inventory/);

    const tablist = page.getByRole('tablist');
    const searchTab = tablist.getByRole('tab', { name: /Search/ });
    await expect(searchTab).toBeVisible();

    await searchTab.click();
    await page.waitForURL(/\/search/);
    expect(page.url()).toContain('/search');
  });
});
