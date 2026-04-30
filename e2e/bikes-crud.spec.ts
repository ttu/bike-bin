import { test, expect, navigateToBikes, expectFirstVisibleByText } from './fixtures';

// ---------------------------------------------------------------------------
// Bike CRUD — add, edit, delete, mount/unmount parts
// ---------------------------------------------------------------------------

async function waitForBikeDetail(page: import('@playwright/test').Page) {
  await page.waitForURL(/\/bikes\/[a-zA-Z0-9-]+/, { timeout: 10000 });
  await page.waitForTimeout(500);
}

test.describe('Add bike', () => {
  test('shows validation when distance is not a number', async ({ loggedInPage }) => {
    await navigateToBikes(loggedInPage);

    await loggedInPage.getByRole('button', { name: /add bike/i }).click();
    await expect(loggedInPage.getByText('Add Bike')).toBeVisible({ timeout: 10000 });

    await loggedInPage.getByPlaceholder('e.g. My Road Bike').fill('E2E Invalid Distance');
    const gravelChip = loggedInPage.getByText('Gravel', { exact: true }).last();
    await gravelChip.scrollIntoViewIfNeeded();
    await gravelChip.click();

    await loggedInPage.getByPlaceholder('e.g. 3200').fill('not-a-number');
    const saveButton = loggedInPage.getByRole('button', { name: /save bike/i });
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.click();

    await expect(
      loggedInPage.getByText('Enter a valid distance in kilometers').first(),
    ).toBeVisible({
      timeout: 5000,
    });
  });

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

  test('creates bike with distance, hours, condition, notes and shows them on detail', async ({
    loggedInPage,
  }) => {
    await navigateToBikes(loggedInPage);

    await loggedInPage.getByRole('button', { name: /add bike/i }).click();
    await expect(loggedInPage.getByText('Add Bike')).toBeVisible({ timeout: 10000 });

    await loggedInPage.getByPlaceholder('e.g. My Road Bike').fill('E2E Usage Bike');

    const touringChip = loggedInPage.getByText('Touring', { exact: true }).last();
    await touringChip.scrollIntoViewIfNeeded();
    await touringChip.click();

    await loggedInPage.getByPlaceholder('e.g. 3200').fill('1250');
    await loggedInPage.getByPlaceholder('e.g. 120').fill('42.5');

    const wornChip = loggedInPage.getByText('Worn', { exact: true }).last();
    await wornChip.scrollIntoViewIfNeeded();
    await wornChip.click();

    await loggedInPage
      .getByPlaceholder('Service history, setup notes, etc.')
      .fill('E2E fork service at 40h');

    const saveButton = loggedInPage.getByRole('button', { name: /save bike/i });
    await saveButton.scrollIntoViewIfNeeded();
    await Promise.all([
      loggedInPage.waitForResponse(
        (resp) => resp.url().includes('/rest/v1/bikes') && resp.request().method() === 'POST',
        { timeout: 15000 },
      ),
      saveButton.click(),
    ]);

    await expect(loggedInPage.getByText('E2E Usage Bike')).toBeVisible({ timeout: 15000 });
    await loggedInPage.getByText('E2E Usage Bike').click();
    await waitForBikeDetail(loggedInPage);

    await expectFirstVisibleByText(loggedInPage, /^Condition$/, { timeout: 10000 });
    await expect(loggedInPage.getByText('Worn', { exact: true })).toBeVisible();

    await expect(loggedInPage.getByText(/(1250|1,250|1\.250)(\s|\.0)*km/i)).toBeVisible();
    await expect(loggedInPage.getByText(/42[.,]5\s*h/i)).toBeVisible();

    await expect(loggedInPage.getByText('Notes', { exact: true })).toBeVisible();
    await expect(loggedInPage.getByText('E2E fork service at 40h')).toBeVisible();
  });
});

test.describe('Edit bike', () => {
  test('edits an existing bike brand', async ({ loggedInPage }) => {
    await navigateToBikes(loggedInPage);

    // Open bike detail
    await loggedInPage.getByText('Santa Cruz Hightower').click();
    await waitForBikeDetail(loggedInPage);

    // Edit action must be targeted explicitly — other buttons (mounted parts, etc.) share the page.
    await loggedInPage.getByRole('button', { name: /^Edit$/i }).click();
    await loggedInPage.waitForURL(/\/edit\//, { timeout: 10000 });
    await expect(loggedInPage.getByText('Edit Bike')).toBeVisible({ timeout: 10000 });

    // Change brand
    const brandInput = loggedInPage.getByPlaceholder('e.g. Canyon');
    await brandInput.click({ clickCount: 3 });
    await brandInput.press('Backspace');
    await brandInput.pressSequentially('Santa Cruz Updated');

    // Save (edit screen uses the same primary action pattern as inventory update)
    const saveButton = loggedInPage.getByRole('button', { name: /update bike/i });
    await saveButton.scrollIntoViewIfNeeded();

    // Set up the response wait BEFORE the click — otherwise a fast PATCH can resolve
    // before the listener attaches, causing the wait to time out.
    const patchPromise = loggedInPage.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/bikes') && resp.request().method() === 'PATCH',
      { timeout: 10000 },
    );
    await saveButton.click();
    await patchPromise;

    // Navigate to bikes list and verify updated brand
    const tablist = loggedInPage.getByRole('tablist');
    await tablist.getByRole('tab', { name: /^Bikes$/i }).click();
    // BikeCard shows "Brand · Year"; avoid /Santa Cruz Updated/ (matches detail + list).
    await expect(loggedInPage.getByText('Santa Cruz Updated · 2024', { exact: true })).toBeVisible({
      timeout: 10000,
    });
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

    await loggedInPage.getByRole('button', { name: /^Edit$/i }).click();
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
  test('opens mounted part in item detail and back returns to bike', async ({ loggedInPage }) => {
    await navigateToBikes(loggedInPage);

    await loggedInPage.getByText('Santa Cruz Hightower').click();
    await waitForBikeDetail(loggedInPage);

    await loggedInPage.keyboard.press('End');
    await loggedInPage.waitForTimeout(500);

    await expect(loggedInPage.getByText('Mounted Parts')).toBeVisible({ timeout: 10000 });

    await loggedInPage.getByRole('button', { name: /View Fox 36 Float Fork/i }).click();
    await loggedInPage.waitForURL(/\/inventory\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    await expectFirstVisibleByText(loggedInPage, /^Condition$/, { timeout: 10000 });

    await loggedInPage.getByRole('button', { name: /^Back$/i }).click();
    await loggedInPage.waitForURL(/\/bikes\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    await expect(loggedInPage.getByText('Mounted Parts')).toBeVisible({ timeout: 10000 });
    // Detail title is the second match: list screen can leave a hidden card in the DOM (web).
    const bikeTitle = loggedInPage.getByText('Santa Cruz Hightower').nth(1);
    await bikeTitle.scrollIntoViewIfNeeded();
    await expect(bikeTitle).toBeVisible({ timeout: 10000 });
  });

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
