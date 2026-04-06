/**
 * Marketing / App Store captures: PNG stills (raw + framed) and optional WebM + GIF.
 *
 * Prerequisites (same as E2E): local Supabase, `.env.local`, `psql` for global setup.
 *
 * Run: npm run capture:media
 *
 * Raw PNGs match 6.7" App Store portrait (1290×2796). Framed PNGs add a CSS device shell
 * for the website — not an official Apple frame; swap assets if your legal/design rules require it.
 */
import * as path from 'node:path';

import { test, expect } from '@playwright/test';

import { ensureCaptureDirs, GIF_DIR, screenshotWithPhoneFrame, VIDEO_DIR } from './capture-helpers';
import { webmToGif } from '../../scripts/store-media/webmToGif';

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  await ensureCaptureDirs();
});

test.describe('Store stills', () => {
  test('login screen', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);
    await expect(page.getByText('Bike Bin')).toBeVisible();
    await screenshotWithPhoneFrame(context, page, '01-login');
  });

  test('guest inventory tab', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);
    await page.getByRole('button', { name: /Browse without signing in/ }).click();
    await page.waitForURL(/\/inventory/);
    await expect(page.getByRole('tablist')).toBeVisible();
    await screenshotWithPhoneFrame(context, page, '02-inventory-guest');
  });

  test('signed-in inventory (Dev Login)', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);
    await page.getByRole('button', { name: /Dev Login/ }).click();
    await page.waitForURL(/\/inventory/, { timeout: 20_000 });
    await expect(page.getByRole('tablist')).toBeVisible();
    await screenshotWithPhoneFrame(context, page, '03-inventory-signed-in');
  });
});

test.describe('Short screen recording', () => {
  test('browse flow WebM + GIF when ffmpeg is available', async ({ browser }) => {
    await ensureCaptureDirs();
    const webmPath = path.join(VIDEO_DIR, 'browse-flow.webm');
    const gifPath = path.join(GIF_DIR, 'browse-flow.gif');

    const context = await browser.newContext({
      viewport: { width: 430, height: 932 },
      deviceScaleFactor: 3,
      recordVideo: { dir: VIDEO_DIR, size: { width: 430, height: 932 } },
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForURL(/\/login/);
    await page.getByRole('button', { name: /Browse without signing in/ }).click();
    await page.waitForURL(/\/inventory/);
    await expect(page.getByRole('tablist')).toBeVisible();
    await page.waitForLoadState('networkidle');

    const video = page.video();
    await page.close();
    if (video !== null) {
      await video.saveAs(webmPath);
    }
    await context.close();

    const converted = webmToGif(webmPath, gifPath);
    if (!converted) {
      test.info().annotations.push({
        type: 'ffmpeg',
        description: `GIF skipped; WebM at ${webmPath} (install ffmpeg to enable).`,
      });
    }
  });
});
