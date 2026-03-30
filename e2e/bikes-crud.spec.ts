import { test, expect } from './fixtures';

// ---------------------------------------------------------------------------
// Bike CRUD — add, edit, delete, mount/unmount parts
// ---------------------------------------------------------------------------

async function navigateToBikes(page: import('@playwright/test').Page) {
  await page.getByText(/Bikes\s*→/).click();
  await expect(page.getByText('My Bikes')).toBeVisible({ timeout: 10000 });
}

async function waitForBikeDetail(page: import('@playwright/test').Page) {
  await page.waitForURL(/\/bikes\/[a-zA-Z0-9-]+/, { timeout: 10000 });
  await page.waitForTimeout(500);
}

test.describe('Add bike', () => {
  test('creates a new bike with required fields', async ({ loggedInPage }) => {
    await navigateToBikes(loggedInPage);

    // Click FAB to add bike
    await loggedInPage.getByRole('button', { name: /add bike/i }).click();
    await expect(loggedInPage.getByText('Add Bike')).toBeVisible({ timeout: 10000 });

    // Fill name
    await loggedInPage.getByPlaceholder('e.g. My Road Bike').fill('E2E Test Bike');

    // Select type — Mountain (use last to skip any visible in bike list cards)
    const mountainChip = loggedInPage.getByText('Mountain', { exact: true }).last();
    await mountainChip.scrollIntoViewIfNeeded();
    await mountainChip.click();

    // Fill optional brand
    await loggedInPage.getByPlaceholder('e.g. Canyon').fill('Giant');

    // Save
    const saveButton = loggedInPage.getByRole('button', { name: /save bike/i });
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.click();

    // Should return to bike list with new bike visible
    await expect(loggedInPage.getByText('E2E Test Bike')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Edit bike', () => {
  test('edits an existing bike brand', async ({ loggedInPage }) => {
    await navigateToBikes(loggedInPage);

    // Open bike detail
    await loggedInPage.getByText('Santa Cruz Hightower').click();
    await waitForBikeDetail(loggedInPage);

    // Click edit (pencil icon — second button after Back, same as inventory)
    await loggedInPage.getByRole('button').nth(1).click();
    await loggedInPage.waitForURL(/\/edit\//, { timeout: 10000 });
    await expect(loggedInPage.getByText('Edit Bike')).toBeVisible({ timeout: 10000 });

    // Change brand
    const brandInput = loggedInPage.getByPlaceholder('e.g. Canyon');
    await brandInput.click({ clickCount: 3 });
    await brandInput.press('Backspace');
    await brandInput.pressSequentially('Santa Cruz Updated');

    // Save
    const saveButton = loggedInPage.getByRole('button', { name: /save bike/i });
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.click();

    // Wait for PATCH to complete
    await loggedInPage.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/bikes') && resp.request().method() === 'PATCH',
      { timeout: 10000 },
    );

    // Navigate to bikes list and verify updated brand
    const tablist = loggedInPage.getByRole('tablist');
    await tablist.getByRole('tab', { name: /Inventory/ }).click();
    await loggedInPage.getByText(/Bikes\s*→/).click();
    await expect(loggedInPage.getByText('Santa Cruz Updated')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Delete bike', () => {
  test('deletes a bike from edit page', async ({ loggedInPage }) => {
    await navigateToBikes(loggedInPage);

    // First create a bike to delete
    await loggedInPage.getByRole('button', { name: /add bike/i }).click();
    await expect(loggedInPage.getByText('Add Bike')).toBeVisible({ timeout: 10000 });

    await loggedInPage.getByPlaceholder('e.g. My Road Bike').fill('Bike To Delete');

    const cityChip = loggedInPage.getByText('City', { exact: true }).last();
    await cityChip.scrollIntoViewIfNeeded();
    await cityChip.click();

    const saveButton = loggedInPage.getByRole('button', { name: /save bike/i });
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.click();

    await expect(loggedInPage.getByText('Bike To Delete')).toBeVisible({ timeout: 10000 });

    // Open the bike detail
    await loggedInPage.getByText('Bike To Delete').click();
    await waitForBikeDetail(loggedInPage);

    // Open edit screen (pencil button — second button after Back)
    await loggedInPage.getByRole('button').nth(1).click();
    await loggedInPage.waitForURL(/\/edit\//, { timeout: 10000 });
    await expect(loggedInPage.getByText('Edit Bike')).toBeVisible({ timeout: 10000 });

    // Click delete — this opens a ConfirmDialog (not window.confirm)
    const deleteButton = loggedInPage.getByRole('button', { name: /delete bike/i });
    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click();

    // Confirm dialog appears — click "Delete" confirmation button (last one, after "Cancel")
    await expect(loggedInPage.getByText('Are you sure you want to delete this bike')).toBeVisible({
      timeout: 5000,
    });
    // The dialog has Cancel and Delete buttons — Delete is the last button in actions
    await loggedInPage
      .getByRole('button', { name: /^delete$/i })
      .last()
      .click();

    // Should navigate to bike list — wait for URL
    await loggedInPage.waitForURL(/\/bikes$/, { timeout: 10000 });

    // Bike should be gone (use first to avoid strict mode)
    await expect(loggedInPage.getByText('Bike To Delete').first()).toBeHidden({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Mount / Unmount items to bikes
// ---------------------------------------------------------------------------

test.describe('Mount item to bike', () => {
  test('attaches a stored item to a bike', async ({ loggedInPage }) => {
    await navigateToBikes(loggedInPage);

    // Open Santa Cruz Hightower detail
    await loggedInPage.getByText('Santa Cruz Hightower').click();
    await waitForBikeDetail(loggedInPage);

    // Click "Attach Part" button in the mounted parts header
    await loggedInPage.getByRole('button', { name: /attach part/i }).click();

    // Picker dialog should show available stored items
    await expect(loggedInPage.getByText('Select Part to Attach')).toBeVisible({ timeout: 10000 });

    // Click the "Attach Part" button next to a stored item in the picker
    // Each picker item has its own "Attach Part" button
    const attachButtons = loggedInPage.getByRole('button', { name: /attach part/i });
    // First button is the header one (behind dialog), subsequent ones are in the picker
    await attachButtons.last().click();

    // Dialog should close — wait for it
    await expect(loggedInPage.getByText('Select Part to Attach')).toBeHidden({ timeout: 10000 });
  });

  test('detaches a mounted part from a bike', async ({ loggedInPage }) => {
    await navigateToBikes(loggedInPage);

    // Open Santa Cruz Hightower — Fox 36 Float Fork is mounted on it
    await loggedInPage.getByText('Santa Cruz Hightower').click();
    await waitForBikeDetail(loggedInPage);

    // Scroll down to see mounted parts — use keyboard to scroll the page
    await loggedInPage.keyboard.press('End');
    await loggedInPage.waitForTimeout(500);

    // Mounted Parts section should be visible with Detach button
    await expect(loggedInPage.getByText('Mounted Parts')).toBeVisible({ timeout: 10000 });

    // Click detach IconButton on first mounted part (may have 2 after attach test)
    await loggedInPage
      .getByRole('button', { name: /^detach$/i })
      .first()
      .click();

    // Confirmation dialog appears
    await expect(loggedInPage.getByText(/Detach.*from this bike/)).toBeVisible({ timeout: 5000 });

    // Click confirm detach button in dialog (last Detach button, after Cancel)
    await loggedInPage
      .getByRole('button', { name: /^detach$/i })
      .last()
      .click();

    // Wait for mutation to complete
    await loggedInPage.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/items') && resp.request().method() === 'PATCH',
      { timeout: 10000 },
    );

    // After detach, the detach confirmation dialog should close
    await expect(loggedInPage.getByText(/Detach.*from this bike/)).toBeHidden({ timeout: 10000 });
  });
});
