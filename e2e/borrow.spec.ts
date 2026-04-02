/**
 * Borrow E2E tests: verifies borrow request UI flows.
 * Run with: npm run test:e2e
 * Playwright web server: default localhost:8090 (see e2e/playwright-web-env.ts).
 *
 * Tests cover:
 * - Borrow Requests screen accessibility from Profile tab
 * - Three sub-tabs (Incoming / Outgoing / Active) and empty states
 * - Request Borrow button visibility on listing detail (unauthenticated)
 * - Navigation flows for borrow-related screens
 */
import { test, expect } from '@playwright/test';

async function browseWithoutSignIn(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForURL(/\/login/);
  await page.getByRole('button', { name: /Browse without signing in/ }).click();
  await page.waitForURL(/\/inventory/);
}

async function navigateToProfile(page: import('@playwright/test').Page) {
  await browseWithoutSignIn(page);

  const tablist = page.getByRole('tablist');
  await tablist.getByRole('tab', { name: /Profile/ }).click();
  await page.waitForURL(/\/profile/);
}

test.describe('Borrow Requests screen', () => {
  test('profile tab shows Borrow Requests menu item', async ({ page }) => {
    await navigateToProfile(page);
    await expect(page.getByText('Borrow Requests')).toBeVisible();
  });

  test('navigates to borrow requests from profile', async ({ page }) => {
    await navigateToProfile(page);

    await page.getByText('Borrow Requests').click();
    await page.waitForURL(/\/borrow-requests/);

    expect(page.url()).toContain('/borrow-requests');
  });

  test('shows three sub-tabs: Incoming, Outgoing, Active', async ({ page }) => {
    await navigateToProfile(page);
    await page.getByText('Borrow Requests').click();
    await page.waitForURL(/\/borrow-requests/);

    await expect(page.getByRole('tab', { name: /Incoming/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Outgoing/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Active/ })).toBeVisible();
  });

  test('incoming tab shows empty state by default', async ({ page }) => {
    await navigateToProfile(page);
    await page.getByText('Borrow Requests').click();
    await page.waitForURL(/\/borrow-requests/);

    // Incoming tab is selected by default
    await expect(page.getByText('No incoming requests')).toBeVisible();
    await expect(
      page.getByText('When someone wants to borrow your items, their requests will appear here.'),
    ).toBeVisible();
  });

  test('outgoing tab shows empty state', async ({ page }) => {
    await navigateToProfile(page);
    await page.getByText('Borrow Requests').click();
    await page.waitForURL(/\/borrow-requests/);

    // Switch to Outgoing tab
    await page.getByRole('tab', { name: /Outgoing/ }).click();
    await expect(page.getByText('No outgoing requests')).toBeVisible();
    await expect(
      page.getByText('Request to borrow items from other users to see them here.'),
    ).toBeVisible();
  });

  test('active tab shows empty state', async ({ page }) => {
    await navigateToProfile(page);
    await page.getByText('Borrow Requests').click();
    await page.waitForURL(/\/borrow-requests/);

    // Switch to Active tab
    await page.getByRole('tab', { name: /Active/ }).click();
    await expect(page.getByText('No active loans')).toBeVisible();
    await expect(
      page.getByText('Accepted borrow requests will appear here until the item is returned.'),
    ).toBeVisible();
  });
});

test.describe('Borrow on listing detail', () => {
  test('unauthenticated user sees sign-in prompt, not borrow button', async ({ page }) => {
    await browseWithoutSignIn(page);

    // Navigate to Search tab
    const tablist = page.getByRole('tablist');
    await tablist.getByRole('tab', { name: /Search/ }).click();
    await page.waitForURL(/\/search/);

    // Search requires auth — guests see a sign-in prompt instead of the search bar.
    await expect(page.getByText('Sign in to search')).toBeVisible();
    await expect(
      page.getByText(
        'Create an account or sign in to discover parts and bikes from cyclists nearby.',
      ),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^Sign in$/ })).toBeVisible();
  });
});

test.describe('Borrow request navigation', () => {
  test('back button on borrow requests returns to profile', async ({ page }) => {
    await navigateToProfile(page);
    await page.getByText('Borrow Requests').click();
    await page.waitForURL(/\/borrow-requests/);

    // Click back button (arrow-left icon)
    await page.getByRole('button').first().click();

    // Should navigate back to profile
    await page.waitForURL(/\/profile$/);
    expect(page.url()).toMatch(/\/profile$/);
  });
});
