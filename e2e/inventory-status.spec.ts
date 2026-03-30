import { test, expect } from './fixtures';

// ---------------------------------------------------------------------------
// Item status transitions — sold, donated, returned, archive
// ---------------------------------------------------------------------------

/** Wait for item detail page to load after clicking an item. */
async function waitForItemDetail(page: import('@playwright/test').Page) {
  await page.waitForURL(/\/inventory\/[a-zA-Z0-9-]+/, { timeout: 10000 });
  // Wait for detail content to render
  await page.waitForTimeout(500);
}

test.describe('Mark as Sold', () => {
  test('marks a sellable item as sold', async ({ loggedInPage }) => {
    // Troy Lee Designs A3 Helmet is stored + sellable
    await loggedInPage.getByText('Troy Lee Designs A3 Helmet').first().click();
    await waitForItemDetail(loggedInPage);

    await loggedInPage.getByRole('button', { name: /Mark as Sold/i }).click();

    // ConfirmDialog appears
    await expect(loggedInPage.getByText('Mark as sold?')).toBeVisible({ timeout: 5000 });
    await loggedInPage.getByRole('button', { name: /^Mark Sold$/i }).click();

    await expect(loggedInPage.getByText('Sold')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Mark as Donated', () => {
  test('marks a donatable item as donated', async ({ loggedInPage }) => {
    // Muc-Off Chain Lube is stored + donatable
    await loggedInPage.getByText('Muc-Off Chain Lube').first().click();
    await waitForItemDetail(loggedInPage);

    await loggedInPage.getByRole('button', { name: /Mark as Donated/i }).click();

    // ConfirmDialog appears
    await expect(loggedInPage.getByText('Mark as donated?')).toBeVisible({ timeout: 5000 });
    await loggedInPage.getByRole('button', { name: /^Mark Donated$/i }).click();

    await expect(loggedInPage.getByText('Donated')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Mark as Returned', () => {
  test('marks a loaned item as returned', async ({ loggedInPage }) => {
    // Park Tool PCS-10.3 Stand is loaned + borrowable
    await loggedInPage.getByText('Park Tool PCS-10.3 Stand').first().click();
    await waitForItemDetail(loggedInPage);

    await loggedInPage.getByRole('button', { name: /Mark as Returned/i }).click();

    // ConfirmDialog appears
    await expect(loggedInPage.getByText('Mark as returned?')).toBeVisible({ timeout: 5000 });
    await loggedInPage.getByRole('button', { name: /^Mark Returned$/i }).click();

    // Wait for PATCH to complete
    await loggedInPage.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/items') && resp.request().method() === 'PATCH',
      { timeout: 10000 },
    );

    // Navigate back to inventory list — item should still be visible (now stored)
    const tablist = loggedInPage.getByRole('tablist');
    await tablist.getByRole('tab', { name: /Inventory/ }).click();
    await expect(loggedInPage.getByText('Park Tool PCS-10.3 Stand').first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Archive item', () => {
  test('archives an item', async ({ loggedInPage }) => {
    // Park Tool Chain Checker (stored, borrowable)
    await loggedInPage.getByText('Park Tool Chain Checker').first().click();
    await waitForItemDetail(loggedInPage);

    // Click "Remove from inventory" → opens choice dialog
    await loggedInPage.getByRole('button', { name: /remove from inventory/i }).click();

    // Choose "Archive" in the removal dialog
    await loggedInPage.getByTestId('remove-inventory-archive').click();

    // ConfirmDialog appears
    await expect(loggedInPage.getByRole('heading', { name: 'Archive Item' })).toBeVisible({
      timeout: 5000,
    });
    await loggedInPage.getByTestId('confirm-dialog-confirm').click();

    await expect(loggedInPage.getByText('Archived')).toBeVisible({ timeout: 10000 });
  });
});
