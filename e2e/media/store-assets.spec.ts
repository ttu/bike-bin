/**
 * Marketing / App Store captures: PNG stills (raw + framed) and optional WebM + GIF.
 *
 * Prerequisites (same as E2E): local Supabase, `.env.local`, `psql` for globalThis setup.
 *
 * Run: npm run capture:media
 *
 * Authenticated inventory steps match `e2e/inventory-gallery.spec.ts` (layout switch → Components →
 * `visibleExactText` for **Maxxis Minion DHF/DHR Combo**) and use the **`loggedInPage`** fixture like
 * `e2e/inventory-authenticated.spec.ts`. The recording test uses `devLogin` + a scripted flow
 * (login hold → inventory → collection search → item detail → edit) because it builds a fresh
 * `browser.newContext()` (no fixture page).
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { test, expect, type Page } from '@playwright/test';

import { test as authTest, navigateToMessages, navigateToSearch } from '../fixtures';
import {
  devLogin,
  ensureCaptureDirs,
  GIF_DIR,
  screenshotWithPhoneFrame,
  VIDEO_DIR,
} from './capture-helpers';
import {
  INVENTORY_LAYOUT_TOGGLE_NAME,
  visibleExactText,
  waitForInventoryRowAfterComponentsFilter,
} from './inventoryCaptureFlow';
import { webmToGif } from '../../scripts/store-media/webmToGif';

/** Same seed row as `e2e/inventory-gallery.spec.ts` (after Components filter). */
const MAXXIS_ITEM_NAME = 'Maxxis Minion DHF/DHR Combo';

/**
 * Pacing for `browse-flow.webm` (holds and keystroke delay). `3` targets ~12s wall time;
 * was ~6s at `1.5`.
 */
const BROWSE_RECORDING_PACE = 3;

function browseRecordingMs(baseMs: number): number {
  return Math.round(baseMs * BROWSE_RECORDING_PACE);
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
});

