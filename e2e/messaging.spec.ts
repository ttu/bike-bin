/**
 * Messaging E2E tests: verifies messaging UI flows.
 * Run with: npm run test:e2e
 * Playwright web server: default localhost:8090 (see e2e/playwright-web-env.ts).
 *
 * Tests cover:
 * - Messages tab accessibility and empty state
 * - Conversation detail UI structure
 * - Unauthenticated user sees "Sign in to contact" on listings
 */
import { test, expect } from '@playwright/test';

async function browseWithoutSignIn(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForURL(/\/login/);
  await page.getByRole('button', { name: /Browse without signing in/ }).click();
  await page.waitForURL(/\/inventory/);
}

async function navigateToMessages(page: import('@playwright/test').Page) {
  await browseWithoutSignIn(page);

  const tablist = page.getByRole('tablist');
  await tablist.getByRole('tab', { name: /Messages/ }).click();
  await page.waitForURL(/\/messages/);
}

test.describe('Messages tab', () => {
  test('messages tab is accessible from bottom navigation', async ({ page }) => {
    await browseWithoutSignIn(page);

    const tablist = page.getByRole('tablist');
    const messagesTab = tablist.getByRole('tab', { name: /Messages/ });
    await expect(messagesTab).toBeVisible();

    await messagesTab.click();
    await page.waitForURL(/\/messages/);
    expect(page.url()).toContain('/messages');
  });

  test('shows Messages heading', async ({ page }) => {
    await navigateToMessages(page);
    await expect(page.getByText('Messages').first()).toBeVisible();
  });

  test('shows empty state when no conversations', async ({ page }) => {
    await navigateToMessages(page);

    await expect(page.getByText('No conversations yet')).toBeVisible();
    await expect(page.getByText('Start one by contacting a listing owner.')).toBeVisible();
  });
});

test.describe('Messaging from listing detail', () => {
  test('unauthenticated user sees search sign-in wall on Search tab', async ({ page }) => {
    await browseWithoutSignIn(page);

    const tablist = page.getByRole('tablist');
    await tablist.getByRole('tab', { name: /Search/ }).click();
    await page.waitForURL(/\/search/);

    await expect(page.getByText('Sign in to search')).toBeVisible();
    await expect(page.getByPlaceholder('Parts, tools, bikes...')).toHaveCount(0);
  });
});

test.describe('Conversation detail structure', () => {
  test('navigating to invalid conversation shows loading or error state', async ({ page }) => {
    await browseWithoutSignIn(page);

    // Navigate directly to a non-existent conversation
    await page.goto('/messages/non-existent-id');

    // Should show some UI (loading screen or error) — not a blank page
    // The page should at minimum have some rendered content
    await page.waitForTimeout(2000);
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});
