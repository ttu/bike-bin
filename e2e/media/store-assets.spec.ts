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

import { expect, test, type Page } from '@playwright/test';

import {
  devLogin,
  ensureCaptureDirs,
  GIF_DIR,
  screenshotWithPhoneFrame,
  VIDEO_DIR,
} from './capture-helpers';
import { navigateToMessages, navigateToSearch } from '../fixtures';
import { webmToGif } from '../../scripts/store-media/webmToGif';

/** Seeded owner item (see `supabase/seed.sql`) — list must show real rows after Dev Login. */
const SEEDED_ITEM_NAME = 'RaceFace Turbine R Cranks';

/**
 * RN web can keep inactive tab screens in the DOM; find a visible "N results within … km" line.
 */
async function expectVisibleSearchResultsBanner(page: Page): Promise<void> {
  await expect(async () => {
    const lines = page.getByText(/\d+ results? within \d+ km/);
    const count = await lines.count();
    expect(count).toBeGreaterThan(0);
    let found = false;
    for (let i = 0; i < count; i++) {
      const line = lines.nth(i);
      if (await line.isVisible()) {
        await line.scrollIntoViewIfNeeded();
        await expect(line).toBeVisible();
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  }).toPass({ timeout: 15_000 });
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  await ensureCaptureDirs();
});

test.describe('Store stills', () => {
  test('01-login', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);
    await expect(page.getByText('Bike Bin')).toBeVisible();
    await screenshotWithPhoneFrame(context, page, '01-login');
  });

  test('02–06 authenticated inventory, detail, edit, search, messages', async ({
    page,
    context,
  }) => {
    await devLogin(page);

    await expect(page.getByText(SEEDED_ITEM_NAME).first()).toBeVisible({ timeout: 20_000 });
    await screenshotWithPhoneFrame(context, page, '02-inventory-signed-in');

    await page.getByText(SEEDED_ITEM_NAME).first().click();
    await page.waitForURL(/\/inventory\/[a-f0-9-]{36}/i, { timeout: 15_000 });
    await expect(page.getByText('Condition', { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });
    await screenshotWithPhoneFrame(context, page, '03-item-detail');

    const detailUrl = page.url();
    const idMatch = detailUrl.match(/\/inventory\/([a-f0-9-]{36})/i);
    if (idMatch === null) {
      throw new Error(`Expected UUID item id in URL, got: ${detailUrl}`);
    }
    const itemId = idMatch[1];
    await page.goto(`/inventory/edit/${itemId}`);
    await expect(page.getByText('Edit item')).toBeVisible({ timeout: 15_000 });
    await screenshotWithPhoneFrame(context, page, '04-item-edit');

    await page.goto('/inventory');
    await expect(page.getByRole('tablist')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(SEEDED_ITEM_NAME).first()).toBeVisible({ timeout: 15_000 });

    await navigateToSearch(page);
    const searchInput = page.getByPlaceholder('Parts, tools, bikes...');
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    await searchInput.fill('a');
    await searchInput.press('Enter');
    await expectVisibleSearchResultsBanner(page);
    await screenshotWithPhoneFrame(context, page, '05-search-results');

    await navigateToMessages(page);
    await expect(page.getByText('Kai R.').first()).toBeVisible({ timeout: 15_000 });
    await screenshotWithPhoneFrame(context, page, '06-messages-inbox');
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
    await devLogin(page);
    await expect(page.getByText(SEEDED_ITEM_NAME).first()).toBeVisible({ timeout: 20_000 });
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
