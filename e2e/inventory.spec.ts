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
    await expect(page.getByText('Inventory')).toBeVisible();
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
    await expect(page.getByLabel('Add item')).toBeVisible();
  });
});

test.describe('Add item flow', () => {
  test('navigates to add item form via FAB', async ({ page }) => {
    await navigateToInventory(page);
    await page.getByLabel('Add item').click();

    await expect(page.getByText('Add item')).toBeVisible();
    await expect(page.getByText('Name')).toBeVisible();
    await expect(page.getByText('Category')).toBeVisible();
    await expect(page.getByText('Condition')).toBeVisible();
  });

  test('shows validation errors when submitting empty form', async ({ page }) => {
    await navigateToInventory(page);
    await page.getByLabel('Add item').click();

    await page.getByText('Save').click();
    await expect(page.getByText('Name is required')).toBeVisible();
  });
});
