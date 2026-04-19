import { test, expect, navigateToMessages, navigateToSearch } from './fixtures';

// ---------------------------------------------------------------------------
// Messaging actions — send message, contact from listing
// ---------------------------------------------------------------------------

test.describe('Send a message', () => {
  test('sends a message in an existing conversation', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    // Open conversation with Kai R.
    await expect(loggedInPage.getByText('Kai R.')).toBeVisible({ timeout: 10000 });
    await loggedInPage.getByText('Kai R.').click();

    // Wait for conversation detail
    await expect(loggedInPage.getByPlaceholder('Type a message...')).toBeVisible({
      timeout: 10000,
    });

    // Type and send a message
    const messageInput = loggedInPage.getByPlaceholder('Type a message...');
    await messageInput.fill('Hello from E2E test!');

    // Press send (look for send button)
    await loggedInPage.getByRole('button', { name: /send/i }).click();

    // Verify the sent message appears in the chat
    await expect(loggedInPage.getByText('Hello from E2E test!').first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Contact from listing', () => {
  test('starts a conversation from a search listing detail', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    // Search for items
    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('a');
    await searchInput.press('Enter');

    // Wait for results
    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });

    // Click a result to open listing detail
    const resultItem = loggedInPage
      .getByText(/Shimano|Continental|Brompton|Kryptonite|Tubus|Ortlieb|Vittoria|Brooks/)
      .first();
    await resultItem.click();

    // Wait for listing detail
    await loggedInPage.waitForURL(/\/search\/[a-zA-Z0-9-]+/, { timeout: 10000 });
    await expect(loggedInPage.getByText('Condition')).toBeVisible({ timeout: 10000 });

    // "Contact" or "Request Borrow" button should be visible (depending on availability)
    const contactButton = loggedInPage.getByRole('button', { name: /Contact|Request Borrow/i });
    await expect(contactButton.first()).toBeVisible({ timeout: 10000 });

    // Click contact
    await contactButton.first().click();

    // Should navigate to a conversation
    await loggedInPage.waitForURL(/\/messages\//, { timeout: 10000 });

    // Message input should be visible
    await expect(loggedInPage.getByPlaceholder('Type a message...')).toBeVisible({
      timeout: 10000,
    });
  });

  test('contact owner of Fox DHX2 Rear Shock from search', async ({ loggedInPage }) => {
    await navigateToSearch(loggedInPage);

    // Search for the specific item
    const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
    await searchInput.fill('Fox DHX2');
    await searchInput.press('Enter');

    // Wait for results
    await expect(loggedInPage.getByText(/\d+ results? within \d+ km/)).toBeVisible({
      timeout: 10000,
    });

    // Click the Fox DHX2 Rear Shock result
    await loggedInPage.getByText('Fox DHX2 Rear Shock').click();

    // Wait for listing detail to load
    await loggedInPage.waitForURL(/\/search\/[a-zA-Z0-9-]+/, { timeout: 10000 });
    await expect(loggedInPage.getByText('Condition')).toBeVisible({ timeout: 10000 });

    // Verify item owner is Kai R.
    await expect(loggedInPage.getByText('Kai R.')).toBeVisible();

    // Click Contact button
    const contactButton = loggedInPage.getByRole('button', { name: /Contact/i });
    await expect(contactButton.first()).toBeVisible({ timeout: 10000 });
    await contactButton.first().click();

    // Should navigate to a conversation
    await loggedInPage.waitForURL(/\/messages\//, { timeout: 10000 });

    // Message input should be visible — conversation created successfully
    await expect(loggedInPage.getByPlaceholder('Type a message...')).toBeVisible({
      timeout: 10000,
    });
  });
});
