import { test, expect } from './fixtures';
import { navigateToSearch, navigateToMessages, navigateToProfile } from './fixtures';

test.describe('Mobile viewport (375x812)', () => {
  test('inventory renders without overflow', async ({ loggedInPage }) => {
    await loggedInPage.setViewportSize({ width: 375, height: 812 });

    await expect(loggedInPage.getByText('Inventory').first()).toBeVisible({ timeout: 10000 });

    const tabBar = loggedInPage.getByRole('tablist');
    await expect(tabBar).toBeVisible();

    const hasOverflow = await loggedInPage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test('search renders correctly', async ({ loggedInPage }) => {
    await loggedInPage.setViewportSize({ width: 375, height: 812 });
    await navigateToSearch(loggedInPage);

    await expect(loggedInPage.getByPlaceholder('Parts, tools, bikes...')).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Find what you need')).toBeVisible();

    const hasOverflow = await loggedInPage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test('messages renders correctly', async ({ loggedInPage }) => {
    await loggedInPage.setViewportSize({ width: 375, height: 812 });
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Messages').first()).toBeVisible({ timeout: 10000 });
    await expect(loggedInPage.getByText('Kai R.')).toBeVisible({ timeout: 10000 });

    const hasOverflow = await loggedInPage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test('profile renders correctly', async ({ loggedInPage }) => {
    await loggedInPage.setViewportSize({ width: 375, height: 812 });
    await navigateToProfile(loggedInPage);

    await expect(loggedInPage.getByText('Test User')).toBeVisible({ timeout: 10000 });

    const hasOverflow = await loggedInPage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test('tab bar is visible', async ({ loggedInPage }) => {
    await loggedInPage.setViewportSize({ width: 375, height: 812 });

    const tabBar = loggedInPage.getByRole('tablist');
    await expect(tabBar).toBeVisible({ timeout: 10000 });

    await expect(loggedInPage.getByRole('tab', { name: /inventory/i })).toBeVisible();
    await expect(loggedInPage.getByRole('tab', { name: /^bikes$/i })).toBeVisible();
    await expect(loggedInPage.getByRole('tab', { name: /search/i })).toBeVisible();
    await expect(loggedInPage.getByRole('tab', { name: /messages/i })).toBeVisible();
    await expect(loggedInPage.getByRole('tab', { name: /profile/i })).toBeVisible();
  });
});

test.describe('Tablet viewport (768x1024)', () => {
  test('inventory renders without overflow', async ({ loggedInPage }) => {
    await loggedInPage.setViewportSize({ width: 768, height: 1024 });

    await expect(loggedInPage.getByText('Inventory').first()).toBeVisible({ timeout: 10000 });

    const tabBar = loggedInPage.getByRole('tablist');
    await expect(tabBar).toBeVisible();

    const hasOverflow = await loggedInPage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test('search renders correctly', async ({ loggedInPage }) => {
    await loggedInPage.setViewportSize({ width: 768, height: 1024 });
    await navigateToSearch(loggedInPage);

    await expect(loggedInPage.getByPlaceholder('Parts, tools, bikes...')).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Find what you need')).toBeVisible();

    const hasOverflow = await loggedInPage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test('messages renders correctly', async ({ loggedInPage }) => {
    await loggedInPage.setViewportSize({ width: 768, height: 1024 });
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Messages').first()).toBeVisible({ timeout: 10000 });
    await expect(loggedInPage.getByText('Kai R.')).toBeVisible({ timeout: 10000 });

    const hasOverflow = await loggedInPage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test('profile renders correctly', async ({ loggedInPage }) => {
    await loggedInPage.setViewportSize({ width: 768, height: 1024 });
    await navigateToProfile(loggedInPage);

    await expect(loggedInPage.getByText('Test User')).toBeVisible({ timeout: 10000 });

    const hasOverflow = await loggedInPage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test('tab bar is visible', async ({ loggedInPage }) => {
    await loggedInPage.setViewportSize({ width: 768, height: 1024 });

    const tabBar = loggedInPage.getByRole('tablist');
    await expect(tabBar).toBeVisible({ timeout: 10000 });

    await expect(loggedInPage.getByRole('tab', { name: /inventory/i })).toBeVisible();
    await expect(loggedInPage.getByRole('tab', { name: /^bikes$/i })).toBeVisible();
    await expect(loggedInPage.getByRole('tab', { name: /search/i })).toBeVisible();
    await expect(loggedInPage.getByRole('tab', { name: /messages/i })).toBeVisible();
    await expect(loggedInPage.getByRole('tab', { name: /profile/i })).toBeVisible();
  });
});
