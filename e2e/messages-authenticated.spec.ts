import { test, expect, navigateToMessages } from './fixtures';

test.describe('Conversations list', () => {
  test('shows Messages heading', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Messages').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('shows all 3 conversations', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Kai R.')).toBeVisible({
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

    await expect(loggedInPage.getByText('Thanks! I will bring it back Monday.')).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Would you take 30 for the pair?')).toBeVisible({
      timeout: 10000,
    });
    await expect(
      loggedInPage.getByText('That would be perfect! Can I come by this weekend?'),
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows time indicators', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    // Wait for conversations to load
    await expect(loggedInPage.getByText('Kai R.')).toBeVisible({
      timeout: 10000,
    });

    // Time indicators are relative and shift — verify at least one exists
    await expect(loggedInPage.getByText(/\d+[hd]/).first()).toBeVisible({ timeout: 10000 });
  });

  test('conversations are ordered by recency', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    // Wait for conversations to load
    await expect(loggedInPage.getByText('Kai R.')).toBeVisible({
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

    await expect(loggedInPage.getByText('Kai R.')).toBeVisible({
      timeout: 10000,
    });
    await loggedInPage.getByText('Kai R.').click();

    await expect(loggedInPage).toHaveURL(/\/messages\//, {
      timeout: 10000,
    });
  });

  test('shows message input', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Kai R.')).toBeVisible({
      timeout: 10000,
    });
    await loggedInPage.getByText('Kai R.').click();

    await expect(loggedInPage.getByPlaceholder('Type a message...')).toBeVisible({
      timeout: 10000,
    });
  });

  test('shows chat messages', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Kai R.')).toBeVisible({
      timeout: 10000,
    });
    await loggedInPage.getByText('Kai R.').click();

    // Wait for conversation detail to load
    await expect(loggedInPage.getByPlaceholder('Type a message...')).toBeVisible({
      timeout: 10000,
    });

    await expect(loggedInPage.getByText('Thanks! I will bring it back Monday.').last()).toBeVisible(
      { timeout: 10000 },
    );
  });

  test('shows item reference in thread', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Kai R.')).toBeVisible({
      timeout: 10000,
    });
    await loggedInPage.getByText('Kai R.').click();

    await expect(loggedInPage.getByText('Park Tool PCS-10.3 Stand').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('back navigation returns to list', async ({ loggedInPage }) => {
    await navigateToMessages(loggedInPage);

    await expect(loggedInPage.getByText('Kai R.')).toBeVisible({
      timeout: 10000,
    });
    await loggedInPage.getByText('Kai R.').click();

    // Wait for detail to load
    await expect(loggedInPage.getByPlaceholder('Type a message...')).toBeVisible({
      timeout: 10000,
    });

    // Navigate back
    await loggedInPage.goBack();

    // Verify we're back on the conversations list
    await expect(loggedInPage.getByText('Kai R.')).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Marcus B.')).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Nina T.')).toBeVisible({
      timeout: 10000,
    });
  });
});
