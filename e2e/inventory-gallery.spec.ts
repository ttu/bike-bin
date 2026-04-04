import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

/** Matches `inventory.viewMode.toggleA11y` — single control toggles list ↔ gallery. */
const LAYOUT_TOGGLE_NAME = 'Switch between list and gallery layout';

/** Avoid strict-mode / hidden-node issues when the same label appears twice (e.g. gallery name fallback). */
function visibleExactText(page: Page, text: string) {
  return page.getByText(text, { exact: true }).filter({ visible: true });
}

/**
 * Inventory gallery view: list/gallery toggle and thumbnail grid.
 * Requires seeded inventory (same as inventory-authenticated.spec.ts).
 */
test.describe('Inventory gallery view', () => {
  test('switches to gallery, hides row titles, and opens item detail from a tile', async ({
    loggedInPage,
  }) => {
    // Use a seed item that inventory-crud does not rename (RaceFace is edited to "RaceFace Cranks Updated").
    const itemName = 'Maxxis Minion DHF/DHR Combo';

    // FlatList may not mount off-screen rows on web; narrow to Components so the target row is in the DOM.
    await expect(
      loggedInPage.getByRole('switch', { name: LAYOUT_TOGGLE_NAME, exact: true }),
    ).toBeVisible({ timeout: 15000 });
    await loggedInPage.getByRole('button', { name: 'Components' }).click();
    await expect(visibleExactText(loggedInPage, itemName)).toBeVisible({ timeout: 10000 });
    const layoutToggle = loggedInPage.getByRole('switch', {
      name: LAYOUT_TOGGLE_NAME,
      exact: true,
    });
    await expect(layoutToggle).toBeVisible();

    await layoutToggle.click();

    // Gallery hides list row category lines (e.g. "Components · …"); tiles may show the name when there is no photo.
    await expect(loggedInPage.getByText(/Components ·/)).toHaveCount(0);

    await loggedInPage.getByRole('button', { name: itemName }).click();
    await loggedInPage.waitForURL(/\/inventory\/[a-zA-Z0-9-]+/, { timeout: 10000 });
    // Gallery tiles without photos duplicate the name (label + inner text); detail can too — assert visible copy.
    await expect(visibleExactText(loggedInPage, itemName)).toBeVisible({ timeout: 10000 });
  });

  test('switches back to list and shows row titles again', async ({ loggedInPage }) => {
    const itemName = 'Fox 36 Float Fork';

    await expect(
      loggedInPage.getByRole('switch', { name: LAYOUT_TOGGLE_NAME, exact: true }),
    ).toBeVisible({ timeout: 15000 });
    await loggedInPage.getByRole('button', { name: 'Components' }).click();
    await expect(visibleExactText(loggedInPage, itemName)).toBeVisible({ timeout: 10000 });
    await loggedInPage.getByRole('switch', { name: LAYOUT_TOGGLE_NAME, exact: true }).click();
    await expect(loggedInPage.getByText(/Components ·/)).toHaveCount(0);

    await loggedInPage.getByRole('switch', { name: LAYOUT_TOGGLE_NAME, exact: true }).click();
    await expect(visibleExactText(loggedInPage, itemName)).toBeVisible({ timeout: 10000 });
  });
});
