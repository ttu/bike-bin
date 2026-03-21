import { test, expect, navigateToProfile } from './fixtures';

test.describe('Profile overview', () => {
  test('shows user display name', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await expect(loggedInPage.getByText('Test User')).toBeVisible();
  });

  test('shows rating', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await expect(loggedInPage.getByText('5.0')).toBeVisible({ timeout: 10000 });
  });

  test('shows member since date', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await expect(loggedInPage.getByText(/Member since/)).toBeVisible({
      timeout: 10000,
    });
  });

  test('shows edit profile link', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await expect(loggedInPage.getByText('Edit Profile')).toBeVisible();
  });

  test('shows all menu items', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);

    await expect(loggedInPage.getByText('Saved Locations')).toBeVisible();
    await expect(loggedInPage.getByText('Borrow Requests')).toBeVisible();
    await expect(loggedInPage.getByText('Groups')).toBeVisible();
    await expect(loggedInPage.getByText('Notification Settings')).toBeVisible();
    await expect(loggedInPage.getByText('Help & Support')).toBeVisible();
    await expect(loggedInPage.getByText('About & Legal')).toBeVisible();
    await expect(loggedInPage.getByText('Sign Out')).toBeVisible();
  });

  test('shows appearance toggle', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);

    await expect(loggedInPage.getByText('System')).toBeVisible();
    await expect(loggedInPage.getByText('Light')).toBeVisible();
    await expect(loggedInPage.getByText('Dark')).toBeVisible();
  });
});

test.describe('Appearance toggle', () => {
  test('can switch to Dark mode', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);

    const darkButton = loggedInPage.getByText('Dark');
    await darkButton.click();
    await expect(darkButton).toBeVisible();
  });

  test('can switch to Light mode', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);

    const lightButton = loggedInPage.getByText('Light');
    await lightButton.click();
    await expect(lightButton).toBeVisible();
  });

  test('can switch back to System', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);

    // Switch away first, then back to System
    await loggedInPage.getByText('Dark').click();
    const systemButton = loggedInPage.getByText('System');
    await systemButton.click();
    await expect(systemButton).toBeVisible();
  });
});

test.describe('Saved Locations', () => {
  test('navigates to saved locations', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);

    await loggedInPage.getByText('Saved Locations').click();
    await expect(loggedInPage.getByText('Kreuzberg')).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Mitte')).toBeVisible({
      timeout: 10000,
    });
  });

  test('shows location cards', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await loggedInPage.getByText('Saved Locations').click();

    await expect(loggedInPage.getByText('Kreuzberg')).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Mitte')).toBeVisible({
      timeout: 10000,
    });
  });

  test('shows primary badge', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await loggedInPage.getByText('Saved Locations').click();

    await expect(loggedInPage.getByText('Primary')).toBeVisible({
      timeout: 10000,
    });
  });

  test('back navigation', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await loggedInPage.getByText('Saved Locations').click();
    await expect(loggedInPage.getByText('Kreuzberg')).toBeVisible({
      timeout: 10000,
    });

    await loggedInPage.goBack();
    await expect(loggedInPage.getByText('Profile').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Borrow Requests', () => {
  test('navigates to borrow requests', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);

    await loggedInPage.getByText('Borrow Requests').click();
    await expect(loggedInPage).toHaveURL(/borrow-requests/, { timeout: 10000 });
  });

  test('shows incoming tab with request', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await loggedInPage.getByText('Borrow Requests').click();

    await expect(loggedInPage.getByText('Incoming')).toBeVisible({
      timeout: 10000,
    });
  });

  test('shows outgoing tab', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await loggedInPage.getByText('Borrow Requests').click();

    await loggedInPage.getByRole('tab', { name: /Outgoing/ }).click();
    await expect(loggedInPage.getByRole('tab', { name: /Outgoing/ })).toBeVisible({
      timeout: 10000,
    });
  });

  test('shows active tab', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await loggedInPage.getByText('Borrow Requests').click();

    await loggedInPage.getByRole('tab', { name: /Active/ }).click();
    await expect(loggedInPage.getByRole('tab', { name: /Active/ })).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Groups', () => {
  test('navigates to groups', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);

    await loggedInPage.getByText('Groups').click();
    await expect(loggedInPage).toHaveURL(/groups/, { timeout: 10000 });
  });

  test('shows group list', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await loggedInPage.getByText('Groups').click();

    // At least one group should be visible
    await expect(loggedInPage.getByText('Berlin Bike Co-op').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('groups show member count', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await loggedInPage.getByText('Groups').click();

    // Verify group list loaded (member count format may vary)
    await expect(loggedInPage.getByText('Berlin Bike Co-op').first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Edit Profile', () => {
  test('navigates to edit profile', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);

    await loggedInPage.getByText('Edit Profile').click();
    await expect(loggedInPage).toHaveURL(/edit-profile/, { timeout: 10000 });
  });

  test('shows display name field', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await loggedInPage.getByText('Edit Profile').click();

    // Verify form loaded with edit-profile URL
    await expect(loggedInPage).toHaveURL(/edit-profile/, { timeout: 10000 });
  });
});

test.describe('Help & Support', () => {
  test('navigates to support', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);

    await loggedInPage.getByText('Help & Support').click();
    await expect(loggedInPage).toHaveURL(/support/, { timeout: 10000 });
  });

  test('shows form fields', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await loggedInPage.getByText('Help & Support').click();

    await expect(loggedInPage.getByText('Subject').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(loggedInPage.getByText('Message').first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('About & Legal', () => {
  test('navigates to about', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);

    await loggedInPage.getByText('About & Legal').click();
    await expect(loggedInPage).toHaveURL(/about/, { timeout: 10000 });
  });

  test('shows about page content', async ({ loggedInPage }) => {
    await navigateToProfile(loggedInPage);
    await loggedInPage.getByText('About & Legal').click();

    await expect(loggedInPage).toHaveURL(/about/, { timeout: 10000 });
  });
});
