import { test, expect } from './fixtures';

// ---------------------------------------------------------------------------
// Item CRUD — add, edit, delete
// ---------------------------------------------------------------------------

/**
 * Helper to fill and submit the add-item form with minimal required fields.
 * Call after navigating to the new-item screen.
 */
async function fillAndSaveItem(page: import('@playwright/test').Page, name: string) {
  // Wait for form to load
  await expect(page.getByPlaceholder('e.g. Shimano 105 Cassette')).toBeVisible({
    timeout: 10000,
  });

  // Fill name
  await page.getByPlaceholder('e.g. Shimano 105 Cassette').fill(name);

  // Select category — scroll into view and click the visible "Tools" chip in the form
  const toolsChip = page.getByText('Tools', { exact: true }).last();
  await toolsChip.scrollIntoViewIfNeeded();
  await toolsChip.click();

  // Select condition — "Good" chip
  const goodChip = page.getByText('Good', { exact: true }).last();
  await goodChip.scrollIntoViewIfNeeded();
  await goodChip.click();

  // Submit form — scroll to Save button
  const saveButton = page.getByRole('button', { name: /^save$/i });
  await saveButton.scrollIntoViewIfNeeded();
  await saveButton.click();
}

test.describe('Add item', () => {
  test('creates a new item with required fields and shows it in inventory', async ({
    loggedInPage,
  }) => {
    // Navigate to add item form
    await loggedInPage.getByRole('button', { name: /add item/i }).click();

    await fillAndSaveItem(loggedInPage, 'E2E Test Brake Pads');

    // Verify we returned to inventory and item is visible
    await loggedInPage.waitForURL(/\/inventory/, { timeout: 10000 });
    await expect(loggedInPage.getByText('E2E Test Brake Pads')).toBeVisible({ timeout: 10000 });
  });

  test('shows validation error for missing name', async ({ loggedInPage }) => {
    await loggedInPage.getByRole('button', { name: /add item/i }).click();
    await expect(loggedInPage.getByPlaceholder('e.g. Shimano 105 Cassette')).toBeVisible({
      timeout: 10000,
    });

    // Submit without filling anything
    const saveButton = loggedInPage.getByRole('button', { name: /^save$/i });
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.click();

    await expect(loggedInPage.getByText('Name is required').first()).toBeVisible();
  });
});

test.describe('Edit item', () => {
  test('edits an existing item name', async ({ loggedInPage }) => {
    // Open an item detail
    await loggedInPage.getByText('RaceFace Turbine R Cranks').first().click();
    await loggedInPage.waitForURL(/\/inventory\/[a-zA-Z0-9-]+/, { timeout: 10000 });
    await expect(loggedInPage.getByText('Condition', { exact: true }).last()).toBeVisible({
      timeout: 10000,
    });

    // Click edit button
    await loggedInPage.getByRole('button', { name: /edit item/i }).click();
    await loggedInPage.waitForURL(/\/edit\//, { timeout: 10000 });
    await expect(loggedInPage.getByText('Edit item').first()).toBeVisible({ timeout: 10000 });

    // Change the name — use fill() which sets the value atomically. Clearing the
    // field first causes ItemForm to auto-populate from brand+model, so typing
    // after a clear concatenates onto that fallback.
    const nameInput = loggedInPage.getByPlaceholder('e.g. Shimano 105 Cassette');
    await nameInput.fill('RaceFace Cranks Updated');

    // Save
    const updateButton = loggedInPage.getByRole('button', { name: /update inventory/i });
    await updateButton.scrollIntoViewIfNeeded();
    await updateButton.click();

    // Wait for the PATCH to complete. After save, tabScopedBack pops one screen so
    // navigation returns to the item detail page (list → detail → edit → detail).
    await loggedInPage.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/items') && resp.request().method() === 'PATCH',
      { timeout: 10000 },
    );
    await loggedInPage.waitForURL(/\/inventory\/[a-zA-Z0-9-]+$/, { timeout: 10000 });

    // Verify the updated name appears on the detail page
    await expect(loggedInPage.getByText('RaceFace Cranks Updated').first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Delete item', () => {
  test('deletes an item from detail page', async ({ loggedInPage }) => {
    // First create an item to delete, so we don't affect seed data
    await loggedInPage.getByRole('button', { name: /add item/i }).click();

    await fillAndSaveItem(loggedInPage, 'Item To Delete');

    await loggedInPage.waitForURL(/\/inventory/, { timeout: 10000 });
    await expect(loggedInPage.getByText('Item To Delete')).toBeVisible({ timeout: 10000 });

    // Open the item
    await loggedInPage.getByText('Item To Delete').click();
    await loggedInPage.waitForURL(/\/inventory\/[a-zA-Z0-9-]+/, { timeout: 10000 });
    await expect(loggedInPage.getByText('Condition', { exact: true }).last()).toBeVisible({
      timeout: 10000,
    });

    // Click "Remove from inventory" → opens choice dialog
    await loggedInPage.getByRole('button', { name: /remove from inventory/i }).click();

    // Choose "Delete item" in the removal dialog
    await loggedInPage.getByTestId('remove-inventory-delete').click();

    // Confirm in the delete confirmation dialog
    await expect(loggedInPage.getByRole('heading', { name: 'Delete Item' })).toBeVisible({
      timeout: 5000,
    });
    await loggedInPage.getByTestId('confirm-dialog-confirm').click();

    // Should return to inventory list
    await loggedInPage.waitForURL(/\/inventory$/, { timeout: 10000 });

    // Item should be gone
    await expect(loggedInPage.getByText('Item To Delete')).toBeHidden({ timeout: 5000 });
  });
});
