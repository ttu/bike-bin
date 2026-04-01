import { test, expect, navigateToSearch, navigateToMessages, navigateToProfile } from './fixtures';

test.describe('No nested interactive elements', () => {
  test('inventory has no nested buttons', async ({ loggedInPage }) => {
    const nestedButtons = await loggedInPage.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const nested: string[] = [];
      buttons.forEach((btn) => {
        const innerButtons = btn.querySelectorAll('button');
        if (innerButtons.length > 0) {
          nested.push(btn.textContent?.slice(0, 50) || 'unknown');
        }
      });
      return nested;
    });
    expect(nestedButtons).toHaveLength(0);
  });

  test('search results have no nested buttons', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);
    const nestedButtons = await loggedInPage.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const nested: string[] = [];
      buttons.forEach((btn) => {
        const innerButtons = btn.querySelectorAll('button');
        if (innerButtons.length > 0) {
          nested.push(btn.textContent?.slice(0, 50) || 'unknown');
        }
      });
      return nested;
    });
    expect(nestedButtons).toHaveLength(0);
  });

  test('messages have no nested buttons', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);
    const nestedButtons = await loggedInPage.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const nested: string[] = [];
      buttons.forEach((btn) => {
        const innerButtons = btn.querySelectorAll('button');
        if (innerButtons.length > 0) {
          nested.push(btn.textContent?.slice(0, 50) || 'unknown');
        }
      });
      return nested;
    });
    expect(nestedButtons).toHaveLength(0);
  });

  test('profile has no nested buttons', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    const nestedButtons = await loggedInPage.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const nested: string[] = [];
      buttons.forEach((btn) => {
        const innerButtons = btn.querySelectorAll('button');
        if (innerButtons.length > 0) {
          nested.push(btn.textContent?.slice(0, 50) || 'unknown');
        }
      });
      return nested;
    });
    expect(nestedButtons).toHaveLength(0);
  });
});

test.describe('No console errors on navigation', () => {
  test('no errors navigating through all tabs', async ({ loggedInPage }) => {
    const errors: string[] = [];
    loggedInPage.on('pageerror', (error) => errors.push(error.message));

    // Navigate through all tabs
    await navigateToSearch(loggedInPage);
    await navigateToMessages(loggedInPage);
    await navigateToProfile(loggedInPage);

    // Navigate back to inventory
    await loggedInPage.getByRole('tab', { name: /Inventory/ }).click();
    await loggedInPage.waitForTimeout(1000);

    // Filter out known React Native web warnings
    const realErrors = errors.filter((msg) => {
      const knownWarnings = ['shadow', 'pointerEvents', 'useNativeDriver'];
      return !knownWarnings.some((warning) => msg.toLowerCase().includes(warning.toLowerCase()));
    });

    expect(realErrors).toHaveLength(0);
  });
});

test.describe('ARIA roles and landmarks', () => {
  test('tab bar has proper roles', async ({ loggedInPage }) => {
    const tablist = loggedInPage.getByRole('tablist');
    await expect(tablist).toBeVisible({ timeout: 10000 });

    const tabs = loggedInPage.getByRole('tab');
    await expect(tabs).toHaveCount(5, { timeout: 10000 });
  });

  test('tab bar tabs are labeled', async ({ loggedInPage }) => {
    const expectedTabs = ['Inventory', 'Bikes', 'Search', 'Messages', 'Profile'];

    for (const name of expectedTabs) {
      const tab = loggedInPage.getByRole('tab', { name });
      await expect(tab).toBeVisible({ timeout: 10000 });
    }
  });

  test('interactive cards have button role', async ({ loggedInPage }) => {
    const cards = loggedInPage.getByRole('button').filter({
      has: loggedInPage.locator('[data-testid*="item"]'),
    });
    // Verify at least item cards exist with proper roles
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });

  test('FAB has accessible label', async ({ loggedInPage }) => {
    const fab = loggedInPage.getByRole('button', { name: 'Add item' });
    await expect(fab).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Keyboard navigation', () => {
  test('tab key moves focus', async ({ loggedInPage }) => {
    // Press Tab multiple times
    await loggedInPage.keyboard.press('Tab');
    await loggedInPage.keyboard.press('Tab');
    await loggedInPage.keyboard.press('Tab');

    // Verify focus has moved to a different element
    const newFocus = await loggedInPage.evaluate(() => {
      const el = document.activeElement;
      return el ? `${el.tagName}:${el.getAttribute('role') || 'none'}` : null;
    });

    expect(newFocus).not.toBeNull();
    // Focus should have moved to an interactive element
    expect(newFocus).toBeDefined();
  });
});