authTest.describe('Store stills', () => {
  authTest(
    '02–07 authenticated inventory, detail, edit, search, messages',
    async ({ loggedInPage, context }) => {
      await expect(loggedInPage.getByRole('tablist')).toBeVisible({ timeout: 20_000 });
      await waitForInventoryRowAfterComponentsFilter(loggedInPage, MAXXIS_ITEM_NAME, {
        itemVisibilityTimeoutMs: 15_000,
      });
      await screenshotWithPhoneFrame(context, loggedInPage, '02-inventory-signed-in');

      await visibleExactText(loggedInPage, MAXXIS_ITEM_NAME).click();
      await loggedInPage.waitForURL(/\/inventory\/[a-zA-Z0-9-]+/, { timeout: 10_000 });
      await expect(loggedInPage.getByText('Condition')).toBeVisible({ timeout: 10_000 });
      await screenshotWithPhoneFrame(context, loggedInPage, '03-item-detail');

      const detailUrl = loggedInPage.url();
      const idMatch = detailUrl.match(/\/inventory\/([a-f0-9-]{36})/i);
      if (idMatch === null) {
        throw new Error(`Expected UUID item id in URL, got: ${detailUrl}`);
      }
      await loggedInPage.goto(`/inventory/edit/${idMatch[1]}`);
      await expect(loggedInPage.getByText('Edit item')).toBeVisible({ timeout: 15_000 });
      await screenshotWithPhoneFrame(context, loggedInPage, '04-item-edit');

      await loggedInPage.goto('/inventory');
      await expect(loggedInPage.getByRole('tablist')).toBeVisible({ timeout: 15_000 });
      await waitForInventoryRowAfterComponentsFilter(loggedInPage, MAXXIS_ITEM_NAME, {
        itemVisibilityTimeoutMs: 15_000,
      });

      await navigateToSearch(loggedInPage);
      const searchInput = loggedInPage.getByPlaceholder('Parts, tools, bikes...');
      await expect(searchInput).toBeVisible({ timeout: 15_000 });
      await searchInput.fill('a');
      await searchInput.press('Enter');
      await expectVisibleSearchResultsBanner(loggedInPage);
      await screenshotWithPhoneFrame(context, loggedInPage, '05-search-results');

      await navigateToMessages(loggedInPage);
      await expect(loggedInPage.getByText('Kai R.').first()).toBeVisible({ timeout: 15_000 });
      await screenshotWithPhoneFrame(context, loggedInPage, '06-messages-inbox');

      // Same flow as `e2e/messages-authenticated.spec.ts` — open seeded thread with Kai R.
      await loggedInPage.getByText('Kai R.').first().click();
      await expect(loggedInPage).toHaveURL(/\/messages\//, { timeout: 15_000 });
      await expect(loggedInPage.getByPlaceholder('Type a message...')).toBeVisible({
        timeout: 15_000,
      });
      await expect(
        loggedInPage.getByText('Thanks! I will bring it back Monday.').last(),
      ).toBeVisible({ timeout: 15_000 });
      await screenshotWithPhoneFrame(context, loggedInPage, '07-messages-thread');
    },
  );
});

/**
 * Marketing recording: inventory (all categories) → in-collection search → Maxxis row → detail →
 * header edit (pencil order as `e2e/inventory-crud.spec.ts`). No category chip change — search alone
 * narrows to the seed row.
 */
async function runRecordedInventorySearchToEditFlow(page: Page): Promise<void> {
  await expect(
    page.getByRole('switch', { name: INVENTORY_LAYOUT_TOGGLE_NAME, exact: true }),
  ).toBeVisible({ timeout: 45_000 });
  await page.waitForTimeout(browseRecordingMs(600));

  const collectionSearch = page.getByPlaceholder(/Search .*collection\.\.\./);
  await expect(collectionSearch).toBeVisible({ timeout: 15_000 });
  await collectionSearch.click();
  await collectionSearch.pressSequentially('maxxis', { delay: browseRecordingMs(120) });
  await expect(visibleExactText(page, MAXXIS_ITEM_NAME)).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(browseRecordingMs(500));

  await visibleExactText(page, MAXXIS_ITEM_NAME).click();
  await page.waitForURL(/\/inventory\/[a-zA-Z0-9-]+/, { timeout: 15_000 });
  await expect(page.getByText('Condition')).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(browseRecordingMs(500));

  await page.getByRole('button').nth(1).click();
  await page.waitForURL(/\/edit\//, { timeout: 15_000 });
  await expect(page.getByText('Edit item')).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(browseRecordingMs(900));
}

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

test.describe('Short screen recording', () => {
  test('browse flow WebM + GIF when ffmpeg is available', async ({ browser }, testInfo) => {
    const webmPath = path.join(VIDEO_DIR, 'browse-flow.webm');
    const gifPath = path.join(GIF_DIR, 'browse-flow.gif');

    const context = await browser.newContext({
      viewport: { width: 430, height: 932 },
      deviceScaleFactor: 3,
      // Encode WebM at physical pixels (3× logical) so footage is not soft vs framed PNGs.
      recordVideo: { dir: VIDEO_DIR, size: { width: 1290, height: 2796 } },
    });
    const page = await context.newPage();
    await devLogin(page, { holdOnLoginScreenMs: browseRecordingMs(1400) });
    await runRecordedInventorySearchToEditFlow(page);

    const video = page.video();
    await page.close();
    if (video !== null) {
      const recordedPath = path.resolve(await video.path());
      await video.saveAs(webmPath);
      const finalPath = path.resolve(webmPath);
      if (recordedPath !== finalPath) {
        await fs.unlink(recordedPath).catch((err: NodeJS.ErrnoException) => {
          if (err.code !== 'ENOENT') throw err;
        });
      }
    }
    await context.close();

    const converted = webmToGif(webmPath, gifPath);
    if (!converted) {
      testInfo.annotations.push({
        type: 'ffmpeg',
        description: `GIF skipped; WebM at ${webmPath} (install ffmpeg to enable).`,
      });
    }
  });
});
