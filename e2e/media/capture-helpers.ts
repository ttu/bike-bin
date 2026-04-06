import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import type { BrowserContext, Page } from '@playwright/test';

import {
  APP_STORE_67_HEIGHT,
  APP_STORE_67_WIDTH,
  buildFramedDeviceHtml,
} from '../../scripts/store-media/framedDeviceHtml';

export const CAPTURE_ROOT = path.join(process.cwd(), 'sites', 'marketing', 'public', 'captures');
export const RAW_DIR = path.join(CAPTURE_ROOT, 'raw');
export const FRAMED_DIR = path.join(CAPTURE_ROOT, 'framed');
export const VIDEO_DIR = path.join(CAPTURE_ROOT, 'video');
export const GIF_DIR = path.join(CAPTURE_ROOT, 'gif');

const FRAME_PADDING_PX = 120;

/** Same flow as E2E `Dev Login` — lands on inventory with seeded items. */
export async function devLogin(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForURL(/\/login/);
  await page.getByRole('button', { name: /Dev Login/ }).click();
  await page.waitForURL(/\/inventory/, { timeout: 20_000 });
}

export async function ensureCaptureDirs(): Promise<void> {
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
  await framePage.screenshot({ path: framedPath, animations: 'disabled' });
  await framePage.close();
}
