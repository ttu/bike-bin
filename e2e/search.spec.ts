/**
 * Search E2E tests: verifies search & discovery flows for unauthenticated users.
 * Run with: npm run test:e2e
 * Requires dev server running on localhost:8081
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

async function navigateToSearch(page: import('@playwright/test').Page) {
  await page.goto(BASE_URL);
  await page.waitForURL(/\/login/);
  await page.getByRole('button', { name: /Browse without signing in/ }).click();
  await page.waitForURL(/\/inventory/);

  // Navigate to Search tab
  const tablist = page.getByRole('tablist');
  await tablist.getByRole('tab', { name: /Search/ }).click();
  await page.waitForURL(/\/search/);
}

test.describe('Search screen', () => {
  test('shows search bar and initial empty state', async ({ page }) => {
    await navigateToSearch(page);

    // Search bar should be visible
    await expect(page.getByPlaceholder('Parts, tools, bikes...')).toBeVisible();

    // Initial empty state
    await expect(page.getByText('Find what you need')).toBeVisible();
    await expect(
      page.getByText('Search for parts, tools, or bikes from cyclists nearby'),
    ).toBeVisible();
  });

  test('shows distance selector', async ({ page }) => {
    await navigateToSearch(page);

    await expect(page.getByText(/within \d+ km/)).toBeVisible();
  });

  test('shows no results state after searching with no data', async ({ page }) => {
    await navigateToSearch(page);

    const searchInput = page.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('zzzznonexistent999');
    await searchInput.press('Enter');

    // Should show no-results empty state (no items in local DB)
    await expect(page.getByText('No items found nearby')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Try increasing your distance or changing filters.')).toBeVisible();
  });

  test('shows quick filter chips after searching', async ({ page }) => {
    await navigateToSearch(page);

    const searchInput = page.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('bike');
    await searchInput.press('Enter');

    // Quick filter chips should appear after search
    await expect(page.getByText('Borrow', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Donate', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Sell', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Filters')).toBeVisible();
  });

  test('initial empty state disappears after submitting a query', async ({ page }) => {
    await navigateToSearch(page);

    // Initial state visible
    await expect(page.getByText('Find what you need')).toBeVisible();

    const searchInput = page.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('pedals');
    await searchInput.press('Enter');

    // Initial state should be gone
    await expect(page.getByText('Find what you need')).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe('Search tab navigation', () => {
  test('search tab is accessible from bottom navigation', async ({ page }) => {
    await page.goto(BASE_URL);
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
