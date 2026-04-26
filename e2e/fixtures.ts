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
  loggedInPage: async ({ page }, provideFixture) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);

    // Click "Dev Login" button to sign in as main test user
    await page.getByRole('button', { name: /Dev Login/ }).click();

    // Wait for redirect to inventory after successful login
    await page.waitForURL(/\/inventory/, { timeout: 15000 });

    await provideFixture(page);
  },
});

export { expect } from '@playwright/test';

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
  await page.waitForURL(new RegExp(String.raw`\/${urlSegment}`));
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

/**
 * RN web can keep inactive screens in the DOM, so the same string may appear on multiple nodes.
 * Asserts that at least one matching locator is visible (avoids Playwright strict-mode violations).
 */
export async function expectFirstVisibleByText(
  page: Page,
  pattern: string | RegExp,
  options?: { timeout?: number },
): Promise<void> {
  const timeout = options?.timeout ?? 10000;
  await expect(async () => {
    const matches = page.getByText(pattern);
    const count = await matches.count();
    expect(count).toBeGreaterThan(0);
    let found = false;
    for (let i = 0; i < count; i++) {
      const el = matches.nth(i);
      if (await el.isVisible()) {
        await el.scrollIntoViewIfNeeded();
        await expect(el).toBeVisible();
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  }).toPass({ timeout });
}

/**
 * Clicks the first visible node matching text (for stacked/hidden RN web screens).
 */
export async function clickFirstVisibleByText(
  page: Page,
  pattern: string | RegExp,
  options?: { timeout?: number },
): Promise<void> {
  const timeout = options?.timeout ?? 10000;
  await expect(async () => {
    const matches = page.getByText(pattern);
    const count = await matches.count();
    expect(count).toBeGreaterThan(0);
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const el = matches.nth(i);
      if (await el.isVisible()) {
        await el.click();
        clicked = true;
        break;
      }
    }
    expect(clicked).toBe(true);
  }).toPass({ timeout });
}

/**
 * Clicks the first visible element for a role + accessible name (stacked routes may duplicate nodes).
 */
export async function clickFirstVisibleByRole(
  page: Page,
  role: 'button' | 'link',
  name: string | RegExp,
): Promise<void> {
  const candidates = page.getByRole(role, { name });
  await expect(candidates.first()).toBeAttached({ timeout: 10000 });
  const count = await candidates.count();
  for (let i = 0; i < count; i++) {
    const el = candidates.nth(i);
    if (await el.isVisible()) {
      await el.click();
      return;
    }
  }
  throw new Error(`No visible ${role} matching ${String(name)}`);
}
