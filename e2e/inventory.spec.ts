/**
 * Inventory E2E tests: verifies inventory flows for unauthenticated users.
 * Run with: npm run test:e2e
 * Playwright web server: default localhost:8090 (see e2e/playwright-web-env.ts).
 */
import { test, expect } from '@playwright/test';

async function navigateToInventory(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForURL(/\/login/);
  await page.getByRole('button', { name: /Browse without signing in/ }).click();
  await page.waitForURL(/\/inventory/);
}

test.describe('Inventory list', () => {
  test('shows inventory heading', async ({ page }) => {
    await navigateToInventory(page);
    await expect(page.getByText('Inventory').first()).toBeVisible();
  });

  test('shows category filter chips', async ({ page }) => {
    await navigateToInventory(page);
    await expect(page.getByText('All')).toBeVisible();
    await expect(page.getByText('Components')).toBeVisible();
    await expect(page.getByText('Tools')).toBeVisible();
    await expect(page.getByText('Accessories')).toBeVisible();
  });

  test('shows empty state when no items', async ({ page }) => {
    await navigateToInventory(page);
    await expect(page.getByText('No items yet')).toBeVisible();
  });

  test('shows FAB for adding items', async ({ page }) => {
    await navigateToInventory(page);
    await expect(page.getByRole('button', { name: /add item/i })).toBeVisible();
  });
});

test.describe('Add item flow', () => {
  test('navigates to add item form via FAB', async ({ page }) => {
    await navigateToInventory(page);
    await page.getByRole('button', { name: /add item/i }).click();

    // Verify add item form fields are visible (condition is shown before category selection)
    await expect(page.getByText('Name')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Category')).toBeVisible();
    await expect(page.getByText('Condition')).toBeVisible();
    await page.getByRole('button', { name: /^Components$/ }).click();
  });

  test('shows validation errors when submitting empty form', async ({ page }) => {
    await navigateToInventory(page);
    await page.getByRole('button', { name: /add item/i }).click();

    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Name is required').first()).toBeVisible();
  });
});
