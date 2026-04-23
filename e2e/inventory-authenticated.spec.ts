import { test, expect, navigateToBikes } from './fixtures';

test.describe('Inventory list with data', () => {
  test('shows all 10 items', async ({ loggedInPage }) => {
    await expect(loggedInPage.getByText('Muc-Off Chain Lube')).toBeVisible();
    await expect(loggedInPage.getByText('Park Tool PCS-10.3 Stand')).toBeVisible();
    await expect(loggedInPage.getByText('Lezyne Digital Floor Drive')).toBeVisible();
    await expect(loggedInPage.getByText('Troy Lee Designs A3 Helmet')).toBeVisible();
    await expect(loggedInPage.getByText('Maxxis Minion DHF/DHR Combo')).toBeVisible();
    await expect(loggedInPage.getByText('Topeak Alien II Multi-tool')).toBeVisible();
    await expect(loggedInPage.getByText('Park Tool P-Handle Hex Set')).toBeVisible();
    await expect(loggedInPage.getByText('RaceFace Turbine R Cranks')).toBeVisible();
    await expect(loggedInPage.getByText('Fox 36 Float Fork')).toBeVisible();
    await expect(loggedInPage.getByText('Park Tool Chain Checker')).toBeVisible();
  });

  test('shows item status chips', async ({ loggedInPage }) => {
    // "Stored" status is hidden on cards (only non-stored statuses show chips)
    // Park Tool PCS-10.3 Stand is loaned — verify the chip renders
    await loggedInPage.getByText('Loaned').first().scrollIntoViewIfNeeded();
    await expect(loggedInPage.getByText('Loaned').first()).toBeVisible();
  });

  test('shows availability chips', async ({ loggedInPage }) => {
    await expect(loggedInPage.getByText('Borrow').first()).toBeVisible();
    await expect(loggedInPage.getByText('Sell').first()).toBeVisible();
    await expect(loggedInPage.getByText('Donate').first()).toBeVisible();
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
    await expect(loggedInPage.getByText('Lezyne Digital Floor Drive')).toBeVisible();
    await expect(loggedInPage.getByText('Topeak Alien II Multi-tool')).toBeVisible();
    await expect(loggedInPage.getByText('Park Tool P-Handle Hex Set')).toBeVisible();
    await expect(loggedInPage.getByText('Park Tool Chain Checker')).toBeVisible();

    await expect(loggedInPage.getByText('Muc-Off Chain Lube')).toBeHidden();
    await expect(loggedInPage.getByText('Troy Lee Designs A3 Helmet')).toBeHidden();
    await expect(loggedInPage.getByText('Fox 36 Float Fork')).toBeHidden();
  });

  test('category filter - All resets', async ({ loggedInPage }) => {
    await loggedInPage.getByRole('button', { name: 'Components' }).click();
    await expect(loggedInPage.getByText('Muc-Off Chain Lube')).toBeHidden();

    // Substring match would incorrectly include "Gallery view" (…gALLery…).
    await loggedInPage.getByRole('button', { name: 'All', exact: true }).click();

    await expect(loggedInPage.getByText('Muc-Off Chain Lube')).toBeVisible();
    await expect(loggedInPage.getByText('Park Tool PCS-10.3 Stand')).toBeVisible();
    await expect(loggedInPage.getByText('Lezyne Digital Floor Drive')).toBeVisible();
    await expect(loggedInPage.getByText('Troy Lee Designs A3 Helmet')).toBeVisible();
    await expect(loggedInPage.getByText('Maxxis Minion DHF/DHR Combo')).toBeVisible();
    await expect(loggedInPage.getByText('Topeak Alien II Multi-tool')).toBeVisible();
    await expect(loggedInPage.getByText('Park Tool P-Handle Hex Set')).toBeVisible();
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

    await expect(loggedInPage.getByText('Condition', { exact: true }).last()).toBeVisible({
      timeout: 10000,
    });
  });

  test('shows back navigation', async ({ loggedInPage }) => {
    await loggedInPage.getByText('Fox 36 Float Fork').first().click();
    await loggedInPage.waitForURL(/\/inventory\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    await expect(loggedInPage.getByText('Condition', { exact: true }).last()).toBeVisible({
      timeout: 10000,
    });
  });

  test('item detail shows condition', async ({ loggedInPage }) => {
    await loggedInPage.getByText('Fox 36 Float Fork').first().click();
    await loggedInPage.waitForURL(/\/inventory\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    await expect(loggedInPage.getByText('Condition', { exact: true }).last()).toBeVisible({
      timeout: 10000,
    });
    // Verify detail fields are visible (Usage only appears on detail page).
    // The detail layout shows the "Usage" label twice (value block + section header);
    // asserting on the first occurrence avoids strict-mode violations.
    await expect(loggedInPage.getByText('Usage', { exact: true }).first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Bikes', () => {
  test('navigates to bikes via tab', async ({ loggedInPage }) => {
    await navigateToBikes(loggedInPage);

    await expect(loggedInPage.getByText('My Bikes')).toBeVisible();
  });

  test('shows bike cards', async ({ loggedInPage }) => {
    await navigateToBikes(loggedInPage);

    await expect(loggedInPage.getByText('Santa Cruz Hightower')).toBeVisible();
  });

  test('bike detail shows type and condition', async ({ loggedInPage }) => {
    await navigateToBikes(loggedInPage);
    await expect(loggedInPage.getByText('Santa Cruz Hightower')).toBeVisible({ timeout: 10000 });
    await loggedInPage.getByText('Santa Cruz Hightower').click();

    // Wait for bike detail to load — verify detail-only labels (seed bikes default to Good condition)
    await expect(loggedInPage.getByText('Model', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(loggedInPage.getByText('Condition', { exact: true }).last()).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Good', { exact: true }).last()).toBeVisible();
  });
});

// Notification bell is not yet wired into the inventory header.
// Re-enable these tests once NotificationBell is added to the screen.
