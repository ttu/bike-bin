import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { expect, type BrowserContext, type Page } from '@playwright/test';

import {
  APP_STORE_67_HEIGHT,
  APP_STORE_67_WIDTH,
  buildFramedDeviceHtml,
} from '../../scripts/store-media/framedDeviceHtml';

import { INVENTORY_LAYOUT_TOGGLE_NAME } from './inventoryCaptureFlow';

export const CAPTURE_ROOT = path.join(process.cwd(), 'sites', 'marketing', 'public', 'captures');
export const RAW_DIR = path.join(CAPTURE_ROOT, 'raw');
export const FRAMED_DIR = path.join(CAPTURE_ROOT, 'framed');
export const VIDEO_DIR = path.join(CAPTURE_ROOT, 'video');
export const GIF_DIR = path.join(CAPTURE_ROOT, 'gif');

const FRAME_PADDING_PX = 120;

export type DevLoginOptions = {
  /** Extra pause on the login route before Dev Login (e.g. marketing screen recording). */
  holdOnLoginScreenMs?: number;
};

/**
 * Same flow as E2E `Dev Login` — lands on inventory with seeded items.
 * Waits for the list/gallery switch (same readiness as `inventory-gallery.spec.ts`). Do not wait for
 * "Add item": the empty-state CTA reuses that label (`inventory.empty.cta`).
 */
export async function devLogin(page: Page, options?: DevLoginOptions): Promise<void> {
  await page.goto('/');
  await page.waitForURL(/\/login/);
  const hold = options?.holdOnLoginScreenMs ?? 0;
  if (hold > 0) {
    await expect(page.getByText('Bike Bin')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(hold);
  }
  await page.getByRole('button', { name: /Dev Login/ }).click();
  await page.waitForURL(/\/inventory/, { timeout: 20_000 });
  await expect(
    page.getByRole('switch', { name: INVENTORY_LAYOUT_TOGGLE_NAME, exact: true }),
  ).toBeVisible({ timeout: 45_000 });
}

export async function ensureCaptureDirs(): Promise<void> {
  await fs.rm(RAW_DIR, { recursive: true, force: true });
  await fs.rm(FRAMED_DIR, { recursive: true, force: true });
  await fs.rm(VIDEO_DIR, { recursive: true, force: true });
  await fs.rm(GIF_DIR, { recursive: true, force: true });
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(FRAMED_DIR, { recursive: true });
  await fs.mkdir(VIDEO_DIR, { recursive: true });
  await fs.mkdir(GIF_DIR, { recursive: true });
}

/**
 * Writes a full-resolution viewport PNG and a second PNG with a CSS phone frame.
 */
export async function screenshotWithPhoneFrame(
  context: BrowserContext,
  page: Page,
  baseName: string,
): Promise<void> {
  const rawPath = path.join(RAW_DIR, `${baseName}.png`);
  const framedPath = path.join(FRAMED_DIR, `${baseName}.png`);
  await page.screenshot({ path: rawPath, animations: 'disabled' });
  const bytes = await fs.readFile(rawPath);
  const html = buildFramedDeviceHtml(
    bytes.toString('base64'),
    APP_STORE_67_WIDTH,
    APP_STORE_67_HEIGHT,
  );
  const framePage = await context.newPage();
  const shellW = APP_STORE_67_WIDTH + 88;
  const shellH = APP_STORE_67_HEIGHT + 160;
  await framePage.setViewportSize({
    width: shellW + FRAME_PADDING_PX * 2,
    height: shellH + FRAME_PADDING_PX * 2,
  });
  await framePage.setContent(html, { waitUntil: 'load' });
  await framePage.screenshot({
    path: framedPath,
    animations: 'disabled',
    omitBackground: true,
  });
  await framePage.close();
}
