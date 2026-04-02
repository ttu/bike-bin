import { test as base } from '@playwright/test';
import { test, expect, navigateToProfile } from './fixtures';

base.describe('Authentication', () => {
  base.describe('Dev Login', () => {
    base('logs in via Dev Login and redirects to inventory', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText('Bike Bin')).toBeVisible();
      await expect(page.getByText('From bikers to bikers')).toBeVisible();

      await page.getByRole('button', { name: 'Dev Login' }).click();

      await page.waitForURL(/\/inventory/, { timeout: 15000 });
      await expect(page).toHaveURL(/\/inventory/);
    });

    base('logs in as another test user via Other test users', async ({ page }) => {
      await page.goto('/');
      await page.waitForURL(/\/login/);

      await page.getByRole('button', { name: /Other test users/ }).click();
      await page.getByRole('button', { name: /Marcus B\./ }).click();

      await page.waitForURL(/\/inventory/, { timeout: 15000 });
      await expect(page).toHaveURL(/\/inventory/);
    });
  });

  base.describe('Login screen elements', () => {
    base('displays all expected login screen elements', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByText('Bike Bin')).toBeVisible();
      await expect(page.getByText('From bikers to bikers')).toBeVisible();
      await expect(page.getByText('Browse without signing in')).toBeVisible();
      await expect(page.getByRole('button', { name: /Try the demo/ })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Dev Login' })).toBeVisible();
    });
  });

  test.describe('Sign Out', () => {
    test('signs out after confirming dialog and redirects to login', async ({
      loggedInPage: page,
    }) => {
      await navigateToProfile(page);

      // Click Sign Out — opens ConfirmDialog
      await page
        .getByRole('button', { name: /Sign Out/i })
        .first()
        .click();

      // Confirm in dialog
      await expect(page.getByText('Are you sure you want to sign out?')).toBeVisible({
        timeout: 5000,
      });
      await page.getByTestId('confirm-dialog-confirm').click();

      await page.waitForURL(/\/login/, { timeout: 15000 });
      await expect(page).toHaveURL(/\/login/);
    });

    test('stays on profile when sign out dialog is dismissed', async ({ loggedInPage: page }) => {
      await navigateToProfile(page);

      // Click Sign Out — opens ConfirmDialog
      await page
        .getByRole('button', { name: /Sign Out/i })
        .first()
        .click();

      // Dismiss by clicking Cancel
      await expect(page.getByText('Are you sure you want to sign out?')).toBeVisible({
        timeout: 5000,
      });
      await page.getByTestId('confirm-dialog-cancel').click();

      // Should still be on the profile page
      await page.waitForTimeout(500);
      await expect(page.getByRole('button', { name: /Sign Out/i }).first()).toBeVisible();
    });
  });

  test.describe('Session Persistence', () => {
    test('remains logged in when navigating directly to inventory', async ({
      loggedInPage: page,
    }) => {
      await page.goto('/inventory');

      // Verify we are still on inventory and not redirected to login
      await expect(page).toHaveURL(/\/inventory/);
      // Should not show login screen elements
      await expect(page.getByText('From bikers to bikers')).not.toBeVisible();
    });
  });
});
