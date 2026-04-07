import { expect, type Page } from '@playwright/test';

/** Same string as `e2e/inventory-gallery.spec.ts` (`inventory.viewMode.toggleA11y`). */
export const INVENTORY_LAYOUT_TOGGLE_NAME = 'Switch between list and gallery layout';

/**
 * Same helper as `e2e/inventory-gallery.spec.ts` — avoids strict-mode / hidden-node issues on RN web.
 */
export function visibleExactText(page: Page, text: string) {
  return page.getByText(text, { exact: true }).filter({ visible: true });
}

export type WaitInventoryRowOptions = {
  /** Default matches main E2E (`inventory-gallery.spec.ts`). */
  layoutSwitchTimeoutMs?: number;
  /** After tapping Components, wait for the inventory row title (default 10s). */
  itemVisibilityTimeoutMs?: number;
};

/**
 * Same steps as `inventory-gallery.spec.ts` (list mode, before gallery toggle): wait for layout
 * switch, tap **Components**, wait for a visible row title.
 *
 * Do **not** use `getByRole('button', { name: /add item/i })` for readiness: the empty state CTA
 * uses the same label (`inventory.empty.cta`), so it passes while the list is still empty and the
 * layout switch is not mounted (`app/(tabs)/inventory/index.tsx`).
 *
 * If the switch never appears, the DB is empty or the app is not pointed at the seeded Supabase
 * (see `e2e/global-setup.ts` vs `EXPO_PUBLIC_SUPABASE_URL`).
 */
export async function waitForInventoryRowAfterComponentsFilter(
  page: Page,
  itemName: string,
  options?: WaitInventoryRowOptions,
): Promise<void> {
  const layoutSwitchTimeoutMs = options?.layoutSwitchTimeoutMs ?? 15_000;
  const itemVisibilityTimeoutMs = options?.itemVisibilityTimeoutMs ?? 10_000;
  await expect(
    page.getByRole('switch', { name: INVENTORY_LAYOUT_TOGGLE_NAME, exact: true }),
  ).toBeVisible({ timeout: layoutSwitchTimeoutMs });
  await page.getByRole('button', { name: 'Components' }).click();
  await expect(visibleExactText(page, itemName)).toBeVisible({ timeout: itemVisibilityTimeoutMs });
}
