import {
  test,
  expect,
  navigateToSearch,
  navigateToTab,
  expectFirstVisibleByText,
} from './fixtures';
import type { Page } from '@playwright/test';

/**
 * RN web can keep inactive tab screens in the DOM; the first matching node may be hidden.
 * Waits until at least one "N results within … km" line is visible.
 */
async function expectVisibleSearchResultsBanner(page: Page) {
  await expect(async () => {
    const lines = page.getByText(/\d+ results? within \d+ km/);
    const count = await lines.count();
    expect(count).toBeGreaterThan(0);
    let found = false;
    for (let i = 0; i < count; i++) {
      const line = lines.nth(i);
      if (await line.isVisible()) {
        await line.scrollIntoViewIfNeeded();
        await expect(line).toBeVisible();
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  }).toPass({ timeout: 10000 });
}

test.describe('Search with authenticated user', () => {
  test('shows search bar and empty state', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    await expect(loggedInPage.getByPlaceholder('Parts, tools, bikes...')).toBeVisible();
    await expect(loggedInPage.getByText('Find what you need')).toBeVisible();
    await expect(
      loggedInPage.getByText('Search for parts, tools, or bikes from cyclists nearby'),
    ).toBeVisible();
  });

  test('shows user location', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    await expectFirstVisibleByText(loggedInPage, /Kreuzberg|Berlin/, { timeout: 10000 });
  });

  test('shows distance selector', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    await expectFirstVisibleByText(loggedInPage, /within/, { timeout: 10000 });
    await expectFirstVisibleByText(loggedInPage, /km/);
  });

  test('search returns results', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('a');
    await searchInput.press('Enter');

    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });
  });

  test('search results show item info', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('a');
    await searchInput.press('Enter');

    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });

    // Results should show condition text (e.g. "Good", "Like New", "Fair")
    await expectFirstVisibleByText(loggedInPage, /Good|Like New|Fair|New|Worn/);
  });

  test('search results show availability chips', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('a');
    await searchInput.press('Enter');

    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });

    await expectFirstVisibleByText(loggedInPage, /Borrow|Sell|Donate/);
  });

  test('quick filter chips appear after search', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('a');
    await searchInput.press('Enter');

    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });

    await expectFirstVisibleByText(loggedInPage, /^Borrow$/);
    await expectFirstVisibleByText(loggedInPage, /^Donate$/);
    await expectFirstVisibleByText(loggedInPage, /^Sell$/);
  });

  test('sort button cycles through options', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('a');
    await searchInput.press('Enter');

    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });

    const sortButton = loggedInPage.getByText('Closest first').first();
    await expect(sortButton).toBeVisible();
    await sortButton.click();

    await expect(loggedInPage.getByText('Newest first')).toBeVisible();
    await loggedInPage.getByText('Newest first').click();

    await expect(loggedInPage.getByText('Recently available')).toBeVisible();
  });

  test('no results for nonsense query', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('zzzznonexistent999');
    await searchInput.press('Enter');

    await expect(loggedInPage.getByText('No items found nearby')).toBeVisible({ timeout: 10000 });
    await expect(
      loggedInPage.getByText('Try increasing your distance or changing filters.'),
    ).toBeVisible();
  });
});

test.describe('Listing detail', () => {
  test('clicking search result navigates to detail', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('a');
    await searchInput.press('Enter');

    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });

    // Click any search result item name
    const resultItem = loggedInPage
      .getByText(/Shimano|Continental|Brompton|Kryptonite|Tubus|Ortlieb|Vittoria|Brooks/)
      .first();
    await resultItem.click();

    // Should navigate away from the plain search URL
    await loggedInPage.waitForURL(/\/search\/[a-zA-Z0-9-]+|\/inventory\/[a-zA-Z0-9-]+/, {
      timeout: 10000,
    });
  });

  test('listing detail page loads item content', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('shimano');
    await searchInput.press('Enter');

    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });

    // Click the first search result
    const firstResult = loggedInPage.getByText('Shimano').first();
    await firstResult.click();

    // Wait for the detail page URL
    await loggedInPage.waitForURL(/\/search\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // The detail page should show condition info and owner section
    await expectFirstVisibleByText(loggedInPage, /^Condition$/, { timeout: 10000 });
    await expectFirstVisibleByText(loggedInPage, 'View profile');
  });

  test('header back button returns to search results', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('shimano');
    await searchInput.press('Enter');

    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });

    await loggedInPage.getByText('Shimano').first().click();
    await loggedInPage.waitForURL(/\/search\/[a-zA-Z0-9-]+/, { timeout: 10000 });
    await expectFirstVisibleByText(loggedInPage, /^Condition$/, { timeout: 10000 });

    await loggedInPage.getByRole('button', { name: /^Back$/i }).click();

    await loggedInPage.waitForURL((url) => /\/search\/?$/.test(url.pathname), { timeout: 10000 });

    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });
  });

  test('switching away from Search and back keeps results after opening a listing', async ({
    loggedInPage,
  }) => {
    await navigateToSearch(loggedInPage);

    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('a');
    await searchInput.press('Enter');

    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });

    await loggedInPage
      .getByText(/Shimano|Continental|Brompton|Kryptonite|Tubus|Ortlieb|Vittoria|Brooks/)
      .first()
      .click();
    await loggedInPage.waitForURL(/\/search\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    await navigateToTab(loggedInPage, 'Inventory');
    await loggedInPage.waitForURL(/\/inventory/, { timeout: 10000 });

    await navigateToTab(loggedInPage, 'Search');
    await loggedInPage.waitForURL(/\/search/, { timeout: 10000 });

    // Tab switch restores Search with the stack still on listing detail, so the results banner is
    // not visible yet. A second tap on Search (tab already focused) pops to the index root.
    const tablist = loggedInPage.getByRole('tablist');
    await tablist.getByRole('tab', { name: /Search/i }).click();

    await expectVisibleSearchResultsBanner(loggedInPage);
  });
});
