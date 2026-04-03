import { test, expect } from './fixtures';

/**
 * Inventory gallery view: icon-only list/gallery toggle and thumbnail grid.
 * Requires seeded inventory (same as inventory-authenticated.spec.ts).
 */
test.describe('Inventory gallery view', () => {
  test('switches to gallery, hides row titles, and opens item detail from a tile', async ({
    loggedInPage,
  }) => {
    const itemName = 'RaceFace Turbine R Cranks';

    // FlatList may not mount off-screen rows on web; narrow to Components so the target row is in the DOM.
    await expect(
      loggedInPage.getByRole('button', { name: 'Gallery view', exact: true }),
    ).toBeVisible({ timeout: 15000 });
    await loggedInPage.getByRole('button', { name: 'Components' }).click();
    await expect(loggedInPage.getByText(itemName)).toBeVisible({ timeout: 10000 });
    const galleryToggle = loggedInPage.getByRole('button', { name: 'Gallery view', exact: true });
    await expect(galleryToggle).toBeVisible();

    await galleryToggle.click();

    await expect(loggedInPage.getByText(itemName)).toHaveCount(0);

    await loggedInPage.getByRole('button', { name: itemName }).click();
    await loggedInPage.waitForURL(/\/inventory\/[a-zA-Z0-9-]+/, { timeout: 10000 });
    await expect(loggedInPage.getByText(itemName)).toBeVisible({ timeout: 10000 });
  });

  test('switches back to list and shows row titles again', async ({ loggedInPage }) => {
    const itemName = 'Fox 36 Float Fork';

    await expect(
      loggedInPage.getByRole('button', { name: 'Gallery view', exact: true }),
    ).toBeVisible({ timeout: 15000 });
    await loggedInPage.getByRole('button', { name: 'Components' }).click();
    await expect(loggedInPage.getByText(itemName)).toBeVisible({ timeout: 10000 });
    await loggedInPage.getByRole('button', { name: 'Gallery view', exact: true }).click();
    await expect(loggedInPage.getByText(itemName)).toHaveCount(0);

    await loggedInPage.getByRole('button', { name: 'List view', exact: true }).click();
    await expect(loggedInPage.getByText(itemName)).toBeVisible({ timeout: 10000 });
  });
});
