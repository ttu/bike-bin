import { test, expect, navigateToMessages } from './fixtures';
import { expect as baseExpect } from '@playwright/test';

test.describe('Conversations list', () => {
  test('shows Messages heading', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Messages').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('shows all 3 conversations', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Kai R.').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Marcus B.')).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Nina T.')).toBeVisible({
      timeout: 10000,
    });
  });

  test('shows item references', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Re: Park Tool PCS-10.3 Stand')).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Re: Maxxis Minion DHF/DHR Combo')).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Re: Troy Lee Designs A3 Helmet')).toBeVisible({
      timeout: 10000,
    });
  });

  test('shows last message previews', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    // Wait for conversations to load — at least one person name should be visible
    await expect(loggedInPage.getByText('Kai R.').first()).toBeVisible({ timeout: 10000 });

    // Check at least 2 of the 3 seed message previews are visible
    // (other E2E tests may send messages that change the Kai R. preview)
    const previews = [
      'Thanks! I will bring it back Monday.',
      'Would you take 30 for the pair?',
      'That would be perfect! Can I come by this weekend?',
    ];
    let found = 0;
    for (const text of previews) {
      const count = await loggedInPage.getByText(text).count();
      if (count > 0) found++;
    }
    baseExpect(found).toBeGreaterThanOrEqual(2);
  });

  test('shows time indicators', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    // Wait for conversations to load
    await expect(loggedInPage.getByText('Kai R.').first()).toBeVisible({
      timeout: 10000,
    });

    // Time indicators are relative and shift — verify at least one exists
    await expect(loggedInPage.getByText(/\d+[hd]/).first()).toBeVisible({ timeout: 10000 });
  });

  test('conversations are ordered by recency', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    // Wait for conversations to load
    await expect(loggedInPage.getByText('Kai R.').first()).toBeVisible({
      timeout: 10000,
    });

    const pageText = (await loggedInPage.textContent('body')) || '';
    const kaiPos = pageText.indexOf('Kai R.');
    const marcusPos = pageText.indexOf('Marcus B.');
    const ninaPos = pageText.indexOf('Nina T.');
    expect(kaiPos).toBeGreaterThan(-1);
    expect(marcusPos).toBeGreaterThan(-1);
    expect(ninaPos).toBeGreaterThan(-1);
    // Verify ordering: Kai (2h) before Marcus (8h) before Nina (20h)
    expect(kaiPos).toBeLessThan(marcusPos);
    expect(marcusPos).toBeLessThan(ninaPos);
  });
});

test.describe('Conversation detail', () => {
  test('opens conversation on click', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Kai R.').first()).toBeVisible({
      timeout: 10000,
    });
    await loggedInPage.getByText('Kai R.').first().click();

    await expect(loggedInPage).toHaveURL(/\/messages\//, {
      timeout: 10000,
    });
  });

  test('shows message input', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Kai R.').first()).toBeVisible({
      timeout: 10000,
    });
    await loggedInPage.getByText('Kai R.').first().click();

    await expect(loggedInPage.getByPlaceholder('Type a message...')).toBeVisible({
      timeout: 10000,
    });
  });

  test('shows chat messages', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Kai R.').first()).toBeVisible({
      timeout: 10000,
    });
    await loggedInPage.getByText('Kai R.').first().click();

    // Wait for conversation detail to load
    await expect(loggedInPage.getByPlaceholder('Type a message...')).toBeVisible({
      timeout: 10000,
    });

    const chatMessage = loggedInPage.getByText('Thanks! I will bring it back Monday.').first();
    await chatMessage.scrollIntoViewIfNeeded();
    await expect(chatMessage).toBeVisible({ timeout: 10000 });
  });

  test('shows item reference in thread', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Kai R.').first()).toBeVisible({
      timeout: 10000,
    });
    await loggedInPage.getByText('Kai R.').first().click();

    await expect(loggedInPage.getByText('Park Tool PCS-10.3 Stand').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('header back button returns to conversations list', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Kai R.').first()).toBeVisible({
      timeout: 10000,
    });
    await loggedInPage.getByText('Kai R.').first().click();

    await expect(loggedInPage.getByPlaceholder('Type a message...')).toBeVisible({
      timeout: 10000,
    });

    await loggedInPage.getByRole('button', { name: /^Back$/i }).click();

    await expect(loggedInPage.getByText('Kai R.').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Marcus B.')).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Nina T.')).toBeVisible({
      timeout: 10000,
    });
  });

  test('header back from listing opened via View returns to conversation thread', async ({
    loggedInPage,
  }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Kai R.').first()).toBeVisible({
      timeout: 10000,
    });
    await loggedInPage.getByText('Kai R.').first().click();

    await expect(
      loggedInPage.getByRole('textbox', { name: 'Type a message...' }).first(),
    ).toBeVisible({
      timeout: 10000,
    });

    await loggedInPage.getByRole('link', { name: 'View' }).click();

    await loggedInPage.waitForURL(/\/messages\/item\/[^/]+/, { timeout: 10000 });
    await expect(loggedInPage.getByText('Condition')).toBeVisible({ timeout: 10000 });

    await loggedInPage.getByRole('button', { name: /^Back$/i }).click();

    await loggedInPage.waitForURL(
      (url) => /^\/messages\/[^/]+$/.test(url.pathname) && !url.pathname.includes('/item'),
      { timeout: 10000 },
    );

    // RN web can keep multiple message inputs in the DOM (stack); target one visible textbox.
    const messageInput = loggedInPage.getByRole('textbox', { name: 'Type a message...' }).first();
    await expect(messageInput).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Park Tool PCS-10.3 Stand').first()).toBeVisible({
      timeout: 10000,
    });
  });
});
