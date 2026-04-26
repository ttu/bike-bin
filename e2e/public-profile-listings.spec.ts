import { test, expect, navigateToSearch, expectFirstVisibleByText } from './fixtures';

test.describe('Public profile listings from search', () => {
  test('search item, open detail, navigate to owner profile, see that item in public listings', async ({
    loggedInPage,
  }) => {
    await navigateToSearch(loggedInPage);

    // Search for a specific item owned by another user (Lisa's Shimano Ultegra)
    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('Shimano Ultegra');
    await searchInput.press('Enter');

    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });

    // Click the search result to open listing detail
    await loggedInPage.getByText('Shimano Ultegra RD-R8000').first().click();
    await loggedInPage.waitForURL(/\/search\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // Verify listing detail loaded
    await expectFirstVisibleByText(loggedInPage, /^Condition$/, { timeout: 10000 });

    // Click "View profile" to navigate to owner's public profile
    await loggedInPage.getByText('View profile').click();
    await loggedInPage.waitForURL(/\/profile\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // Verify owner profile loaded (Lisa M.)
    await expectFirstVisibleByText(loggedInPage, 'Lisa M.', { timeout: 10000 });

    // Verify the "Public Listings" section heading is visible
    await expectFirstVisibleByText(loggedInPage, 'Public Listings', { timeout: 10000 });

    // The item we came from should appear as a listing card (rendered as a button)
    // Use role=button filter to avoid matching stale search/detail screens kept in DOM
    await expect(
      loggedInPage.getByRole('button', { name: /Shimano Ultegra RD-R8000/ }),
    ).toBeVisible({ timeout: 10000 });
  });
});
