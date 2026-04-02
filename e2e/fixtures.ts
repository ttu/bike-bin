/**
 * Shared Playwright fixtures for authenticated E2E tests.
 * Provides a `loggedInPage` fixture that logs in via dev login
 * before each test, and helper navigation functions.
 *
 * Requires: local Supabase running with seeded test data.
 */
import { test as base, expect, type Page } from '@playwright/test';

/**
 * Custom fixture that provides a page already logged in as the main test user.
 */
export const test = base.extend<{ loggedInPage: Page }>({
  loggedInPage: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);

    // Click "Dev Login" button to sign in as main test user
    await page.getByRole('button', { name: /Dev Login/ }).click();

    // Wait for redirect to inventory after successful login
    await page.waitForURL(/\/inventory/, { timeout: 15000 });

    await use(page);
  },
});

export { expect };

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

export async function navigateToTab(
  page: Page,
  tabName: 'Inventory' | 'Bikes' | 'Search' | 'Messages' | 'Profile',
) {
  const tablist = page.getByRole('tablist');
  await tablist.getByRole('tab', { name: new RegExp(tabName, 'i') }).click();
  const urlSegment = tabName.toLowerCase();
  await page.waitForURL(new RegExp(`\\/${urlSegment}`));
}

export async function navigateToInventory(page: Page) {
  await navigateToTab(page, 'Inventory');
}

export async function navigateToSearch(page: Page) {
  await navigateToTab(page, 'Search');
}

export async function navigateToMessages(page: Page) {
  await navigateToTab(page, 'Messages');
}

export async function navigateToProfile(page: Page) {
  await navigateToTab(page, 'Profile');
}

export async function navigateToBikes(page: Page) {
  await navigateToTab(page, 'Bikes');
  await expect(page.getByText('My Bikes')).toBeVisible({ timeout: 10000 });
}
