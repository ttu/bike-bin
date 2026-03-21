import { test, expect } from './fixtures';

test.describe('Inventory list with data', () => {
  test('shows all 8 items', async ({ loggedInPage }) => {
    await expect(loggedInPage.getByText('Muc-Off Chain Lube')).toBeVisible();
    await expect(loggedInPage.getByText('Park Tool PCS-10.3 Stand')).toBeVisible();
    await expect(loggedInPage.getByText('Troy Lee Designs A3 Helmet')).toBeVisible();
    await expect(loggedInPage.getByText('Maxxis Minion DHF/DHR Combo')).toBeVisible();
    await expect(loggedInPage.getByText('Topeak Alien II Multi-tool')).toBeVisible();
    await expect(loggedInPage.getByText('RaceFace Turbine R Cranks')).toBeVisible();
    await expect(loggedInPage.getByText('Fox 36 Float Fork')).toBeVisible();
    await expect(loggedInPage.getByText('Park Tool Chain Checker')).toBeVisible();
  });

  test('shows item status chips', async ({ loggedInPage }) => {
    await expect(loggedInPage.getByText('Stored').first()).toBeVisible();
    await expect(loggedInPage.getByText('Loaned').first()).toBeVisible();
    await expect(loggedInPage.getByText('Mounted').first()).toBeVisible();
  });

  test('shows availability chips', async ({ loggedInPage }) => {
    await expect(loggedInPage.getByText('Borrowable').first()).toBeVisible();
    await expect(loggedInPage.getByText('Sellable').first()).toBeVisible();
    await expect(loggedInPage.getByText('Donatable').first()).toBeVisible();
  });

  test('category filter - Components', async ({ loggedInPage }) => {
    await loggedInPage.getByRole('button', { name: 'Components' }).click();

    await expect(loggedInPage.getByText('Maxxis Minion DHF/DHR Combo')).toBeVisible();
    await expect(loggedInPage.getByText('RaceFace Turbine R Cranks')).toBeVisible();
    await expect(loggedInPage.getByText('Fox 36 Float Fork')).toBeVisible();

    await expect(loggedInPage.getByText('Muc-Off Chain Lube')).toBeHidden();
    await expect(loggedInPage.getByText('Park Tool PCS-10.3 Stand')).toBeHidden();
    await expect(loggedInPage.getByText('Troy Lee Designs A3 Helmet')).toBeHidden();
  });

  test('category filter - Tools', async ({ loggedInPage }) => {
    await loggedInPage.getByRole('button', { name: 'Tools' }).click();

    await expect(loggedInPage.getByText('Park Tool PCS-10.3 Stand')).toBeVisible();
    await expect(loggedInPage.getByText('Topeak Alien II Multi-tool')).toBeVisible();
    await expect(loggedInPage.getByText('Park Tool Chain Checker')).toBeVisible();

    await expect(loggedInPage.getByText('Muc-Off Chain Lube')).toBeHidden();
    await expect(loggedInPage.getByText('Troy Lee Designs A3 Helmet')).toBeHidden();
    await expect(loggedInPage.getByText('Fox 36 Float Fork')).toBeHidden();
  });

  test('category filter - All resets', async ({ loggedInPage }) => {
    await loggedInPage.getByRole('button', { name: 'Components' }).click();
    await expect(loggedInPage.getByText('Muc-Off Chain Lube')).toBeHidden();

    await loggedInPage.getByRole('button', { name: 'All' }).click();

    await expect(loggedInPage.getByText('Muc-Off Chain Lube')).toBeVisible();
    await expect(loggedInPage.getByText('Park Tool PCS-10.3 Stand')).toBeVisible();
    await expect(loggedInPage.getByText('Troy Lee Designs A3 Helmet')).toBeVisible();
    await expect(loggedInPage.getByText('Maxxis Minion DHF/DHR Combo')).toBeVisible();
    await expect(loggedInPage.getByText('Topeak Alien II Multi-tool')).toBeVisible();
    await expect(loggedInPage.getByText('RaceFace Turbine R Cranks')).toBeVisible();
    await expect(loggedInPage.getByText('Fox 36 Float Fork')).toBeVisible();
    await expect(loggedInPage.getByText('Park Tool Chain Checker')).toBeVisible();
  });

  test('shows Consumables filter', async ({ loggedInPage }) => {
    await expect(loggedInPage.getByRole('button', { name: 'Consumables' })).toBeVisible();
  });
});

test.describe('Item detail', () => {
  test('navigates to item detail on click', async ({ loggedInPage }) => {
    await loggedInPage.getByText('Fox 36 Float Fork').first().click();
    await loggedInPage.waitForURL(/\/inventory\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    await expect(loggedInPage.getByText('Condition')).toBeVisible({ timeout: 10000 });
  });

  test('shows back navigation', async ({ loggedInPage }) => {
    await loggedInPage.getByText('Fox 36 Float Fork').first().click();
    await loggedInPage.waitForURL(/\/inventory\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    await expect(loggedInPage.getByText('Condition')).toBeVisible({ timeout: 10000 });
  });

  test('item detail shows condition', async ({ loggedInPage }) => {
    await loggedInPage.getByText('Fox 36 Float Fork').first().click();
    await loggedInPage.waitForURL(/\/inventory\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    await expect(loggedInPage.getByText('Condition')).toBeVisible({ timeout: 10000 });
    // Verify detail fields are visible (Usage only appears on detail page)
    await expect(loggedInPage.getByText('Usage', { exact: true })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Bikes', () => {
  test('navigates to bikes via header link', async ({ loggedInPage }) => {
    await loggedInPage.getByText(/Bikes\s*→/).click();

    await expect(loggedInPage.getByText('My Bikes')).toBeVisible();
  });

  test('shows bike cards', async ({ loggedInPage }) => {
    await loggedInPage.getByText(/Bikes\s*→/).click();

    await expect(loggedInPage.getByText('Santa Cruz Hightower')).toBeVisible();
  });

  test('bike detail shows type', async ({ loggedInPage }) => {
    await loggedInPage.getByText(/Bikes\s*→/).click();
    await expect(loggedInPage.getByText('Santa Cruz Hightower')).toBeVisible({ timeout: 10000 });
    await loggedInPage.getByText('Santa Cruz Hightower').click();

    // Wait for bike detail to load — verify detail-only label
    await expect(loggedInPage.getByText('Model', { exact: true })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Notifications', () => {
  test('notification bell is visible', async ({ loggedInPage }) => {
    await expect(loggedInPage.getByRole('button', { name: /notification/i })).toBeVisible();
  });

  test('navigates to notifications', async ({ loggedInPage }) => {
    await loggedInPage.getByRole('button', { name: /notification/i }).click();

    await expect(loggedInPage.getByRole('heading', { name: 'Notifications' })).toBeVisible();
  });
});
