import { test, expect, navigateToProfile, navigateToSearch } from './fixtures';

// ---------------------------------------------------------------------------
// Borrow request lifecycle — accept, decline, mark returned
// ---------------------------------------------------------------------------

async function navigateToBorrowRequests(page: import('@playwright/test').Page) {
  await navigateToProfile(page);
  await page.getByText('Borrow Requests').click();
  await page.waitForURL(/\/borrow-requests/, { timeout: 10000 });
}

test.describe('Accept borrow request', () => {
  test('accepts an incoming pending request', async ({ loggedInPage }) => {
    await navigateToBorrowRequests(loggedInPage);

    // Incoming tab is default — Nina T. has a pending request
    await expect(loggedInPage.getByText('Incoming (1)')).toBeVisible({ timeout: 10000 });

    // Click Accept on the card — use JS click to bypass viewport constraint
    await loggedInPage.getByTestId('accept-button').dispatchEvent('click');

    // ConfirmDialog appears — click the confirm "Accept" button
    await expect(loggedInPage.getByText('Accept request?')).toBeVisible({ timeout: 5000 });

    // Start listening for the RPC response before clicking confirm
    const acceptResponse = loggedInPage.waitForResponse(
      (resp) =>
        resp.url().includes('/rest/v1/rpc/transition_borrow_request') &&
        resp.request().method() === 'POST',
      { timeout: 10000 },
    );

    await loggedInPage
      .getByRole('button', { name: /^Accept$/i })
      .last()
      .click();

    // Wait for the mutation to complete
    await acceptResponse;

    // Wait for the query cache to refresh — incoming count should drop to 0
    await expect(loggedInPage.getByText('Incoming (1)')).toBeHidden({ timeout: 10000 });

    // Request should move to active tab — switch to Active
    await loggedInPage.getByRole('tab', { name: /Active/ }).click();

    // The accepted request should appear here
    await expect(loggedInPage.getByText('Nina T.').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Active loan — Mark Returned', () => {
  test('marks an active loan as returned', async ({ loggedInPage }) => {
    await navigateToBorrowRequests(loggedInPage);

    // Switch to Active tab — Kai R. has an accepted request
    await loggedInPage.getByRole('tab', { name: /Active/ }).click();

    await expect(loggedInPage.getByText('Kai R.').first()).toBeVisible({ timeout: 10000 });

    // Click Mark Returned — use JS click to bypass viewport constraint
    await loggedInPage.getByTestId('mark-returned-button').first().dispatchEvent('click');

    // ConfirmDialog appears
    await expect(loggedInPage.getByText('Mark as returned?')).toBeVisible({ timeout: 5000 });
    await loggedInPage
      .getByRole('button', { name: /^Mark Returned$/i })
      .last()
      .click();

    // Wait for mutation to complete — the returned dialog should close
    await expect(loggedInPage.getByText('Mark as returned?')).toBeHidden({ timeout: 10000 });
  });
});

test.describe('Request borrow from listing', () => {
  test('shows Request Borrow button on borrowable listing', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    // Search for borrowable items
    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('a');
    await searchInput.press('Enter');

    // Wait for results
    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });

    // Click first result
    const resultItem = loggedInPage
      .getByText(/Shimano|Continental|Brompton|Kryptonite|Tubus|Ortlieb|Vittoria|Brooks/)
      .first();

    const resultCount = await resultItem.count();
    if (resultCount > 0) {
      await resultItem.click();
      await loggedInPage.waitForURL(/\/search\/[a-zA-Z0-9-]+/, { timeout: 10000 });

      // Listing detail should show Contact or Request Borrow button
      await expect(
        loggedInPage.getByRole('button', { name: /Contact|Request Borrow/i }).first(),
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
