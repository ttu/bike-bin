/**
 * Shared Playwright fixtures for authenticated E2E tests.
 * Provides a `loggedInPage` fixture that logs in via dev login
 * before each test, and helper navigation functions.
 *
 * Requires: local Supabase running with seeded test data.
 */
import { test as base, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

/**
 * Custom fixture that provides a page already logged in as the main test user.
 */
export const test = base.extend<{ loggedInPage: Page }>({
  loggedInPage: async ({ page }, use) => {
    await page.goto(BASE_URL);
    await page.waitForURL(/\/login/);

    // Click "Dev Login" button to sign in as main test user
    await page.getByRole('button', { name: /Dev Login/ }).click();

    // Wait for redirect to inventory after successful login
    await page.waitForURL(/\/inventory/, { timeout: 15000 });

    await use(page);
  },
});

export { expect, BASE_URL };

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

export async function navigateToTab(
  page: Page,
  tabName: 'Inventory' | 'Search' | 'Messages' | 'Profile',
) {
  const tablist = page.getByRole('tablist');
  await tablist.getByRole('tab', { name: new RegExp(tabName) }).click();
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
