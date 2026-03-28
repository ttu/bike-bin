import { test, expect, navigateToSearch } from './fixtures';

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

    await expect(loggedInPage.getByText(/Kreuzberg|Berlin/)).toBeVisible({ timeout: 10000 });
  });

  test('shows distance selector', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    await expect(loggedInPage.getByText(/within/)).toBeVisible({ timeout: 10000 });
    await expect(loggedInPage.getByText(/km/)).toBeVisible();
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
    await expect(loggedInPage.getByText(/Good|Like New|Fair|New|Worn/).first()).toBeVisible();
  });

  test('search results show availability chips', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('a');
    await searchInput.press('Enter');

    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });

    await expect(loggedInPage.getByText(/Borrowable|Sellable|Donatable/).first()).toBeVisible();
  });

  test('quick filter chips appear after search', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('a');
    await searchInput.press('Enter');

    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });

    await expect(loggedInPage.getByText('Borrow', { exact: true }).first()).toBeVisible();
    await expect(loggedInPage.getByText('Donate', { exact: true }).first()).toBeVisible();
    await expect(loggedInPage.getByText('Sell', { exact: true }).first()).toBeVisible();
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
    await expect(loggedInPage.getByText('Condition')).toBeVisible({ timeout: 10000 });
    await expect(loggedInPage.getByText('View profile')).toBeVisible();
  });
});
