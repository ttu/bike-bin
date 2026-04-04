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
    // Lezyne Digital Floor Drive: second active loan (Marcus) — avoids racing borrow-lifecycle.spec.ts (Kai + PCS-10).
    await loggedInPage.getByText('Lezyne Digital Floor Drive').first().click();
    await waitForItemDetail(loggedInPage);

    await loggedInPage.getByRole('button', { name: /Mark as Returned/i }).click();

    // ConfirmDialog appears
    await expect(loggedInPage.getByText('Mark as returned?')).toBeVisible({ timeout: 5000 });
    await loggedInPage.getByRole('button', { name: /^Mark Returned$/i }).click();

    // Wait for RPC mutation to complete
    await loggedInPage.waitForResponse(
      (resp) =>
        resp.url().includes('/rest/v1/rpc/transition_borrow_request') &&
        resp.request().method() === 'POST',
      { timeout: 10000 },
    );

    // Navigate back to inventory list — item should still be visible (now stored)
    const tablist = loggedInPage.getByRole('tablist');
    await tablist.getByRole('tab', { name: /Inventory/ }).click();
    await expect(loggedInPage.getByText('Lezyne Digital Floor Drive').first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Archive item', () => {
  test('archives an item', async ({ loggedInPage }) => {
    // Dedicated seed item (no pending borrow — Chain Checker is targeted by accept-borrow E2E).
    await loggedInPage.getByText('Park Tool P-Handle Hex Set').first().click();
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
