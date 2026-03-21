/**
 * Inventory E2E tests: verifies inventory flows for unauthenticated users.
 * Run with: npm run test:e2e
 * Requires dev server running on localhost:8081
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

async function navigateToInventory(page: import('@playwright/test').Page) {
  await page.goto(BASE_URL);
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

    // Verify add item form fields are visible
    await expect(page.getByText('Name')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Category')).toBeVisible();
    await expect(page.getByText('Condition')).toBeVisible();
  });

  test('shows validation errors when submitting empty form', async ({ page }) => {
    await navigateToInventory(page);
    await page.getByRole('button', { name: /add item/i }).click();

    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Name is required')).toBeVisible();
  });
});
